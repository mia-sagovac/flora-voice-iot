import { useState } from 'react'
import styles from '../styles/WateringPage.module.css'

const history = [
  { time: 'Danas, 08:12', amount: 150, type: 'Auto', trigger: 'Vlažnost < 30%' },
  { time: 'Jučer, 18:45', amount: 200, type: 'Manualno', trigger: 'Korisnik' },
  { time: 'Jučer, 07:30', amount: 150, type: 'Auto', trigger: 'Raspored' },
  { time: 'Pred. uto, 19:00', amount: 180, type: 'Auto', trigger: 'Vlažnost < 30%' },
  { time: 'Pred. uto, 07:30', amount: 150, type: 'Auto', trigger: 'Raspored' },
]

export default function WateringPage() {
  const [mode, setMode] = useState('manual') // manual | auto | schedule
  const [threshold, setThreshold] = useState(30)
  const [schedTime, setSchedTime] = useState('08:00')
  const [amount, setAmount] = useState(150)
  const [wateringNow, setWateringNow] = useState(false)

  const triggerManual = () => {
    setWateringNow(true)
    setTimeout(() => setWateringNow(false), 3500)
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Zalijevanje</h1>
        <p className={styles.sub}>Upravljanje pumpom i rasporedom navodnjavanja</p>
      </div>

      <div className={styles.sectionTitle}>Način rada</div>
      <div className={styles.modeCards}>
        {[
          { key: 'manual', icon: <i className="fa-solid fa-hand" aria-hidden="true" />, label: 'Manualno', desc: 'Ti odlučuješ kad zaliti' },
          { key: 'auto',   icon: <i className="fa-solid fa-robot" aria-hidden="true" />, label: 'Automatski', desc: 'Pali pumpu po pragu vlažnosti' },
          { key: 'schedule', icon: <i className="fa-solid fa-clock" aria-hidden="true" />, label: 'Raspored', desc: 'Zalijevanje u fiksno vrijeme' },
        ].map(m => (
          <button
            key={m.key}
            className={`${styles.modeCard} ${mode === m.key ? styles.modeActive : ''}`}
            onClick={() => setMode(m.key)}
          >
            <span className={styles.modeIcon}>{m.icon}</span>
            <span className={styles.modeLabel}>{m.label}</span>
            <span className={styles.modeDesc}>{m.desc}</span>
          </button>
        ))}
      </div>

      <div className={styles.configCard}>
        {mode === 'manual' && (
          <div className={styles.manualPanel}>
            <div className={styles.fieldRow}>
              <label className={styles.fieldLabel}>Količina (ml)</label>
              <input
                type="range" min={50} max={500} step={25}
                value={amount}
                onChange={e => setAmount(+e.target.value)}
                className={styles.slider}
              />
              <span className={styles.sliderVal}>{amount} ml</span>
            </div>
            <button
              className={`${styles.pumpBtn} ${wateringNow ? styles.pumpActive : ''}`}
              onClick={triggerManual}
              disabled={wateringNow}
            >
              {wateringNow ? <><i className="fa-solid fa-droplet" aria-hidden="true" /> Pumpa radi...</> : <><i className="fa-solid fa-droplet" aria-hidden="true" /> Pokreni pumpu sada</>}
            </button>
          </div>
        )}

        {mode === 'auto' && (
          <div className={styles.autoPanel}>
            <div className={styles.fieldRow}>
              <label className={styles.fieldLabel}>Prag vlažnosti tla (%)</label>
              <input
                type="range" min={10} max={60} step={5}
                value={threshold}
                onChange={e => setThreshold(+e.target.value)}
                className={styles.slider}
              />
              <span className={styles.sliderVal}>{threshold}%</span>
            </div>
            <div className={styles.fieldRow}>
              <label className={styles.fieldLabel}>Količina po zalijevanju (ml)</label>
              <input
                type="range" min={50} max={500} step={25}
                value={amount}
                onChange={e => setAmount(+e.target.value)}
                className={styles.slider}
              />
              <span className={styles.sliderVal}>{amount} ml</span>
            </div>
            <div className={styles.autoInfo}>
              Pumpa se aktivira kad vlažnost tla padne ispod <strong>{threshold}%</strong> i daje <strong>{amount} ml</strong> vode.
            </div>
          </div>
        )}

        {mode === 'schedule' && (
          <div className={styles.schedPanel}>
            <div className={styles.fieldInline}>
              <label className={styles.fieldLabel}>Vrijeme zalijevanja</label>
              <input
                type="time"
                value={schedTime}
                onChange={e => setSchedTime(e.target.value)}
                className={styles.timeInput}
              />
            </div>
            <div className={styles.fieldRow}>
              <label className={styles.fieldLabel}>Količina (ml)</label>
              <input
                type="range" min={50} max={500} step={25}
                value={amount}
                onChange={e => setAmount(+e.target.value)}
                className={styles.slider}
              />
              <span className={styles.sliderVal}>{amount} ml</span>
            </div>
            <div className={styles.autoInfo}>
              Pumpa se aktivira svaki dan u <strong>{schedTime}</strong> i daje <strong>{amount} ml</strong> vode.
            </div>
          </div>
        )}
      </div>

      <div className={styles.sectionTitle} style={{ marginTop: 32 }}>Povijest zalijevanja</div>
      <div className={styles.historyList}>
        {history.map((h, i) => (
          <div key={i} className={styles.histRow}>
            <div className={`${styles.histBadge} ${h.type === 'Auto' ? styles.badgeAuto : styles.badgeManual}`}>
              <i className={h.type === 'Auto' ? 'fa-solid fa-robot' : 'fa-solid fa-hand'} aria-hidden="true" /> {h.type}
            </div>
            <div className={styles.histMain}>
              <span className={styles.histTime}>{h.time}</span>
              <span className={styles.histTrigger}>{h.trigger}</span>
            </div>
            <div className={styles.histAmount}>{h.amount} ml</div>
          </div>
        ))}
      </div>
    </div>
  )
}
