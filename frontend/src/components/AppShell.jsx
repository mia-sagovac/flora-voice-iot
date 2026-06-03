import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import styles from './AppShell.module.css'

const NAV = [
  { to: '/dashboard', icon: <DashIcon />, label: 'Pregled' },
  { to: '/plant',     icon: <PlantIcon />, label: 'Moje biljke' },
  { to: '/sensors',   icon: <SensorIcon />, label: 'Senzori' },
  { to: '/weather',   icon: <WeatherIcon />, label: 'Vrijeme' },
  { to: '/watering',  icon: <WaterIcon />, label: 'Zalijevanje' },
]

export default function AppShell({ children }) {
  const { signOut, user } = useAuth()
  const displayName = user?.username || (import.meta.env.VITE_DEV_BYPASS === 'true' ? 'Dev' : 'Korisnik')  
  const navigate = useNavigate();

  const handleLogout = () => {
    signOut()
    navigate('/login')
  }

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <LogoIcon />
          <span className={styles.brandName}>FloraVoice</span>
        </div>

        <nav className={styles.nav}>
          {NAV.map(({ to, icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `${styles.navItem} ${isActive ? styles.active : ''}`
              }
            >
              <span className={styles.navIcon}>{icon}</span>
              <span className={styles.navLabel}>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className={styles.footer}>
          <div className={styles.userChip}>
            <span className={styles.avatar}><i className="fa-solid fa-leaf" aria-hidden="true" /></span>
            <span className={styles.userName}>{displayName}</span>
          </div>
          <button className={styles.logoutBtn} onClick={handleLogout} title="Odjava">
            <LogoutIcon />
          </button>
        </div>
      </aside>

      <main className={styles.main}>
        {children}
      </main>
    </div>
  )
}

// ─── SVG icons ────────────────────────────────────────
function LogoIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="16" fill="#3D5A2E" />
      <path d="M16 26V16" stroke="#8BBF5A" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M16 20 C13 17 9 17 8 14 C9 12 13 12 16 15" fill="#8BBF5A" opacity="0.9" />
      <path d="M16 17 C19 14 23 14 24 11 C23 9 19 9 16 12" fill="#C8E0B4" opacity="0.9" />
    </svg>
  )
}
function DashIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
}
function PlantIcon() {
  return <i className="fa-solid fa-seedling" aria-hidden="true" />
}
function SensorIcon() {
  return <i className="fa-solid fa-microchip" aria-hidden="true" />
}
function WeatherIcon() {
  return <i className="fa-solid fa-cloud-sun" aria-hidden="true" />
}
function WaterIcon() {
  return <i className="fa-solid fa-droplet" aria-hidden="true" />
}
function LogoutIcon() {
  return <i className="fa-solid fa-right-from-bracket" aria-hidden="true" />
}