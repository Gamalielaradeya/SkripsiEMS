import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Thermometer, TrendingUp, AlertTriangle,
  BarChart3, Map, Bell, Settings, FileText, Activity
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Theme } from '@/App'

const navItems = [
  { to: '/',             icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/readings',     icon: Thermometer,     label: 'Sensor Readings' },
  { to: '/predictions',  icon: TrendingUp,      label: 'Prediksi' },
  { to: '/anomalies',    icon: AlertTriangle,   label: 'Anomali' },
  { to: '/evaluation',   icon: BarChart3,       label: 'Evaluasi Model' },
  { to: '/layout',       icon: Map,             label: 'Sensor Layout' },
  { to: '/notifications',icon: Bell,            label: 'Notifikasi' },
  { to: '/settings',     icon: Settings,        label: 'Pengaturan' },
  { to: '/logs',         icon: FileText,        label: 'System Logs' },
]

interface SidebarProps {
  theme?: Theme
}

export function Sidebar({ theme = 'dark' }: SidebarProps) {
  return (
    <aside
      className="fixed top-0 left-0 h-screen w-60 flex flex-col z-40"
      style={{
        backgroundColor: 'var(--sidebar-bg)',
        borderRight: '1px solid var(--sidebar-border)',
      }}
    >
      {/* Logo */}
      <div className="px-4 py-5" style={{ borderBottom: '1px solid var(--sidebar-border)' }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center"
               style={{
                 background: 'color-mix(in srgb, var(--accent) 15%, transparent)',
                 border: '1px solid color-mix(in srgb, var(--accent) 30%, transparent)'
               }}>
            <Activity className="w-5 h-5" style={{ color: 'var(--accent)' }} />
          </div>
          <div>
            <div className="text-sm font-bold leading-tight" style={{ color: '#fafafa' }}>EMS Thermal</div>
            <div className="text-xs leading-tight" style={{ color: '#71717a' }}>Monitor</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) => cn('nav-item', isActive && 'active')}
          >
            <Icon className="w-4 h-4 shrink-0" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-4 py-3" style={{ borderTop: '1px solid var(--sidebar-border)' }}>
        <p className="text-xs leading-relaxed" style={{ color: '#52525b' }}>
          EMS LSTM Thermal Anomaly<br />
          <span style={{ color: '#3f3f46' }}>Skripsi UBM · 2026</span>
        </p>
      </div>
    </aside>
  )
}
