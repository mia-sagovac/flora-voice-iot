import { useState, useEffect } from 'react'
import { fetchMyDevices, fetchSensorTelemetry, triggerPump } from '../api/client'
import { useLiveTelemetry } from '../api/useLiveTelemetry'
import { useAuth } from '../context/AuthContext'
import styles from '../styles/DashboardPage.module.css'

function getPlantMood(soil) {
  if (soil == null) return { emoji: '🤔', msg: 'Čekam live senzore...', color: 'var(--water)', urgency: 'wet' }
  if (soil < 25) return { emoji: '😰', msg: 'Žedan sam, zalij me!', color: 'var(--ember)', urgency: 'high' }
  if (soil < 40) return { emoji: '😕', msg: 'Pomalo bih se osvježio...', color: 'var(--sun)', urgency: 'medium' }
  if (soil < 70) return { emoji: '😊', msg: 'Savršeno! Osjećam se odlično.', color: 'var(--leaf)', urgency: 'good' }
  return { emoji: '😅', msg: 'Danas mi nije potrebno zalijevanje.', color: 'var(--water)', urgency: 'wet' }
}

export default function DashboardPage() {
  const { user } = useAuth()
  const { latest, connected } = useLiveTelemetry()

  const [device, setDevice] = useState(null)      // { id, name }
  const [sensors, setSensors] = useState({ soilMoisture: null, airTemp: null, airHumidity: null })
  const [connectionOk, setConnectionOk] = useState(null)
  const [wateringNow, setWateringNow] = useState(false)
  const [pumpError, setPumpError] = useState(null)

  // 1. dohvati MOJE uredjaje (backend customer_id izvodi iz tokena), uzmi prvi
  useEffect(() => {
    fetchMyDevices()
      .then(res => {
        const list = res.data.devices || []
        if (list.length) setDevice(list[0])
        setConnectionOk(true)
      })
      .catch(() => setConnectionOk(false))
  }, [])

  // 2. jednokratno inicijalno stanje cim znamo koji je device
  useEffect(() => {
    if (!device) return
    fetchSensorTelemetry(device.id)
      .then(res => {
        const d = res.data?.data || {}
        setSensors(s => ({
          ...s,
          soilMoisture: d.groundHumidity ?? s.soilMoisture,
          airTemp: d.temperature ?? s.airTemp,
          airHumidity: d.humidity ?? s.airHumidity,
        }))
      })
      .catch(() => {})
  }, [device])

  // 3. live update s WebSocketa — samo za nas device
  useEffect(() => {
    if (!latest?.data) return
    if (device && latest.device_id && latest.device_id !== device.id) return
    const d = latest.data
    setSensors(s => ({
      ...s,
      soilMoisture: d.groundHumidity ?? s.soilMoisture,
      airTemp: d.temperature ?? s.airTemp,
      airHumidity: d.humidity ?? s.airHumidity,
    }))
  }, [latest, device])

  useEffect(() => {
    const refreshId = setInterval(() => window.location.reload(), 4000)
    return () => clearInterval(refreshId)
  }, [])

  const mood = getPlantMood(sensors.soilMoisture)

  const triggerWatering = async () => {
    if (!device) return
    setWateringNow(true)
    setPumpError(null)
    try {
      await triggerPump(device.id)   // -> backend -> TB SERVER_SCOPE {"triggerWatering": true}
    } catch {
      setPumpError('Ne mogu pokrenuti pumpu')
    }
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
        <div className={`${styles.connBadge} ${connected ? styles.connOk : connectionOk === false ? styles.connFail : styles.connPending}`}>
          <span className={styles.connDot} />
          {connected ? 'Uživo' : connectionOk === false ? 'Offline' : 'Povezivanje...'}
        </div>
      </div>

      {/* govorni balončić */}
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
                style={{ width: `${sensors.soilMoisture ?? 0}%`, background: mood.color }}
              />
            </div>
            <span className={styles.moistureVal}>{sensors.soilMoisture != null ? Math.round(sensors.soilMoisture) : '--'}%</span>
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

      {/* upravljanje pumpom */}
      <div className={styles.sectionTitle}>Upravljanje pumpom</div>
      <div className={styles.waterPanel}>
        <div className={styles.waterInfo}>
          <div className={styles.waterStat}>
            <span className={styles.waterStatLabel}>Uređaj</span>
            <span className={styles.waterStatVal}>{device?.name ?? '--'}</span>
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
          disabled={wateringNow || !device}
        >
          <span className={styles.pumpBtnIcon}><i className="fa-solid fa-droplet" aria-hidden="true" /></span>
          <span>{wateringNow ? 'Pumpa radi...' : 'Pokreni pumpu'}</span>
        </button>
      </div>
      {pumpError && <p style={{ color: 'var(--ember)', fontSize: '0.82rem', marginTop: 8 }}>{pumpError}</p>}

      {/* status */}
      <div className={styles.sectionTitle}>Status sustava</div>
      <div className={styles.statusRow}>
        <StatusChip ok label="ESP32" desc="Povezan" />
        <StatusChip ok={connectionOk === true} label="Backend API" desc={connectionOk === true ? 'Aktivan' : 'Nedostupan'} />
        <StatusChip ok={connected} label="Live veza" desc={connected ? 'WebSocket OK' : 'Nije spojen'} />
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
      <path d="M22 72h36l-4 20H26L22 72z" fill="#8B5E3C" />
      <rect x="18" y="68" width="44" height="6" rx="3" fill="#A0714A" />
      <ellipse cx="40" cy="71" rx="18" ry="4" fill="#4A2E1A" opacity="0.6" />
      <path d="M40 68V40" stroke={green} strokeWidth="2.5" strokeLinecap="round" />
      <path d="M40 55 C34 48 26 48 24 43 C26 40 34 40 40 47" fill={green} opacity="0.9" />
      <path d="M40 48 C46 42 54 42 56 37 C54 34 46 34 40 41" fill={green} opacity="0.8" />
      <path d="M40 42 C36 38 30 36 30 32 C32 30 38 32 40 38" fill={green} opacity="0.7" />
    </svg>
  )
}