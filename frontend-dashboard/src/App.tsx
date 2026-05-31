import { Routes, Route } from 'react-router-dom'
import { useState, useCallback, useEffect } from 'react'
import { Sidebar } from '@/components/layout/Sidebar'
import { Topbar } from '@/components/layout/Topbar'
import { useSSE } from '@/lib/sse'
import { api } from '@/lib/api'
import type { DashboardSummary, ThermalStatus } from '@/types'

import DashboardPage     from '@/pages/DashboardPage'
import ReadingsPage      from '@/pages/ReadingsPage'
import PredictionsPage   from '@/pages/PredictionsPage'
import AnomaliesPage     from '@/pages/AnomaliesPage'
import EvaluationPage    from '@/pages/EvaluationPage'
import LayoutPage        from '@/pages/LayoutPage'
import NotificationsPage from '@/pages/NotificationsPage'
import SettingsPage      from '@/pages/SettingsPage'
import LogsPage          from '@/pages/LogsPage'

export type Theme = 'dark' | 'light'

export default function App() {
  const [thermalStatus, setThermalStatus] = useState<ThermalStatus>('normal')
  const [connected, setConnected]         = useState(false)
  const [refreshKey, setRefreshKey]       = useState(0)
  const [theme, setTheme]                 = useState<Theme>(
    () => (localStorage.getItem('ems_theme') as Theme) ?? 'dark'
  )

  const onRefresh = () => setRefreshKey(k => k + 1)

  const toggleTheme = useCallback(() => {
    setTheme(t => {
      const next = t === 'dark' ? 'light' : 'dark'
      localStorage.setItem('ems_theme', next)
      return next
    })
  }, [])

  useEffect(() => {
    api.dashboardSummary()
      .then(result => setThermalStatus((result as DashboardSummary).thermal_status))
      .catch(() => setThermalStatus('trouble'))
  }, [refreshKey])

  useSSE(useCallback((event, data) => {
    if (event === 'prediction.latest') {
      const p = data as { thermal_status?: ThermalStatus }
      if (p?.thermal_status) setThermalStatus(p.thermal_status)
    }
    if (event === 'sensor.trouble') setThermalStatus('trouble')
    if (['reading.latest', 'sensor.trouble', 'prediction.latest', 'anomaly.created', 'notification.sent'].includes(event)) {
      setRefreshKey(k => k + 1)
    }
  }, []), useCallback((conn: boolean) => {
    setConnected(conn)
  }, []))

  return (
    <div
      data-theme={theme}
      className="min-h-screen transition-colors duration-200"
      style={{ backgroundColor: 'var(--bg-primary)' }}
    >
      <Sidebar theme={theme} />
      <Topbar
        thermalStatus={thermalStatus}
        connected={connected}
        onRefresh={onRefresh}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      <main className="md:ml-60 pt-20 pb-24 md:pb-8 px-4 md:px-6 min-h-screen" key={refreshKey}>
        <Routes>
          <Route path="/"              element={<DashboardPage />} />
          <Route path="/readings"      element={<ReadingsPage />} />
          <Route path="/predictions"   element={<PredictionsPage />} />
          <Route path="/anomalies"     element={<AnomaliesPage />} />
          <Route path="/evaluation"    element={<EvaluationPage />} />
          <Route path="/layout"        element={<LayoutPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/settings"      element={<SettingsPage />} />
          <Route path="/logs"          element={<LogsPage />} />
        </Routes>
      </main>
    </div>
  )
}
