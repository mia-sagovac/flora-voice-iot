import { useState, useEffect, useMemo } from 'react'
import { fetchOverview, fetchWeather } from '../api/client'
import styles from '../styles/WeatherPage.module.css'

const FALLBACK = { latitude: 45.8003, longitude: 15.9697, city: 'Zagreb' }
const DRY_THRESHOLD = 25

function weatherInfo(code) {
    if (code === 0) return { icon: 'fa-sun', label: 'Vedro', rainy: false }
    if (code >= 1 && code <= 2) return { icon: 'fa-cloud-sun', label: 'Djelomično oblačno', rainy: false }
    if (code === 3) return { icon: 'fa-cloud', label: 'Oblačno', rainy: false }
    if (code >= 45 && code <= 48) return { icon: 'fa-smog', label: 'Magla', rainy: false }
    if (code >= 51 && code <= 57) return { icon: 'fa-cloud-rain', label: 'Rosulja', rainy: true }
    if (code >= 61 && code <= 67) return { icon: 'fa-cloud-showers-heavy', label: 'Kiša', rainy: true }
    if (code >= 71 && code <= 77) return { icon: 'fa-snowflake', label: 'Snijeg', rainy: false }
    if (code >= 80 && code <= 82) return { icon: 'fa-cloud-showers-heavy', label: 'Pljuskovi', rainy: true }
    if (code >= 95) return { icon: 'fa-cloud-bolt', label: 'Grmljavina', rainy: true }
    return { icon: 'fa-cloud', label: 'Oblačno', rainy: false }
}

const DAY_NAMES = ['Ned', 'Pon', 'Uto', 'Sri', 'Čet', 'Pet', 'Sub']
function dayLabel(dateStr, index) {
    if (index === 0) return 'Danas'
    return DAY_NAMES[new Date(dateStr).getDay()]
}

function plantWeatherMessage(soil, isRaining, rainSoon) {
    const dry = soil != null && soil < DRY_THRESHOLD
    if (dry && isRaining) return { icon: 'fa-cloud-showers-heavy', text: 'Žedna sam ali ne moraš me zaljevati jer kiši.' }
    if (dry && rainSoon) return { icon: 'fa-hourglass-half', text: 'Žedna sam, ali uskoro stiže kiša — pričekaj malo prije zalijevanja.' }
    if (dry) return { icon: 'fa-exclamation-triangle', text: 'Žedna sam, a kiše nema na vidiku — zalij me!' }
    if (soil != null && soil >= 70 && isRaining) return { icon: 'fa-droplet', text: 'Već sam dovoljno mokra, a još i kiši — nikako me ne zalijevaj.' }
    if (isRaining) return { icon: 'fa-smile', text: 'Kiši i osjećam se odlično, nije mi potrebno zalijevanje.' }
    return { icon: 'fa-seedling', text: 'Vlažnost mi je u redu, sve je super.' }
}

