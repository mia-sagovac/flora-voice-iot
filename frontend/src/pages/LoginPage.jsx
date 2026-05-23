import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import styles from '../styles/LoginPage.module.css'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const { signIn, loading } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!username || !password) {
      setError('Unesi email i lozinku.')
      return
    }
    const result = await signIn(username, password)
    if (result.success) {
      navigate('/dashboard')
    } else {
      setError(result.error)
    }
  }

  return (
    <div className={styles.page}>
      {/* dekorativna pozadina */}
      <div className={styles.bg}>
        <LeafSVG className={styles.leaf1} />
        <LeafSVG className={styles.leaf2} />
        <LeafSVG className={styles.leaf3} />
        <div className={styles.circle1} />
        <div className={styles.circle2} />
      </div>

      <div className={styles.card}>
        <div className={styles.logoWrap}>
          <PlantIcon />
        </div>
        <h1 className={styles.title}>FloraVoice</h1>
        <p className={styles.sub}>Pametno praćenje tvojih biljaka</p>

        <form onSubmit={handleSubmit} className={styles.form} noValidate>
          <div className={styles.field}>
            <label className={styles.label}>ThingsBoard email</label>
            <input
              className={styles.input}
              type="email"
              placeholder="korisnik@mail.com"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              autoFocus
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Lozinka</label>
            <input
              className={styles.input}
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <button className={styles.btn} type="submit" disabled={loading}>
            {loading ? (
              <span className={styles.spinner} />
            ) : (
              <>
                <span>Prijavi se</span>
                <ArrowIcon />
              </>
            )}
          </button>
        </form>

        <p className={styles.hint}>
          Koristi ThingsBoard credentials za prijavu
        </p>
      </div>
    </div>
  )
}

function PlantIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
      <circle cx="24" cy="24" r="24" fill="#3D5A2E" opacity="0.12" />
      <path d="M24 38V22" stroke="#5A8A3C" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M24 28 C20 24 14 24 12 20 C14 18 20 18 24 22" fill="#5A8A3C" opacity="0.8" />
      <path d="M24 24 C28 20 34 20 36 16 C34 14 28 14 24 18" fill="#8BBF5A" opacity="0.9" />
      <circle cx="24" cy="38" r="3" fill="#8B5E3C" opacity="0.4" />
    </svg>
  )
}

function LeafSVG({ className }) {
  return (
    <svg className={className} viewBox="0 0 80 120" fill="none">
      <path d="M40 110 C40 110 8 80 8 45 C8 22 22 10 40 8 C58 10 72 22 72 45 C72 80 40 110 40 110Z"
        fill="currentColor" />
      <path d="M40 110 L40 8" stroke="white" strokeWidth="1.5" strokeOpacity="0.3" />
    </svg>
  )
}

function ArrowIcon() {
  return <i className="fa-solid fa-arrow-right" aria-hidden="true" />
}
