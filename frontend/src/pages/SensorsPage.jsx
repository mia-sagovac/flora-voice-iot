import { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import styles from '../styles/SensorsPage.module.css'

// nekakvi simularinai podaci, rpomijenti kada dode pravi!!
function generateHistory(n = 20) {
  const now = Date.now()
  return Array.from({ length: n }, (_, i) => ({
    time: new Date(now - (n - 1 - i) * 5 * 60 * 1000).toLocaleTimeString('hr-HR', { hour: '2-digit', minute: '2-digit' }),
    moisture: Math.round(30 + 20 * Math.sin(i / 3) + Math.random() * 5),
    temp: +(20 + 4 * Math.sin(i / 4) + Math.random()).toFixed(1),
    humidity: Math.round(50 + 15 * Math.cos(i / 5) + Math.random() * 5),
    light: Math.round(400 + 300 * Math.abs(Math.sin(i / 6)) + Math.random() * 50),
  }))
}

const CHARTS = [
  { key: 'moisture', label: 'Vlažnost tla (%)', color: 'var(--leaf)', unit: '%' },
  { key: 'temp',     label: 'Temperatura (°C)', color: 'var(--ember)', unit: '°C' },
  { key: 'humidity', label: 'Vlaga zraka (%)', color: 'var(--water)', unit: '%' },
  { key: 'light',    label: 'Svjetlost (Lux)', color: 'var(--sun)', unit: '' },
]

export default function SensorsPage() {
  const [data] = useState(() => generateHistory())
  const [active, setActive] = useState('moisture')

  const chart = CHARTS.find(c => c.key === active)

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Senzori</h1>
        <p className={styles.sub}>Povijesni pregled podataka senzora u zadnjih 100 min</p>
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

      <div className={styles.chartCard}>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(44,26,14,0.06)" />
            <XAxis dataKey="time" tick={{ fontSize: 11, fill: 'var(--clay)' }} />
            <YAxis tick={{ fontSize: 11, fill: 'var(--clay)' }} />
            <Tooltip
              contentStyle={{
                background: 'var(--paper)',
                border: '1px solid var(--mist)',
                borderRadius: '8px',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.8rem',
              }}
            />
            <Line
              type="monotone"
              dataKey={active}
              stroke={chart.color}
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 5, strokeWidth: 0 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Vrijeme</th>
              <th>Vlažnost tla</th>
              <th>Temp.</th>
              <th>Vlaga zraka</th>
              <th>Svjetlost</th>
            </tr>
          </thead>
          <tbody>
            {[...data].reverse().slice(0, 8).map((row, i) => (
              <tr key={i}>
                <td>{row.time}</td>
                <td>{row.moisture}%</td>
                <td>{row.temp}°C</td>
                <td>{row.humidity}%</td>
                <td>{row.light}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
