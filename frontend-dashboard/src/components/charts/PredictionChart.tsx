import { useEffect, useState, useCallback } from 'react'
import { Line } from 'react-chartjs-2'
import { api } from '@/lib/api'
import type { Prediction, SensorReading } from '@/types'

interface PredictionsResponse { predictions: Prediction[] }
interface ReadingsResponse { readings: SensorReading[] }

export function PredictionChart() {
  const [predictions, setPredictions] = useState<Prediction[]>([])
  const [s2Readings, setS2Readings] = useState<SensorReading[]>([])

  const fetchData = useCallback(async () => {
    try {
      const [pRes, rRes] = await Promise.all([
        api.predictionsHistory(30) as Promise<PredictionsResponse>,
        api.readingsHistory(60) as Promise<ReadingsResponse>,
      ])
      setPredictions((pRes?.predictions ?? []).reverse())
      setS2Readings((rRes?.readings ?? []).filter(r => r.sensor_id !== undefined).reverse())
    } catch {}
  }, [])

  useEffect(() => { fetchData(); const i = setInterval(fetchData, 30000); return () => clearInterval(i) }, [fetchData])

  if (predictions.length === 0) {
    return <div className="h-48 flex items-center justify-center text-gray-600 text-sm">Belum ada data prediksi</div>
  }

  const labels = predictions.map(p => {
    const d = new Date(p.created_at)
    return `${d.getHours()}:${String(d.getMinutes()).padStart(2,'0')}`
  })

  const data = {
    labels,
    datasets: [
      {
        label: 'Prediksi S2 (°C)',
        data: predictions.map(p => p.predicted_temperature),
        borderColor: '#a78bfa',
        backgroundColor: 'rgba(167,139,250,0.08)',
        fill: true,
        tension: 0.4,
        pointRadius: 3,
        borderWidth: 2,
        borderDash: [5, 3],
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: '#9ca3af', font: { size: 11 } } },
      tooltip: { backgroundColor: '#111827', titleColor: '#f9fafb', bodyColor: '#9ca3af', borderColor: '#374151', borderWidth: 1 },
      annotation: {
        annotations: {
          waspada: { type: 'line', yMin: 30, yMax: 30, borderColor: '#fbbf24', borderWidth: 1, borderDash: [4, 4], label: { content: 'Waspada 30°C', enabled: true, color: '#fbbf24', font: { size: 9 } } },
          anomali: { type: 'line', yMin: 32, yMax: 32, borderColor: '#f87171', borderWidth: 1, borderDash: [4, 4], label: { content: 'Anomali 32°C', enabled: true, color: '#f87171', font: { size: 9 } } },
        }
      }
    },
    scales: {
      x: { ticks: { color: '#6b7280', maxTicksLimit: 8 }, grid: { color: '#1f2937' } },
      y: { ticks: { color: '#6b7280', callback: (v: number) => `${v}°C` }, grid: { color: '#1f2937' }, min: 20, max: 40 },
    },
  }

  return (
    <div style={{ height: 220 }}>
      <Line data={data} options={options as any} />
    </div>
  )
}
