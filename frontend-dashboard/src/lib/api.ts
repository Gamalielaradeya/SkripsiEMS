// ── API Client ────────────────────────────────────────────────────────────

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`)
  if (!res.ok) throw new Error(`API ${path} → ${res.status}`)
  return res.json()
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`API POST ${path} → ${res.status}`)
  return res.json()
}

async function put<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`API PUT ${path} → ${res.status}`)
  return res.json()
}

async function del<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, { method: 'DELETE' })
  if (!res.ok) throw new Error(`API DELETE ${path} -> ${res.status}`)
  return res.json()
}

// ── API Methods ───────────────────────────────────────────────────────────

export const api = {
  health:          () => get('/api/v1/health'),
  dashboardSummary:() => get('/api/v1/dashboard/summary'),
  readingsLatest:  () => get('/api/v1/readings/latest'),
  readingsHistory: (limit = 100, offset = 0) =>
    get(`/api/v1/readings/history?limit=${limit}&offset=${offset}`),
  sensors:         () => get('/api/v1/sensors'),
  predictionsLatest: () => get('/api/v1/predictions/latest'),
  predictionsHistory:(limit = 100, offset = 0) =>
    get(`/api/v1/predictions/history?limit=${limit}&offset=${offset}`),
  anomaliesLatest: () => get('/api/v1/anomalies/latest'),
  anomalies:       (limit = 50, offset = 0) =>
    get(`/api/v1/anomalies?limit=${limit}&offset=${offset}`),
  modelMetrics:    () => get('/api/v1/model-metrics/latest'),
  baselines:       () => get('/api/v1/baselines/latest'),
  notifications:   (limit = 50, offset = 0) =>
    get(`/api/v1/notifications?limit=${limit}&offset=${offset}`),
  notificationsTest: () => post('/api/v1/notifications/test', {}),
  settings:        () => get('/api/v1/settings'),
  settingUpdate:   (key: string, value: string) => put(`/api/v1/settings/${key}`, { value }),
  layout:          () => get('/api/v1/layout'),
  layoutDeviceUpdate: (sensorCode: string, posX: number, posY: number, label: string) =>
    put(`/api/v1/layout/devices/${sensorCode}`, { pos_x: posX, pos_y: posY, label }),
  layoutDeviceDelete: (sensorCode: string) => del(`/api/v1/layout/devices/${sensorCode}`),
  systemLogs:      (limit = 100, offset = 0) =>
    get(`/api/v1/system-logs?limit=${limit}&offset=${offset}`),
}

export { BASE_URL }
