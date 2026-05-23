import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { login as apiLogin } from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('fv_token'))
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(false)

  const isAuthenticated = Boolean(token)

  const signIn = useCallback(async (username, password) => {
    setLoading(true)
    try {
      const { data } = await apiLogin(username, password)
      localStorage.setItem('fv_token', data.access_token)
      if (data.refresh_token) {
        localStorage.setItem('fv_refresh_token', data.refresh_token)
      }
      setToken(data.access_token)
      setUser({ username })
      return { success: true }
    } catch (err) {
      const msg =
        err.response?.data?.detail ||
        'Prijava nije uspjela. Provjeri podatke.'
      return { success: false, error: msg }
    } finally {
      setLoading(false)
    }
  }, [])

  const signOut = useCallback(() => {
    localStorage.removeItem('fv_token')
    localStorage.removeItem('fv_refresh_token')
    setToken(null)
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ token, user, isAuthenticated, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be inside AuthProvider')
  return ctx
}
