import { useState, useEffect } from 'react'
import { fetchTestData, fetchSensorTelemetry } from '../api/client'
import { useAuth } from '../context/AuthContext'
import styles from '../styles/DashboardPage.module.css'

function useSensorData() {
  const [data, setData] = useState({
    soilMoisture: null,
    airTemp: null,
    airHumidity: null,
    lastWatered: '--',
    pumpActive: false,
  })
  const [error, setError] = useState(null)

  useEffect(() => {
    let mounted = true

    const load = async () => {
      try {
        const response = await fetchSensorTelemetry()
        const sensor = response.data?.data || {}

        if (!mounted) return

        setData({
          soilMoisture: sensor.groundHumidity ?? null,
          airTemp: sensor.temperature ?? null,
          airHumidity: sensor.humidity ?? null,
          lastWatered: '--',
          pumpActive: false,
        })
        setError(null)
      } catch (err) {
        if (!mounted) return
        setError('Ne mogu dohvatiti live senzore')
      }
    }

    load()
    const interval = setInterval(load, 10000)
    return () => {
      mounted = false
      clearInterval(interval)
    }
  }, [])

  return { ...data, error }
}

function getPlantMood(soil) {
  if (soil == null) return { emoji: '🤔', msg: 'Čekam live senzore...', color: 'var(--water)', urgency: 'wet' }
  if (soil < 25) return { emoji: '😰', msg: 'Žedan sam, zalij me!', color: 'var(--ember)', urgency: 'high' }
  if (soil < 40) return { emoji: '😕', msg: 'Pomalo bih se osvježio...', color: 'var(--sun)', urgency: 'medium' }
  if (soil < 70) return { emoji: '😊', msg: 'Savršeno! Osjećam se odlično.', color: 'var(--leaf)', urgency: 'good' }
  return { emoji: '😅', msg: 'Danas mi nije potrebno zalijevanje.', color: 'var(--water)', urgency: 'wet' }
}

export default function DashboardPage() {
  const sensors = useSensorData()
  const { user } = useAuth()
  const mood = getPlantMood(sensors.soilMoisture)
  const [connectionOk, setConnectionOk] = useState(null)
  const [wateringNow, setWateringNow] = useState(false)

  useEffect(() => {
    fetchTestData()
      .then(() => setConnectionOk(true))
      .catch(() => setConnectionOk(false))
  }, [])

  const triggerWatering = () => {
    setWateringNow(true)
    setTimeout(() => setWateringNow(false), 4000)
  }

  const now = new Date()
  const timeStr = now.toLocaleTimeString('hr-HR', { hour: '2-digit', minute: '2-digit' })
  const dateStr = now.toLocaleDateString('hr-HR', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <div className={styles.page}>
      {/* header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.greeting}>Dobrodošao, {user?.username?.split('@')[0] || 'Vlasnik'} <i className="fa-solid fa-leaf" aria-hidden="true" /></h1>
          <p className={styles.date}>{dateStr} · {timeStr}</p>
        </div>
        <div className={`${styles.connBadge} ${connectionOk === true ? styles.connOk : connectionOk === false ? styles.connFail : styles.connPending}`}>
          <span className={styles.connDot} />
          {connectionOk === true ? 'Povezan' : connectionOk === false ? 'Offline' : 'Provjera...'}
        </div>
      </div>

      {/* speech baloncice */}
      <div className={`${styles.plantCard} ${styles[mood.urgency]}`}>
        <div className={styles.plantViz}>
          <PlantIllustration moisture={sensors.soilMoisture} />
          {wateringNow && (
            <>
              <div className={`${styles.drip} ${styles.d1}`} />
              <div className={`${styles.drip} ${styles.d2}`} />
              <div className={`${styles.drip} ${styles.d3}`} />
            </>
          )}
        </div>
        <div className={styles.speechWrap}>
          <div className={styles.speech}>
            <span className={styles.speechEmoji}>{mood.emoji}</span>
            <p className={styles.speechText}>{mood.msg}</p>
          </div>
          <div className={styles.moistureBar}>
            <span className={styles.moistureLabel}>Vlažnost tla</span>
            <div className={styles.barTrack}>
              <div
                className={styles.barFill}
                style={{ width: `${sensors.soilMoisture}%`, background: mood.color }}
              />
            </div>
            <span className={styles.moistureVal}>{Math.round(sensors.soilMoisture)}%</span>
          </div>
        </div>
      </div>

      {/* grid senzora */}
      <div className={styles.sectionTitle}>Senzori — uživo</div>
      <div className={styles.sensorGrid}>
        <SensorCard icon={<i className="fa-solid fa-thermometer-half" aria-hidden="true" />} label="Temperatura" value={`${sensors.airTemp ?? '--'}°C`} sub="Zrak" color="var(--ember)" />
        <SensorCard icon={<i className="fa-solid fa-droplet" aria-hidden="true" />} label="Vlaga zraka" value={`${sensors.airHumidity ?? '--'}%`} sub="Rel. vlažnost" color="var(--water)" />
        <SensorCard icon={<i className="fa-solid fa-seedling" aria-hidden="true" />} label="Vlažnost tla" value={`${sensors.soilMoisture != null ? Math.round(sensors.soilMoisture) : '--'}%`} sub="ESP32 sensor" color="var(--leaf)" />
      </div>

      {/* upravljanje zalijevanjem */}
      <div className={styles.sectionTitle}>Upravljanje pumpom</div>
      <div className={styles.waterPanel}>
        <div className={styles.waterInfo}>
          <div className={styles.waterStat}>
            <span className={styles.waterStatLabel}>Zadnje zalijevanje</span>
            <span className={styles.waterStatVal}>Prije {sensors.lastWatered}</span>
          </div>
          <div className={styles.waterStat}>
            <span className={styles.waterStatLabel}>Preporuka</span>
            <span className={styles.waterStatVal} style={{ color: mood.urgency === 'high' ? 'var(--ember)' : 'var(--leaf)' }}>
              {mood.urgency === 'high' || mood.urgency === 'medium' ? 'Zalij odmah' : 'Nije potrebno'}
            </span>
          </div>
          <div className={styles.waterStat}>
            <span className={styles.waterStatLabel}>Način rada</span>
            <span className={styles.waterStatVal}>Manualni</span>
          </div>
        </div>
        <button
          className={`${styles.pumpBtn} ${wateringNow ? styles.pumpActive : ''}`}
          onClick={triggerWatering}
          disabled={wateringNow}
        >
          <span className={styles.pumpBtnIcon}><i className="fa-solid fa-droplet" aria-hidden="true" /></span>
          <span>{wateringNow ? 'Pumpa radi...' : 'Pokreni pumpu'}</span>
        </button>
      </div>

      {/* status */}
      <div className={styles.sectionTitle}>Status sustava</div>
      <div className={styles.statusRow}>
        <StatusChip ok label="ESP32" desc="Povezan" />
        <StatusChip ok={connectionOk === true} label="Backend API" desc={connectionOk === true ? 'Aktivan' : 'Nedostupan'} />
        <StatusChip ok label="ThingsBoard" desc="Cloud" />
        <StatusChip ok={false} label="WeatherAPI" desc="Nije konfiguriran" />
      </div>
    </div>
  )
}