export default function WeatherPage() {
    const [plants, setPlants] = useState([])
    const [location, setLocation] = useState(null)
    const [weather, setWeather] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        fetchOverview()
            .then(res => {
                const list = res.data.devices || []
                setPlants(list)
                const withLoc = list.find(p => p.location?.latitude != null && p.location?.longitude != null)
                setLocation(withLoc
                    ? { latitude: withLoc.location.latitude, longitude: withLoc.location.longitude, city: withLoc.location.city || 'Lokacija' }
                    : FALLBACK)
            })
            .catch(() => {
                setPlants([])
                setLocation(FALLBACK)
            })
    }, [])

    useEffect(() => {
        if (!location) return
        setLoading(true)
        setError(null)
        fetchWeather(location.latitude, location.longitude)
            .then(res => {
                setWeather(res.data)
                setLoading(false)
            })
            .catch(() => {
                setError('Ne mogu dohvatiti vremensku prognozu')
                setLoading(false)
            })
    }, [location])

    const current = weather?.current
    const currentInfo = current ? weatherInfo(current.weatherCode) : null
    const today = weather?.daily?.[0]
    const tomorrow = weather?.daily?.[1]

    const isRaining = !!(current && (current.precipitation > 0 || weatherInfo(current.weatherCode).rainy))
    const rainSoon = !!((today?.rainChance ?? 0) > 60 || (tomorrow?.rainChance ?? 0) > 60)

    const plantMessages = useMemo(
        () => plants.map(p => ({
            id: p.id,
            name: (p.name || '').split('_')[0] || p.name,
            soil: p.telemetry?.groundHumidity,
            ...plantWeatherMessage(p.telemetry?.groundHumidity, isRaining, rainSoon),
        })),
        [plants, isRaining, rainSoon]
    )

    if (loading || !location) {
        return (
            <div className={styles.page}>
                <div className={styles.header}>
                    <h1 className={styles.title}>Vremenska prognoza</h1>
                    <p className={styles.sub}>Učitavam podatke...</p>
                </div>
            </div>
        )
    }

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <h1 className={styles.title}>Vremenska prognoza</h1>
                <p className={styles.sub}>Open-Meteo integracija — prilagodba zalijevanja prema prognozi</p>
            </div>

            {error ? (
                <div className={styles.banner}>
                    <span className={styles.bannerIcon}><i className="fa-solid fa-triangle-exclamation" aria-hidden="true" /></span>
                    <div>
                        <strong>Greška pri dohvaćanju vremena</strong>
                        <p>{error}</p>
                    </div>
                </div>
            ) : (
                <>
                    <div className={styles.sectionTitle}>Trenutno — {location.city}</div>

                    <div className={styles.todayCard}>
                        <div className={styles.todayLeft}>
                            <span className={styles.todayIcon}><i className={`fa-solid ${currentInfo.icon}`} aria-hidden="true" /></span>
                            <div>
                                <div className={styles.todayLabel}>{currentInfo.label}</div>
                                <div className={styles.todayTemp}>
                                    {Math.round(current.temperature)}°
                                    {today && <span className={styles.todayLow}>/{Math.round(today.tempMin)}°</span>}
                                </div>
                            </div>
                        </div>
                        <div className={styles.todayStats}>
                            <div className={styles.todayStat}>
                                <span className={styles.todayStatLabel}>Vjerojatnost kiše</span>
                                <span className={styles.todayStatVal} style={{ color: (today?.rainChance ?? 0) > 50 ? 'var(--water)' : 'var(--clay)' }}>
                  {today?.rainChance ?? '--'}%
                </span>
                            </div>
                            <div className={styles.todayStat}>
                                <span className={styles.todayStatLabel}>Vlaga zraka</span>
                                <span className={styles.todayStatVal}>{Math.round(current.humidity)}%</span>
                            </div>
                            <div className={styles.todayStat}>
                                <span className={styles.todayStatLabel}>Vjetar</span>
                                <span className={styles.todayStatVal}>{Math.round(current.windSpeed)} km/h</span>
                            </div>
                        </div>
                    </div>

                    <div className={`${styles.recommendCard} ${rainSoon ? styles.recSkip : styles.recWater}`}>
            <span className={styles.recIcon}>
              <i className={`fa-solid ${rainSoon ? 'fa-cloud-showers-heavy' : 'fa-droplet'}`} aria-hidden="true" />
            </span>
                        <div>
                            <strong className={styles.recTitle}>
                                {rainSoon ? 'Preporučeno: preskoči zalijevanje' : 'Zalijevanje može biti potrebno'}
                            </strong>
                            <p className={styles.recDesc}>
                                {rainSoon
                                    ? 'U sljedećih dan-dva očekuje se kiša (>60%). Sustav preporučuje da ne zalijevate biljke.'
                                    : 'Nema značajnih oborina u prognozi. Pratite vlažnost tla.'}
                            </p>
                        </div>
                    </div>

                    <div className={styles.sectionTitle} style={{ marginTop: 28 }}>Poruke biljaka</div>
                    <div className={styles.plantMsgList}>
                        {plantMessages.length ? plantMessages.map(m => (
                            <div key={m.id} className={styles.plantMsgRow}>
                                    <span className={styles.plantMsgEmoji}>{m.icon ? <i className={`fa-solid ${m.icon}`} aria-hidden="true" /> : null}</span>
                                <div className={styles.plantMsgBody}>
                                    <span className={styles.plantMsgName}>{m.name}</span>
                                    <span className={styles.plantMsgText}>{m.text}</span>
                                </div>
                                <span className={styles.plantMsgSoil}>{m.soil != null ? `${Math.round(m.soil)}%` : '--'}</span>
                            </div>
                        )) : (
                            <div className={styles.plantMsgRow}><span className={styles.plantMsgText}>Nema biljaka za prikaz.</span></div>
                        )}
                    </div>

                    <div className={styles.sectionTitle} style={{ marginTop: 28 }}>5-dnevna prognoza</div>
                    <div className={styles.forecastRow}>
                        {(weather?.daily || []).map((f, i) => {
                            const info = weatherInfo(f.weatherCode)
                            return (
                                <div key={i} className={`${styles.forecastCard} ${i === 0 ? styles.forecastToday : ''}`}>
                                    <span className={styles.forecastDay}>{dayLabel(f.date, i)}</span>
                                    <span className={styles.forecastIcon}><i className={`fa-solid ${info.icon}`} aria-hidden="true" /></span>
                                    <span className={styles.forecastHigh}>{Math.round(f.tempMax)}°</span>
                                    <span className={styles.forecastLow}>{Math.round(f.tempMin)}°</span>
                                    <div className={styles.rainChance} title="Vjerojatnost kiše">
                    <span style={{ color: (f.rainChance ?? 0) > 60 ? 'var(--water)' : 'var(--clay)' }}>
                      <i className="fa-solid fa-droplet" aria-hidden="true" /> {f.rainChance ?? 0}%
                    </span>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </>
            )}
        </div>
    )
}