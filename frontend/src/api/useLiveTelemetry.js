import { useEffect, useRef, useState } from 'react'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'
const WS_URL = API.replace(/^http/, 'ws') + '/sensors/ws'

// Otvori WebSocket, posalji token kao prvu poruku, primaj { device_id, device, data }.
export function useLiveTelemetry() {
    const [latest, setLatest] = useState(null)
    const [connected, setConnected] = useState(false)
    const wsRef = useRef(null)

    useEffect(() => {
        const token = localStorage.getItem('fv_token')
        if (!token) return

        const ws = new WebSocket(WS_URL)
        wsRef.current = ws

        ws.onopen = () => {
            ws.send(token)
            setConnected(true)
        }
        ws.onmessage = (e) => {
            try {
                setLatest(JSON.parse(e.data))
            } catch {
                // ignoriram
            }
        }
        ws.onclose = () => setConnected(false)
        ws.onerror = () => setConnected(false)

        return () => ws.close() // cistim (StrictMode u dev-u zatvori prvu vezu)
    }, [])

    return { latest, connected }
    }