function SensorCard({ icon, label, value, sub, color }) {
  return (
    <div className={styles.sCard}>
      <span className={styles.sCardIcon}>{icon}</span>
      <div>
        <div className={styles.sCardVal} style={{ color }}>{value}</div>
        <div className={styles.sCardLabel}>{label}</div>
        <div className={styles.sCardSub}>{sub}</div>
      </div>
    </div>
  )
}

function StatusChip({ ok, label, desc }) {
  return (
    <div className={`${styles.chip} ${ok ? styles.chipOk : styles.chipFail}`}>
      <span className={styles.chipDot} />
      <div>
        <div className={styles.chipLabel}>{label}</div>
        <div className={styles.chipDesc}>{desc}</div>
      </div>
    </div>
  )
}

function PlantIllustration({ moisture }) {
  const green = moisture > 40 ? '#5A8A3C' : moisture > 25 ? '#8BBF5A' : '#B8C4A0'
  return (
    <svg width="80" height="100" viewBox="0 0 80 100" fill="none" style={{ animation: 'float 4s ease-in-out infinite' }}>
      {/* loncanica */}
      <path d="M22 72h36l-4 20H26L22 72z" fill="#8B5E3C" />
      <rect x="18" y="68" width="44" height="6" rx="3" fill="#A0714A" />
      {/* zemlja */}
      <ellipse cx="40" cy="71" rx="18" ry="4" fill="#4A2E1A" opacity="0.6" />
      {/* stablo */}
      <path d="M40 68V40" stroke={green} strokeWidth="2.5" strokeLinecap="round" />
      {/* listovi */}
      <path d="M40 55 C34 48 26 48 24 43 C26 40 34 40 40 47" fill={green} opacity="0.9" />
      <path d="M40 48 C46 42 54 42 56 37 C54 34 46 34 40 41" fill={green} opacity="0.8" />
      <path d="M40 42 C36 38 30 36 30 32 C32 30 38 32 40 38" fill={green} opacity="0.7" />
    </svg>
  )
}
