import { useLocation } from 'react-router-dom'
import { RefreshCw, Wifi, WifiOff } from 'lucide-react'
import { cn, statusBg, statusLabel, statusDot } from '@/lib/utils'
import type { ThermalStatus } from '@/types'

const PAGE_TITLES: Record<string, string> = {
  '/':              'Dashboard',
  '/readings':      'Sensor Readings',
  '/predictions':   'Prediksi LSTM',
  '/anomalies':     'Riwayat Anomali',
  '/evaluation':    'Evaluasi Model',
  '/layout':        'Sensor Layout',
  '/notifications': 'Notifikasi',
  '/settings':      'Pengaturan',
  '/logs':          'System Logs',
}

interface TopbarProps {
  thermalStatus?: ThermalStatus
  connected?: boolean
  onRefresh?: () => void
}

export function Topbar({ thermalStatus = 'normal', connected = true, onRefresh }: TopbarProps) {
  const { pathname } = useLocation()
  const title = PAGE_TITLES[pathname] ?? 'EMS Monitor'

  return (
    <header className="h-14 glass fixed top-0 left-60 right-0 z-30 flex items-center justify-between px-6">
      <h1 className="text-base font-semibold text-gray-100">{title}</h1>

      <div className="flex items-center gap-4">
        {/* SSE connection */}
        <div className="flex items-center gap-1.5 text-xs">
          {connected
            ? <><Wifi className="w-3.5 h-3.5 text-green-400" /><span className="text-green-400">Live</span></>
            : <><WifiOff className="w-3.5 h-3.5 text-gray-500" /><span className="text-gray-500">Offline</span></>
          }
        </div>

        {/* Thermal status pill */}
        {thermalStatus && (
          <span className={cn('badge', statusBg(thermalStatus))}>
            <span className={cn('status-dot', statusDot(thermalStatus))} />
            {statusLabel(thermalStatus)}
          </span>
        )}

        {/* Refresh */}
        <button
          onClick={onRefresh}
          className="btn btn-ghost p-2"
          title="Refresh data"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>
    </header>
  )
}
