import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
})

// Attach token to every request if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('fv_token')
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`
  }
  return config
})

// Auto-logout on 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('fv_token')
      localStorage.removeItem('fv_refresh_token')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api

// ─── Auth ─────────────────────────────────────────────
export const login = (username, password) =>
  api.post('/login', new URLSearchParams({ username, password }), {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  })

// ─── Protected test endpoint ─────────────────────────
export const fetchTestData = () => api.get('/test')

// ─── Helpers ─────────────────────────────────────────
export const healthCheck = () => api.get('/')

export const fetchMyDevices = () => api.get('/sensors/devices')
export const fetchSensorTelemetry = (deviceId) => api.get(`/sensors/${deviceId}/telemetry`)
export const triggerPump = (deviceId) => api.post(`/sensors/${deviceId}/pump`)