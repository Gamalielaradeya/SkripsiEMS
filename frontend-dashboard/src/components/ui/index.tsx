import { cn, statusBg, statusDot, statusLabel } from '@/lib/utils'
import type { ThermalStatus } from '@/types'

interface StatusBadgeProps {
  status: ThermalStatus | string
  size?: 'sm' | 'md' | 'lg'
  pulse?: boolean
}

export function StatusBadge({ status, size = 'md', pulse }: StatusBadgeProps) {
  return (
    <span className={cn(
      'badge',
      statusBg(status),
      size === 'sm' && 'text-[10px] px-2 py-0.5',
      size === 'lg' && 'text-sm px-4 py-1.5',
    )}>
      <span className={cn(
        'status-dot',
        statusDot(status),
        pulse && status !== 'normal' && 'animate-pulse',
      )} />
      {statusLabel(status)}
    </span>
  )
}

interface MetricCardProps {
  title: string
  value: string | number
  unit?: string
  subtitle?: string
  icon?: React.ReactNode
  color?: string
  trend?: 'up' | 'down' | 'stable'
}

export function MetricCard({ title, value, unit, subtitle, icon, color = 'text-white' }: MetricCardProps) {
  return (
    <div className="card card-glow animate-fade-in">
      <div className="flex items-start justify-between mb-3">
        <p className="metric-label">{title}</p>
        {icon && (
          <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center text-gray-400">
            {icon}
          </div>
        )}
      </div>
      <div className="flex items-end gap-1">
        <span className={cn('metric-value', color)}>{value}</span>
        {unit && <span className="text-gray-500 text-sm mb-1">{unit}</span>}
      </div>
      {subtitle && <p className="text-xs text-gray-600 mt-1">{subtitle}</p>}
    </div>
  )
}

interface LoadingSpinnerProps { size?: 'sm' | 'md' | 'lg' }
export function LoadingSpinner({ size = 'md' }: LoadingSpinnerProps) {
  const s = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' }[size]
  return (
    <div className="flex items-center justify-center p-8">
      <div className={cn(s, 'border-2 border-gray-700 border-t-ems-400 rounded-full animate-spin')} />
    </div>
  )
}

interface EmptyStateProps { message?: string; icon?: React.ReactNode }
export function EmptyState({ message = 'Belum ada data', icon }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-gray-600">
      <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center mb-3">
        {icon || <span className="text-2xl">📊</span>}
      </div>
      <p className="text-sm">{message}</p>
    </div>
  )
}

interface ErrorStateProps { message?: string; onRetry?: () => void }
export function ErrorState({ message = 'Gagal memuat data', onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-gray-500">
      <div className="w-12 h-12 rounded-full bg-red-900/30 flex items-center justify-center mb-3">
        <span className="text-2xl">⚠️</span>
      </div>
      <p className="text-sm text-red-400 mb-3">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn btn-ghost text-xs">
          Coba lagi
        </button>
      )}
    </div>
  )
}
