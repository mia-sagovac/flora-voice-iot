import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const DEV_BYPASS = import.meta.env.VITE_DEV_BYPASS === 'true'

export default function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth()
  if (!DEV_BYPASS && !isAuthenticated) return <Navigate to="/login" replace />
  return children
}