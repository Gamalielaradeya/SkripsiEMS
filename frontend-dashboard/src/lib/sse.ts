import { useEffect, useRef, useCallback } from 'react'
import { BASE_URL } from './api'

type SSEHandler = (event: string, data: unknown) => void
type ConnectCallback = (connected: boolean) => void

export function useSSE(onEvent: SSEHandler, onConnect?: ConnectCallback) {
  const esRef = useRef<EventSource | null>(null)
  const reconnectTimer = useRef<ReturnType<typeof setTimeout>>()

  const connect = useCallback(() => {
    const sseUrl = `${BASE_URL}/api/v1/events`
    const es = new EventSource(sseUrl)
    esRef.current = es

    es.addEventListener('connected', () => {
      onConnect?.(true)
    })
    es.addEventListener('reading.latest', (e) => {
      onConnect?.(true)
      try { onEvent('reading.latest', JSON.parse(e.data)) } catch {}
    })
    es.addEventListener('sensor.trouble', (e) => {
      onConnect?.(true)
      try { onEvent('sensor.trouble', JSON.parse(e.data)) } catch {}
    })
    es.addEventListener('prediction.latest', (e) => {
      onConnect?.(true)
      try { onEvent('prediction.latest', JSON.parse(e.data)) } catch {}
    })
    es.addEventListener('anomaly.created', (e) => {
      onConnect?.(true)
      try { onEvent('anomaly.created', JSON.parse(e.data)) } catch {}
    })
    es.addEventListener('notification.sent', (e) => {
      onConnect?.(true)
      try { onEvent('notification.sent', JSON.parse(e.data)) } catch {}
    })
    // Mark connected on open
    es.onopen = () => onConnect?.(true)

    es.onerror = () => {
      onConnect?.(false)
      es.close()
      reconnectTimer.current = setTimeout(connect, 5000)
    }
  }, [onEvent, onConnect])

  useEffect(() => {
    connect()
    return () => {
      esRef.current?.close()
      clearTimeout(reconnectTimer.current)
    }
  }, [connect])
}
