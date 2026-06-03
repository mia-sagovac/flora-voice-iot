import { useState, useEffect } from 'react'
import { fetchOverview } from '../api/client'
import { useLiveTelemetry } from '../api/useLiveTelemetry'
import styles from '../styles/PlantPage.module.css'

const MESSAGES = [
  { mood: 'thirsty', soil: [0, 25], msgs: [
    'Hej! Mislim da sam malo žedan...',
    'Zamislite da ste vi zaboravili jesti cijeli dan. Tako se ja osjećam!',
    'Moje korijenje traži vodu! Molim zalij me ubrzo.',
    'Znaš onaj osjećaj suhog grla? Upravo to imam.',
  ]},
  { mood: 'could-use', soil: [25, 40], msgs: [
    'Pomalo bih se osvježio, ali nije hitno.',
    'Tlo je malo sušnije nego što volim, no još me neko vrijeme.',
    'Ako si slobodan, zalijevanje bi dobrodošlo!',
  ]},
  { mood: 'happy', soil: [40, 70], msgs: [
    'Savršeno se osjećam! Hvala što brineš za mene...',
    'Tlo je idealne vlažnosti. Danas ću rasti!',
    'Sunce, prava temperatura, dobra vlaga — što više trebam?',
    'Osjećam se kao šumska vila. Odlično mi je!',
  ]},
  { mood: 'wet', soil: [70, 100], msgs: [
    'Malo previše vode... Ne moram sada biti zalijevano.',
    'Čuvaj se prekomjernog zalijevanja — i meni nije zdravo!',
    'Hvala, ali osjećam se kao da stojim u lokvi...',
  ]},
]

function getMessages(moisture) {
  return MESSAGES.find(m => moisture >= m.soil[0] && moisture < m.soil[1]) || MESSAGES[2]
}

export default function PlantPage() {
  const { latest } = useLiveTelemetry()
  const [plants, setPlants] = useState([])

  useEffect(() => {
    fetchOverview()
      .then(res => {
        const list = (res.data.devices || []).map(device => ({
          ...device,
          telemetry: device.telemetry || {},
        }))
        setPlants(list)
      })
      .catch(() => setPlants([]))
  }, [])

  useEffect(() => {
    if (!latest?.data) return
    const deviceId = latest.device_id
    const telemetry = latest.data
    setPlants(prev =>
      prev.map((plant) =>
        plant.id === deviceId
          ? { ...plant, telemetry: { ...plant.telemetry, ...telemetry } }
          : plant
      )
    )
  }, [latest])

  const getPlantStatus = (soilMoisture) => {
    if (soilMoisture == null) return { label: 'Nema podataka', mood: 'happy', color: 'var(--clay)' }
    if (soilMoisture < 25) return { label: 'Suha', mood: 'thirsty', color: 'var(--ember)' }
    if (soilMoisture < 40) return { label: 'Umjereno', mood: 'could-use', color: 'var(--sun)' }
    if (soilMoisture < 70) return { label: 'Zdrava', mood: 'happy', color: 'var(--leaf)' }
    return { label: 'Prezasićena', mood: 'wet', color: 'var(--water)' }
  }

  const plantMessage = (soilMoisture) => {
    const msgs = getMessages(soilMoisture).msgs
    return msgs[0] || ''
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Moje biljke</h1>
        <p className={styles.sub}>Pogledaj sve svoje biljke i vidi što svaka od njih govori</p>
      </div>

      <div className={styles.plantsGrid}>
        {plants.length ? plants.map((plant) => {
          const telemetry = plant.telemetry || {}
          const soil = telemetry.groundHumidity
          const temp = telemetry.temperature
          const humidity = telemetry.humidity
          const status = getPlantStatus(soil)

          return (
            <article key={plant.id} className={styles.plantCard}>
              <div className={styles.plantCardLeft}>
                <div className={styles.plantHeader}>
                  <div className={styles.plantFig}>
                    <BigPlant mood={status.mood} />
                  </div>
                  <div>
                    <h2 className={styles.plantName}>{plant.name}</h2>
                    <div className={styles.plantHealthBadge} style={{ background: `${status.color}22`, color: status.color }}>
                      {status.label}
                    </div>
                    <div className={styles.sensorInfo}>Senzor: {plant.name}</div>
                  </div>
                </div>

                <div className={styles.plantMetrics}>
                  <div className={styles.metricRow}>
                    <span>Vlažnost tla</span>
                    <strong>{soil != null ? `${Math.round(soil)}%` : '--'}</strong>
                  </div>
                  <div className={styles.metricRow}>
                    <span>Temperatura</span>
                    <strong>{temp != null ? `${temp.toFixed(1)}°C` : '--'}</strong>
                  </div>
                  <div className={styles.metricRow}>
                    <span>Vlaga zraka</span>
                    <strong>{humidity != null ? `${Math.round(humidity)}%` : '--'}</strong>
                  </div>
                </div>
              </div>

              <div className={styles.plantCardRight}>
                <div className={styles.bubbleLabel}>Što biljka govori</div>
                <div className={styles.bubbleSmall}>
                  <p className={styles.bubbleText}>{plantMessage(soil)}</p>
                </div>
              </div>
            </article>
          )
        }) : (
          <div className={styles.emptyState}>Učitavam biljke...</div>
        )}
      </div>
    </div>
  )
}

function BigPlant({ mood }) {
  const color = mood === 'happy' ? '#5A8A3C' : mood === 'thirsty' ? '#B8A070' : mood === 'wet' ? '#4A90C4' : '#8BBF5A'
  return (
    <svg width="120" height="150" viewBox="0 0 120 150" fill="none" style={{ animation: 'float 4s ease-in-out infinite' }}>
      <path d="M38 130h44l-6 14H44L38 130z" fill="#8B5E3C" />
      <rect x="32" y="124" width="56" height="8" rx="4" fill="#A0714A" />
      <ellipse cx="60" cy="128" rx="22" ry="5" fill="#4A2E1A" opacity="0.5" />
      <path d="M60 124V70" stroke={color} strokeWidth="3" strokeLinecap="round" />
      <path d="M60 100 C50 90 36 90 32 82 C36 76 50 76 60 86" fill={color} opacity="0.9" />
      <path d="M60 88 C70 78 84 78 88 70 C84 64 70 64 60 74" fill={color} opacity="0.8" />
      <path d="M60 76 C52 68 42 66 40 58 C44 54 54 58 60 66" fill={color} opacity="0.7" />
      <path d="M60 64 C68 56 78 54 80 46 C76 42 66 46 60 54" fill={color} opacity="0.6" />
    </svg>
  )
}
