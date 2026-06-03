import styles from '../styles/WeatherPage.module.css'

const forecast = [
  { day: 'Danas', icon: <i className="fa-solid fa-cloud-sun" aria-hidden="true" />, high: 24, low: 16, rain: 20, label: 'Djelomično oblačno' },
  { day: 'Uto',   icon: <i className="fa-solid fa-cloud-showers-heavy" aria-hidden="true" />, high: 19, low: 13, rain: 85, label: 'Kiša' },
  { day: 'Sri',   icon: <i className="fa-solid fa-cloud-showers-heavy" aria-hidden="true" />, high: 17, low: 12, rain: 70, label: 'Pljuskovi' },
  { day: 'Čet',   icon: <i className="fa-solid fa-cloud" aria-hidden="true" />, high: 21, low: 14, rain: 30, label: 'Oblačno' },
  { day: 'Pet',   icon: <i className="fa-solid fa-sun" aria-hidden="true" />, high: 27, low: 17, rain: 5,  label: 'Sunčano' },
]

export default function WeatherPage() {
  const today = forecast[0]
  const rainNext2 = forecast[1].rain > 60 || forecast[2].rain > 60

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Vremenska prognoza</h1>
        <p className={styles.sub}>Integracija s WeatherAPI — prilagodba zalijevanja prema prognozi</p>
      </div>

      <div className={styles.banner}>
        <span className={styles.bannerIcon}><i className="fa-solid fa-triangle-exclamation" aria-hidden="true" /></span>
        <div>
          <strong>WeatherAPI nije konfiguriran</strong>
          <p>Unesi API ključ u Postavkama za aktivaciju integracije.</p>
        </div>
      </div>

      <div className={styles.sectionTitle}>Demo prognoza — Slavonski Brod</div>

      <div className={styles.todayCard}>
        <div className={styles.todayLeft}>
          <span className={styles.todayIcon}>{today.icon}</span>
          <div>
            <div className={styles.todayLabel}>{today.label}</div>
            <div className={styles.todayTemp}>{today.high}°<span className={styles.todayLow}>/{today.low}°</span></div>
          </div>
        </div>
        <div className={styles.todayStats}>
          <div className={styles.todayStat}>
            <span className={styles.todayStatLabel}>Vjerojatnost kiše</span>
            <span className={styles.todayStatVal} style={{ color: today.rain > 50 ? 'var(--water)' : 'var(--clay)' }}>{today.rain}%</span>
          </div>
          <div className={styles.todayStat}>
            <span className={styles.todayStatLabel}>Vlaga zraka</span>
            <span className={styles.todayStatVal}>62%</span>
          </div>
          <div className={styles.todayStat}>
            <span className={styles.todayStatLabel}>Vjetar</span>
            <span className={styles.todayStatVal}>12 km/h</span>
          </div>
        </div>
      </div>

      <div className={`${styles.recommendCard} ${rainNext2 ? styles.recSkip : styles.recWater}`}>
        <span className={styles.recIcon}>{rainNext2 ? <i className="fa-solid fa-cloud-showers-heavy" aria-hidden="true" /> : <i className="fa-solid fa-droplet" aria-hidden="true" />}</span>
        <div>
          <strong className={styles.recTitle}>
            {rainNext2 ? 'Preporučeno: preskoči zalijevanje' : 'Zalijevanje može biti potrebno'}
          </strong>
          <p className={styles.recDesc}>
            {rainNext2
              ? 'Sutra i prekosutra se očekuje kiša (>60%). Sustav preporučuje da ne zalijeva biljku.'
              : 'Nema značajnih oborina u prognozi. Pratite vlažnost tla.'}
          </p>
        </div>
      </div>

      <div className={styles.sectionTitle} style={{ marginTop: 28 }}>5-dnevna prognoza</div>
      <div className={styles.forecastRow}>
        {forecast.map((f, i) => (
          <div key={i} className={`${styles.forecastCard} ${i === 0 ? styles.forecastToday : ''}`}>
            <span className={styles.forecastDay}>{f.day}</span>
            <span className={styles.forecastIcon}>{f.icon}</span>
            <span className={styles.forecastHigh}>{f.high}°</span>
            <span className={styles.forecastLow}>{f.low}°</span>
            <div className={styles.rainChance} title="Vjerojatnost kiše">
              <span style={{ color: f.rain > 60 ? 'var(--water)' : 'var(--clay)' }}><i className="fa-solid fa-droplet" aria-hidden="true" /> {f.rain}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
