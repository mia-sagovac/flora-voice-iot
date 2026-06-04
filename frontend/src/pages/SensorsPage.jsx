import { useState, useEffect, useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { fetchOverview, fetchSensorTimeseries } from '../api/client'
import styles from '../styles/SensorsPage.module.css'

const CHARTS = [
    { key: 'groundHumidity', label: 'Vlažnost tla (%)', unit: '%' },
    { key: 'temperature',    label: 'Temperatura (°C)', unit: '°C' },
    { key: 'humidity',       label: 'Vlaga zraka (%)', unit: '%' },
]

const PLANT_COLORS = ['var(--leaf)', 'var(--water)', 'var(--ember)', 'var(--sun)', 'var(--moss)', 'var(--clay)']

function fmtTime(ts) {
    return new Date(ts).toLocaleTimeString('hr-HR', { hour: '2-digit', minute: '2-digit' })
}

export default function SensorsPage() {
    const [plants, setPlants] = useState([])
    const [active, setActive] = useState('groundHumidity')
    const [isolated, setIsolated] = useState(null)
    const [seriesByPlant, setSeriesByPlant] = useState({})
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    useEffect(() => {
        fetchOverview()
            .then(res => setPlants(res.data.devices || []))
            .catch(() => setPlants([]))
    }, [])

    useEffect(() => {
        if (!plants.length) return
        let cancelled = false
        setLoading(true)
        setError(null)

        Promise.all(
            plants.map(p =>
                fetchSensorTimeseries(p.id, active, 24)
                    .then(res => ({ id: p.id, points: res.data?.series?.[active] || [] }))
                    .catch(() => ({ id: p.id, points: [] }))
            )
        )
            .then(results => {
                if (cancelled) return
                const map = {}
                results.forEach(r => { map[r.id] = r.points })
                setSeriesByPlant(map)
                setLoading(false)
            })
            .catch(() => {
                if (cancelled) return
                setError('Ne mogu dohvatiti povijest telemetrije')
                setLoading(false)
            })

        return () => { cancelled = true }
    }, [plants, active])

    const visiblePlants = useMemo(
        () => (isolated ? plants.filter(p => p.id === isolated) : plants),
        [plants, isolated]
    )

    const chartData = useMemo(() => {
        const buckets = new Map()
        visiblePlants.forEach(p => {
            (seriesByPlant[p.id] || []).forEach(({ ts, value }) => {
                if (!buckets.has(ts)) buckets.set(ts, { ts, time: fmtTime(ts) })
                buckets.get(ts)[p.id] = value
            })
        })
        return Array.from(buckets.values()).sort((a, b) => a.ts - b.ts)
    }, [visiblePlants, seriesByPlant])

    const chart = CHARTS.find(c => c.key === active)
    const colorOf = (plantId) => {
        const idx = plants.findIndex(p => p.id === plantId)
        return PLANT_COLORS[idx % PLANT_COLORS.length]
    }

    const tableRows = useMemo(() => {
        const rows = []
        visiblePlants.forEach(p => {
            (seriesByPlant[p.id] || []).forEach(({ ts, value }) => {
                rows.push({ ts, plant: p.name, value })
            })
        })
        return rows.sort((a, b) => b.ts - a.ts).slice(0, 12)
    }, [visiblePlants, seriesByPlant])

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <h1 className={styles.title}>Senzori</h1>
                <p className={styles.sub}>Povijesni pregled podataka senzora u zadnjih 24 sata</p>
            </div>

            <div className={styles.tabs}>
                {CHARTS.map(c => (
                    <button
                        key={c.key}
                        className={`${styles.tab} ${active === c.key ? styles.tabActive : ''}`}
                        onClick={() => setActive(c.key)}
                    >
                        {c.label}
                    </button>
                ))}
            </div>

            {plants.length > 1 && (
                <div className={styles.tabs}>
                    <button
                        className={`${styles.tab} ${isolated === null ? styles.tabActive : ''}`}
                        onClick={() => setIsolated(null)}
                    >
                        Sve biljke
                    </button>
                    {plants.map(p => (
                        <button
                            key={p.id}
                            className={`${styles.tab} ${isolated === p.id ? styles.tabActive : ''}`}
                            onClick={() => setIsolated(p.id)}
                        >
                            {p.name}
                        </button>
                    ))}
                </div>
            )}

            <div className={styles.chartCard}>
                {loading ? (
                    <div className={styles.chartState}>Učitavam podatke...</div>
                ) : error ? (
                    <div className={styles.chartState}>{error}</div>
                ) : chartData.length === 0 ? (
                    <div className={styles.chartState}>Nema podataka u zadnjih 24 sata</div>
                ) : (
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(44,26,14,0.06)" />
                            <XAxis dataKey="time" tick={{ fontSize: 11, fill: 'var(--clay)' }} minTickGap={40} />
                            <YAxis tick={{ fontSize: 11, fill: 'var(--clay)' }} unit={chart.unit} />
                            <Tooltip
                                contentStyle={{
                                    background: 'var(--paper)',
                                    border: '1px solid var(--mist)',
                                    borderRadius: '8px',
                                    fontFamily: 'var(--font-mono)',
                                    fontSize: '0.8rem',
                                }}
                            />
                            <Legend wrapperStyle={{ fontSize: '0.78rem' }} />
                            {visiblePlants.map(p => (
                                <Line
                                    key={p.id}
                                    type="monotone"
                                    dataKey={p.id}
                                    name={p.name}
                                    stroke={colorOf(p.id)}
                                    strokeWidth={2.5}
                                    dot={false}
                                    activeDot={{ r: 5, strokeWidth: 0 }}
                                    connectNulls
                                />
                            ))}
                        </LineChart>
                    </ResponsiveContainer>
                )}
            </div>

            <div className={styles.tableWrap}>
                <table className={styles.table}>
                    <thead>
                    <tr>
                        <th>Vrijeme</th>
                        <th>Biljka</th>
                        <th>{chart.label}</th>
                    </tr>
                    </thead>
                    <tbody>
                    {tableRows.length ? tableRows.map((row, i) => (
                        <tr key={i}>
                            <td>{fmtTime(row.ts)}</td>
                            <td>{row.plant}</td>
                            <td>{typeof row.value === 'number' ? `${row.value}${chart.unit}` : row.value}</td>
                        </tr>
                    )) : (
                        <tr><td colSpan={3}>—</td></tr>
                    )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}