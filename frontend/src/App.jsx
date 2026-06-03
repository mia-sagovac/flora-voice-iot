import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import AppShell from './components/AppShell'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import PlantPage from './pages/PlantPage'
import SensorsPage from './pages/SensorsPage'
import WeatherPage from './pages/WeatherPage'
import WateringPage from './pages/WateringPage'
import SettingsPage from './pages/SettingsPage'

function Protected({ children }) {
  return (
    <ProtectedRoute>
      <AppShell>{children}</AppShell>
    </ProtectedRoute>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Protected><DashboardPage /></Protected>} />
          <Route path="/plant"     element={<Protected><PlantPage /></Protected>} />
          <Route path="/sensors"   element={<Protected><SensorsPage /></Protected>} />
          <Route path="/weather"   element={<Protected><WeatherPage /></Protected>} />
          <Route path="/watering"  element={<Protected><WateringPage /></Protected>} />
          <Route path="*"          element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
