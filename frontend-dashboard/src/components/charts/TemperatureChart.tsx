import { useEffect, useCallback, useState } from 'react'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, Title, Tooltip, Legend, Filler
} from 'chart.js'
import { api } from '@/lib/api'
import type { SensorReading } from '@/types'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler)

interface ReadingsResponse { readings: SensorReading[] }

// ─── Time range config ───────────────────────────────────────────────────────

type Range = '5m' | '30m' | '1h' | '6h' | '1d'
const RANGES: { label: string; key: Range; limit: number; aggregate: boolean; bucketMs: number }[] = [
  { label: '5 Min',  key: '5m',  limit: 300, aggregate: false, bucketMs: 0 },
  { label: '30 Min', key: '30m', limit: 500, aggregate: false, bucketMs: 0 },
  { label: '1 Jam',  key: '1h',  limit: 500, aggregate: true,  bucketMs: 2 * 60 * 1000 },
  { label: '6 Jam',  key: '6h',  limit: 500, aggregate: true,  bucketMs: 10 * 60 * 1000 },
  { label: '1 Hari', key: '1d',  limit: 500, aggregate: true,  bucketMs: 60 * 60 * 1000 },
]
const RANGE_DURATION: Record<Range, number> = {
  '5m': 5 * 60 * 1000,
  '30m': 30 * 60 * 1000,
  '1h': 60 * 60 * 1000,
  '6h': 6 * 60 * 60 * 1000,
  '1d': 24 * 60 * 60 * 1000,
}

// ─── Aggregation helper ──────────────────────────────────────────────────────

function aggregateReadings(readings: SensorReading[], bucketMs: number): SensorReading[] {
  if (readings.length === 0 || bucketMs === 0) return readings
  const buckets = new Map<number, SensorReading[]>()
  readings.forEach(r => {
    const ts = new Date(r.recorded_at).getTime()
    const bucket = Math.floor(ts / bucketMs) * bucketMs
    if (!buckets.has(bucket)) buckets.set(bucket, [])
    buckets.get(bucket)!.push(r)
  })
  return Array.from(buckets.entries())
    .sort(([a], [b]) => a - b)
    .map(([bucket, rows]) => ({
      ...rows[0],
      temperature: rows.reduce((s, r) => s + r.temperature, 0) / rows.length,
      humidity: rows.reduce((s, r) => s + r.humidity, 0) / rows.length,
      recorded_at: new Date(bucket).toISOString(),
    }))
}

// ─── Format label ────────────────────────────────────────────────────────────

function fmtLabel(iso: string, range: Range): string {
  const d = new Date(iso)
  if (range === '1d') {
    return `${d.getHours()}:00`
  }
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

// ─── Component ───────────────────────────────────────────────────────────────

export function TemperatureChart() {
  const [allReadings, setAllReadings] = useState<SensorReading[]>([])
  const [activeRange, setActiveRange] = useState<Range>('30m')

  const fetchData = useCallback(async () => {
    try {
      const res = await api.readingsHistory(500) as ReadingsResponse
      setAllReadings((res?.readings ?? []).reverse())
    } catch {}
  }, [])

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [fetchData])

  // ── Filter by time range ──────────────────────────────────────────────────
  const rangeConfig = RANGES.find(r => r.key === activeRange)!
  const cutoff = Date.now() - RANGE_DURATION[activeRange]
  const filtered = allReadings.filter(r => new Date(r.recorded_at).getTime() >= cutoff)

  // Separate sensors
  const sensorIds = [...new Set(filtered.map(r => r.sensor_id))]
  let s1 = filtered.filter(r => r.sensor_id === sensorIds[0])
  let s2 = filtered.filter(r => r.sensor_id === sensorIds[1])

  // Aggregate if needed
  if (rangeConfig.aggregate) {
    s1 = aggregateReadings(s1, rangeConfig.bucketMs)
    s2 = aggregateReadings(s2, rangeConfig.bucketMs)
  }

  const labels = s1.map(r => fmtLabel(r.recorded_at, activeRange))

  const data = {
    labels,
    datasets: [
      {
        label: 'S1 Ambient (°C)',
        data: s1.map(r => parseFloat(r.temperature.toFixed(2))),
        borderColor: '#60a5fa',
        backgroundColor: 'rgba(96,165,250,0.08)',
        fill: true, tension: 0.4,
        pointRadius: s1.length > 60 ? 0 : 2,
        borderWidth: 2,
      },
      {
        label: 'S2 Hotspot (°C)',
        data: s2.map(r => parseFloat(r.temperature.toFixed(2))),
        borderColor: '#fb923c',
        backgroundColor: 'rgba(251,146,60,0.08)',
        fill: true, tension: 0.4,
        pointRadius: s2.length > 60 ? 0 : 2,
        borderWidth: 2,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index' as const, intersect: false },
    plugins: {
      legend: { labels: { color: '#9ca3af', font: { size: 11 } } },
      tooltip: {
        backgroundColor: '#111827',
        titleColor: '#f9fafb',
        bodyColor: '#9ca3af',
        borderColor: '#374151',
        borderWidth: 1,
        callbacks: {
          label: (ctx: any) => `${ctx.dataset.label}: ${ctx.raw}°C`,
          footer: (items: any[]) => {
            if (rangeConfig.aggregate) return `⌀ rata-rata per ${rangeConfig.bucketMs / 60000} menit`
            return ''
          },
        },
      },
    },
    scales: {
      x: { ticks: { color: '#6b7280', maxTicksLimit: 8, maxRotation: 0 }, grid: { color: '#1f2937' } },
      y: {
        ticks: { color: '#6b7280', callback: (v: any) => `${v}°C` },
        grid: { color: '#1f2937' },
      },
    },
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Time range selector */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-[10px] text-gray-600 mr-1">Rentang:</span>
        {RANGES.map(r => (
          <button
            key={r.key}
            onClick={() => setActiveRange(r.key)}
            className={`text-[11px] px-2.5 py-1 rounded-lg transition-all font-medium ${
              activeRange === r.key
                ? 'bg-ems-600/80 text-white shadow-sm'
                : 'bg-gray-800 text-gray-500 hover:text-gray-300 hover:bg-gray-700'
            }`}
          >
            {r.label}
          </button>
        ))}
        {rangeConfig.aggregate && (
          <span className="text-[10px] text-gray-600 ml-2">
            ⌀ rata-rata per {rangeConfig.bucketMs / 60000}m
          </span>
        )}
        <span className="ml-auto text-[10px] text-gray-700">{s1.length} data points</span>
      </div>

      {/* Chart */}
      {s1.length === 0 ? (
        <div className="h-48 flex items-center justify-center text-gray-600 text-sm">
          Belum ada data untuk rentang ini
        </div>
      ) : (
        <div style={{ height: 210 }}>
          <Line data={data} options={options as any} />
        </div>
      )}
    </div>
  )
}
