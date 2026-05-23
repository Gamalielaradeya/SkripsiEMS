import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Thermometer, TrendingUp, AlertTriangle,
  BarChart3, Map, Bell, Settings, FileText, Activity
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { to: '/',           icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/readings',   icon: Thermometer,      label: 'Sensor Readings' },
  { to: '/predictions',icon: TrendingUp,       label: 'Prediksi' },
  { to: '/anomalies',  icon: AlertTriangle,    label: 'Anomali' },
  { to: '/evaluation', icon: BarChart3,        label: 'Evaluasi Model' },
  { to: '/layout',     icon: Map,              label: 'Sensor Layout' },
  { to: '/notifications',icon: Bell,           label: 'Notifikasi' },
  { to: '/settings',   icon: Settings,         label: 'Pengaturan' },
  { to: '/logs',       icon: FileText,         label: 'System Logs' },
]

export function Sidebar() {
  return (
    <aside className="fixed top-0 left-0 h-screen w-60 bg-gray-950 border-r border-gray-800 flex flex-col z-40">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-ems-600/20 border border-ems-600/40 flex items-center justify-center">
            <Activity className="w-5 h-5 text-ems-400" />
          </div>
          <div>
            <div className="text-sm font-bold text-white leading-tight">EMS Thermal</div>
            <div className="text-xs text-gray-500 leading-tight">Monitor</div>
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
            className={({ isActive }) =>
              cn('nav-item', isActive && 'active')
            }
          >
            <Icon className="w-4 h-4 shrink-0" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-gray-800">
        <p className="text-xs text-gray-600 leading-relaxed">
          EMS LSTM Thermal Anomaly<br />
          <span className="text-gray-700">Skripsi UBM · 2026</span>
        </p>
      </div>
    </aside>
  )
}
