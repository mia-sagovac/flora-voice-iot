import { useState } from 'react'
import styles from '../styles/SettingsPage.module.css'

export default function SettingsPage() {
  const [tbUrl, setTbUrl] = useState('https://eu.thingsboard.cloud')
  const [weatherKey, setWeatherKey] = useState('')
  const [plantName, setPlantName] = useState('Zelen')
  const [saved, setSaved] = useState(false)
  const [showKey, setShowKey] = useState(false)

  const handleSave = (e) => {
    e.preventDefault()
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Postavke</h1>
        <p className={styles.sub}>Konfiguracija sustava FloraVoice</p>
      </div>

      <form onSubmit={handleSave} className={styles.form}>

        <div className={styles.section}>
          <div className={styles.sectionHead}>
            <span className={styles.sectionIcon}><i className="fa-solid fa-plug" aria-hidden="true" /></span>
            <div>
              <h3 className={styles.sectionTitle}>ThingsBoard</h3>
              <p className={styles.sectionDesc}>IoT platforma za telemetriju i upravljanje uređajima</p>
            </div>
          </div>
          <div className={styles.fieldGroup}>
            <div className={styles.field}>
              <label className={styles.label}>ThingsBoard URL</label>
              <input
                className={styles.input}
                type="url"
                value={tbUrl}
                onChange={e => setTbUrl(e.target.value)}
                placeholder="https://eu.thingsboard.cloud"
              />
            </div>
          </div>
        </div>

        <div className={styles.section}>
          <div className={styles.sectionHead}>
            <span className={styles.sectionIcon}><i className="fa-solid fa-cloud-sun" aria-hidden="true" /></span>
            <div>
              <h3 className={styles.sectionTitle}>WeatherAPI</h3>
              <p className={styles.sectionDesc}>Vremenski podaci za pametniju preporuku zalijevanja</p>
            </div>
          </div>
          <div className={styles.fieldGroup}>
            <div className={styles.field}>
              <label className={styles.label}>API ključ</label>
              <div className={styles.inputRow}>
                <input
                  className={styles.input}
                  type={showKey ? 'text' : 'password'}
                  value={weatherKey}
                  onChange={e => setWeatherKey(e.target.value)}
                  placeholder="tvoj-weatherapi-kljuc"
                />
                <button type="button" className={styles.toggleBtn} onClick={() => setShowKey(v => !v)}>
                  <i className={showKey ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye'} aria-hidden="true" />
                </button>
              </div>
            </div>
            <div className={styles.hint}>
              Besplatni API ključ na <a href="https://www.weatherapi.com" target="_blank" rel="noreferrer">weatherapi.com</a>
            </div>
          </div>
        </div>

        {/* Plant */}
        <div className={styles.section}>
          <div className={styles.sectionHead}>
            <span className={styles.sectionIcon}><i className="fa-solid fa-leaf" aria-hidden="true" /></span>
            <div>
              <h3 className={styles.sectionTitle}>Biljka</h3>
              <p className={styles.sectionDesc}>Personalizacija FloraVoice asistenta</p>
            </div>
          </div>
          <div className={styles.fieldGroup}>
            <div className={styles.field}>
              <label className={styles.label}>Ime biljke</label>
              <input
                className={styles.input}
                type="text"
                value={plantName}
                onChange={e => setPlantName(e.target.value)}
                placeholder="Npr. Zelen, Miki, Cvjetko..."
              />
            </div>
          </div>
        </div>

        {/* About */}
        <div className={styles.section}>
          <div className={styles.sectionHead}>
            <span className={styles.sectionIcon}><i className="fa-solid fa-circle-info" aria-hidden="true" /></span>
            <div>
              <h3 className={styles.sectionTitle}>O projektu</h3>
              <p className={styles.sectionDesc}>FloraVoice — tim projekt</p>
            </div>
          </div>
          <div className={styles.aboutGrid}>
            <div className={styles.aboutItem}><span className={styles.aboutLabel}>Tim</span><span className={styles.aboutVal}>FloraVoice</span></div>
            <div className={styles.aboutItem}><span className={styles.aboutLabel}>Verzija</span><span className={styles.aboutVal}>0.1.0</span></div>
            <div className={styles.aboutItem}><span className={styles.aboutLabel}>Mentor</span><span className={styles.aboutVal}>Ivana Podnar Žarko</span></div>
            <div className={styles.aboutItem}><span className={styles.aboutLabel}>Backend</span><span className={styles.aboutVal}>FastAPI + ThingsBoard</span></div>
            <div className={styles.aboutItem}><span className={styles.aboutLabel}>IoT HW</span><span className={styles.aboutVal}>ESP32 + DHT22 + LDR</span></div>
            <div className={styles.aboutItem}><span className={styles.aboutLabel}>Platforma</span><span className={styles.aboutVal}>ThingsBoard Cloud</span></div>
          </div>
        </div>

        <div className={styles.saveRow}>
          {saved && <span className={styles.savedMsg}>Postavke su spremljene!</span>}
          <button className={styles.saveBtn} type="submit">
            Spremi postavke
          </button>
        </div>
      </form>
    </div>
  )
}
