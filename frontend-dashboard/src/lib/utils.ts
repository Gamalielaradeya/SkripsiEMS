import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistanceToNow } from 'date-fns'
import { id } from 'date-fns/locale'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDateTime(dt: string | null | undefined): string {
  if (!dt) return '—'
  return format(new Date(dt), 'dd MMM yyyy HH:mm:ss', { locale: id })
}

export function formatRelative(dt: string | null | undefined): string {
  if (!dt) return '—'
  return formatDistanceToNow(new Date(dt), { addSuffix: true, locale: id })
}

export function formatTemp(t: number | null | undefined): string {
  if (t == null) return '—'
  return `${t.toFixed(1)}°C`
}

export function formatHum(h: number | null | undefined): string {
  if (h == null) return '—'
  return `${h.toFixed(1)}%`
}

export function formatMetric(v: number | null | undefined, decimals = 4): string {
  if (v == null) return '—'
  return v.toFixed(decimals)
}

export type ThermalStatus = 'normal' | 'waspada' | 'anomali' | 'trouble'

export function statusColor(status: ThermalStatus | string): string {
  switch (status) {
    case 'normal':  return 'text-green-400'
    case 'waspada': return 'text-amber-400'
    case 'anomali': return 'text-red-400'
    default:        return 'text-gray-400'
  }
}

export function statusBg(status: ThermalStatus | string): string {
  switch (status) {
    case 'normal':  return 'badge-normal'
    case 'waspada': return 'badge-waspada'
    case 'anomali': return 'badge-anomali'
    default:        return 'badge-trouble'
  }
}

export function statusDot(status: ThermalStatus | string): string {
  switch (status) {
    case 'normal':  return 'status-dot-normal'
    case 'waspada': return 'status-dot-waspada'
    case 'anomali': return 'status-dot-anomali'
    default:        return 'status-dot-trouble'
  }
}

export function statusLabel(status: ThermalStatus | string): string {
  switch (status) {
    case 'normal':  return 'Normal'
    case 'waspada': return 'Waspada'
    case 'anomali': return 'Anomali'
    case 'trouble': return 'Trouble'
    default:        return status
  }
}
