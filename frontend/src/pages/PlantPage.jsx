import { useState } from 'react'
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

const PLANT_NAMES = ['Zelen', 'Cvjetko', 'Listko', 'Fikus', 'Miki']

export default function PlantPage() {
  const [moisture] = useState(55)
  const [plantName, setPlantName] = useState('Zelen')
  const [editing, setEditing] = useState(false)
  const [nameInput, setNameInput] = useState(plantName)
  const [msgIdx, setMsgIdx] = useState(0)
  const [notes, setNotes] = useState('')

  const group = getMessages(moisture)
  const currentMsg = group.msgs[msgIdx % group.msgs.length]

  const nextMsg = () => setMsgIdx(i => i + 1)
  const saveName = () => {
    setPlantName(nameInput || plantName)
    setEditing(false)
  }

  const moodColors = {
    thirsty: 'var(--ember)',
    'could-use': 'var(--sun)',
    happy: 'var(--leaf)',
    wet: 'var(--water)',
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Moja biljka</h1>
        <p className={styles.sub}>Personaliziraj svoju biljku i slušaj što ti govori</p>
      </div>

      <div className={styles.grid}>
        {/* ID biljke */}
        <div className={styles.identCard}>
          <div className={styles.plantFig}>
            <BigPlant mood={group.mood} />
          </div>
          <div className={styles.identity}>
            {editing ? (
              <div className={styles.editRow}>
                <input
                  className={styles.nameInput}
                  value={nameInput}
                  onChange={e => setNameInput(e.target.value)}
                  autoFocus
                  onKeyDown={e => e.key === 'Enter' && saveName()}
                />
                <button className={styles.saveBtn} onClick={saveName}>Spremi</button>
              </div>
            ) : (
              <div className={styles.nameRow}>
                <h2 className={styles.plantName}>{plantName}</h2>
                <button className={styles.editBtn} onClick={() => setEditing(true)}>✏️</button>
              </div>
            )}
            <p className={styles.plantSpecies}>Sobna biljka · ESP32 Sensor</p>
            <div className={styles.moodBadge} style={{ background: `${moodColors[group.mood]}22`, color: moodColors[group.mood] }}>
              <span className={styles.moodDot} style={{ background: moodColors[group.mood] }} />
              {group.mood === 'happy' ? 'Sretna' : group.mood === 'thirsty' ? 'Žedna' : group.mood === 'could-use' ? 'Umjereno' : 'Prezasićena'}
            </div>
          </div>
        </div>

        {/* baloncic govora */}
        <div className={styles.speechCard}>
          <div className={styles.bubbleLabel}>ŠTO TI BILJKA GOVORI</div>
          <div className={styles.bubble}>
            <p className={styles.bubbleText}>„{currentMsg}"</p>
          </div>
          <button className={styles.nextBtn} onClick={nextMsg}>
            Sljedeća poruka →
          </button>
        </div>

        {/* status */}
        <div className={styles.statsCard}>
          <div className={styles.statRow}>
            <span className={styles.statLabel}>Vlažnost tla</span>
            <span className={styles.statVal}>{moisture}%</span>
          </div>
          <div className={styles.statRow}>
            <span className={styles.statLabel}>Temperatura</span>
            <span className={styles.statVal}>22.4°C</span>
          </div>
          <div className={styles.statRow}>
            <span className={styles.statLabel}>Vlaga zraka</span>
            <span className={styles.statVal}>58%</span>
          </div>
          <div className={styles.statRow}>
            <span className={styles.statLabel}>Svjetlost</span>
            <span className={styles.statVal}>680 lux</span>
          </div>
          <div className={styles.statRow}>
            <span className={styles.statLabel}>Zadnje zalijevanje</span>
            <span className={styles.statVal}>Prije 2h</span>
          </div>
        </div>

        {/* biljeske */}
        <div className={styles.notesCard}>
          <label className={styles.notesLabel}>Bilješke o biljci</label>
          <textarea
            className={styles.notesArea}
            placeholder="Npr: Presaditi u travnju, voli direktno sunce..."
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={4}
          />
        </div>
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
