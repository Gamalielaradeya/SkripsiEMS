import { useEffect, useRef, useState, useCallback } from 'react'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, Title, Tooltip, Legend, Filler
} from 'chart.js'
import { api } from '@/lib/api'
import { formatDateTime } from '@/lib/utils'
import type { SensorReading } from '@/types'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler)

interface ReadingsResponse {
  readings: SensorReading[]
}

export function TemperatureChart() {
  const [readings, setReadings] = useState<SensorReading[]>([])

  const fetchData = useCallback(async () => {
    try {
      const res = await api.readingsHistory(60) as ReadingsResponse
      setReadings((res?.readings ?? []).reverse())
    } catch {}
  }, [])

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [fetchData])

  // Separate S1 and S2
  const sensorIds = [...new Set(readings.map(r => r.sensor_id))]
  const s1 = readings.filter(r => r.sensor_id === sensorIds[0])
  const s2 = readings.filter(r => r.sensor_id === sensorIds[1])
  const labels = s1.map(r => {
    const d = new Date(r.recorded_at)
    return `${d.getHours()}:${String(d.getMinutes()).padStart(2,'0')}`
  })

  const data = {
    labels,
    datasets: [
      {
        label: 'S1 Ambient (°C)',
        data: s1.map(r => r.temperature),
        borderColor: '#60a5fa',
        backgroundColor: 'rgba(96,165,250,0.08)',
        fill: true,
        tension: 0.4,
        pointRadius: 2,
        borderWidth: 2,
      },
      {
        label: 'S2 Hotspot (°C)',
        data: s2.map(r => r.temperature),
        borderColor: '#fb923c',
        backgroundColor: 'rgba(251,146,60,0.08)',
        fill: true,
        tension: 0.4,
        pointRadius: 2,
        borderWidth: 2,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: '#9ca3af', font: { size: 11 } } },
      tooltip: {
        backgroundColor: '#111827',
        titleColor: '#f9fafb',
        bodyColor: '#9ca3af',
        borderColor: '#374151',
        borderWidth: 1,
      },
    },
    scales: {
      x: { ticks: { color: '#6b7280', maxTicksLimit: 8 }, grid: { color: '#1f2937' } },
      y: { ticks: { color: '#6b7280', callback: (v: number) => `${v}°C` }, grid: { color: '#1f2937' } },
    },
  }

  if (readings.length === 0) {
    return <div className="h-48 flex items-center justify-center text-gray-600 text-sm">Belum ada data suhu</div>
  }

  return (
    <div style={{ height: 220 }}>
      <Line data={data} options={options as any} />
    </div>
  )
}
