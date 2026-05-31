import { useEffect, useState, useCallback } from 'react'
import { Line } from 'react-chartjs-2'
import { api } from '@/lib/api'
import type { Prediction, Sensor, SensorReading, Setting } from '@/types'

interface PredictionsResponse { predictions: Prediction[] }
interface ReadingsResponse { readings: SensorReading[] }

export function PredictionChart() {
  const [predictions, setPredictions] = useState<Prediction[]>([])
  const [s2Readings, setS2Readings] = useState<SensorReading[]>([])
  const [thresholds, setThresholds] = useState({ normal: 30, anomaly: 32 })

  const fetchData = useCallback(async () => {
    try {
      const [pRes, rRes, sensors, settings] = await Promise.all([
        api.predictionsHistory(30) as Promise<PredictionsResponse>,
        api.readingsHistory(60) as Promise<ReadingsResponse>,
        api.sensors() as Promise<Sensor[]>,
        api.settings() as Promise<Setting[]>,
      ])
      const sensorS2 = sensors.find(sensor => sensor.sensor_code === 'S2')
      setPredictions((pRes?.predictions ?? []).reverse())
      setS2Readings((rRes?.readings ?? []).filter(r => r.sensor_id === sensorS2?.id).reverse())
      setThresholds({
        normal: Number(settings.find(setting => setting.key === 'threshold_normal_max')?.value ?? 30),
        anomaly: Number(settings.find(setting => setting.key === 'threshold_anomaly_min')?.value ?? 32),
      })
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
        label: 'Aktual S2 (°C)',
        data: predictions.map(prediction => {
          const target = new Date(prediction.predicted_for).getTime()
          const nearest = s2Readings.reduce<SensorReading | null>((best, reading) => {
            if (!best) return reading
            return Math.abs(new Date(reading.recorded_at).getTime() - target) <
              Math.abs(new Date(best.recorded_at).getTime() - target) ? reading : best
          }, null)
          return nearest && Math.abs(new Date(nearest.recorded_at).getTime() - target) <= 2 * 60 * 1000
            ? nearest.temperature
            : null
        }),
        borderColor: '#fb923c',
        backgroundColor: 'rgba(251,146,60,0.08)',
        tension: 0.4,
        pointRadius: 2,
        borderWidth: 2,
      },
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
      {
        label: `Batas Waspada ${thresholds.normal}°C`,
        data: predictions.map(() => thresholds.normal),
        borderColor: '#fbbf24',
        pointRadius: 0,
        borderWidth: 1,
        borderDash: [4, 4],
      },
      {
        label: `Batas Anomali ${thresholds.anomaly}°C`,
        data: predictions.map(() => thresholds.anomaly),
        borderColor: '#f87171',
        pointRadius: 0,
        borderWidth: 1,
        borderDash: [4, 4],
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
