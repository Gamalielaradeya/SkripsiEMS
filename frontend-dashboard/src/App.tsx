import { Routes, Route } from 'react-router-dom'
import { useState, useCallback } from 'react'
import { Sidebar } from '@/components/layout/Sidebar'
import { Topbar } from '@/components/layout/Topbar'
import { useSSE } from '@/lib/sse'
import type { ThermalStatus } from '@/types'

import DashboardPage    from '@/pages/DashboardPage'
import ReadingsPage     from '@/pages/ReadingsPage'
import PredictionsPage  from '@/pages/PredictionsPage'
import AnomaliesPage    from '@/pages/AnomaliesPage'
import EvaluationPage   from '@/pages/EvaluationPage'
import LayoutPage       from '@/pages/LayoutPage'
import NotificationsPage from '@/pages/NotificationsPage'
import SettingsPage     from '@/pages/SettingsPage'
import LogsPage         from '@/pages/LogsPage'

export default function App() {
  const [thermalStatus, setThermalStatus] = useState<ThermalStatus>('normal')
  const [connected, setConnected] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  const onRefresh = () => setRefreshKey(k => k + 1)

  useSSE(useCallback((event, data) => {
    if (event === 'prediction.latest') {
      const p = data as { thermal_status?: ThermalStatus }
      if (p?.thermal_status) setThermalStatus(p.thermal_status)
    }
  }, []), useCallback((conn: boolean) => {
    setConnected(conn)
  }, []))

  return (
    <div className="min-h-screen bg-[#0a0f1e]">
      <Sidebar />
      <Topbar
        thermalStatus={thermalStatus}
        connected={connected}
        onRefresh={onRefresh}
      />

      {/* Main content area */}
      <main className="ml-60 pt-20 pb-8 px-6 min-h-screen" key={refreshKey}>
        <Routes>
          <Route path="/"             element={<DashboardPage />} />
          <Route path="/readings"     element={<ReadingsPage />} />
          <Route path="/predictions"  element={<PredictionsPage />} />
          <Route path="/anomalies"    element={<AnomaliesPage />} />
          <Route path="/evaluation"   element={<EvaluationPage />} />
          <Route path="/layout"       element={<LayoutPage />} />
          <Route path="/notifications"element={<NotificationsPage />} />
          <Route path="/settings"     element={<SettingsPage />} />
          <Route path="/logs"         element={<LogsPage />} />
        </Routes>
      </main>
    </div>
  )
}
