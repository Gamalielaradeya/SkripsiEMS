import { useLocation } from 'react-router-dom'
import { RefreshCw, Wifi, WifiOff, Sun, Moon } from 'lucide-react'
import { cn, statusBg, statusLabel, statusDot } from '@/lib/utils'
import type { ThermalStatus } from '@/types'
import type { Theme } from '@/App'

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
  theme?: Theme
  onToggleTheme?: () => void
}

export function Topbar({ thermalStatus = 'normal', connected = true, onRefresh, theme = 'dark', onToggleTheme }: TopbarProps) {
  const { pathname } = useLocation()
  const title = PAGE_TITLES[pathname] ?? 'EMS Monitor'

  return (
    <header className="h-14 glass fixed top-0 left-0 md:left-60 right-0 z-30 flex items-center justify-between px-4 md:px-6">
      <h1 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>{title}</h1>

      <div className="flex items-center gap-4">
        {/* SSE connection */}
        <div className="flex items-center gap-1.5 text-xs">
          {connected
            ? <><Wifi className="w-3.5 h-3.5 text-green-400" /><span className="text-green-400">Live</span></>
            : <><WifiOff className="w-3.5 h-3.5 text-zinc-500" /><span style={{ color: 'var(--text-muted)' }}>Offline</span></>
          }
        </div>

        {/* Thermal status pill */}
        {thermalStatus && (
          <span className={cn('badge hidden sm:inline-flex', statusBg(thermalStatus))}>
            <span className={cn('status-dot', statusDot(thermalStatus))} />
            {statusLabel(thermalStatus)}
          </span>
        )}

        {/* Theme toggle */}
        <button
          onClick={onToggleTheme}
          className="btn btn-ghost p-2"
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {theme === 'dark'
            ? <Sun className="w-4 h-4" />
            : <Moon className="w-4 h-4" />
          }
        </button>

        {/* Refresh */}
        <button onClick={onRefresh} className="btn btn-ghost p-2" title="Refresh data">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>
    </header>
  )
}
