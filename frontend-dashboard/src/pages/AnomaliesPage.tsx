import { useState, useEffect, useCallback } from 'react'
import { api } from '@/lib/api'
import { useSSE } from '@/lib/sse'
import { formatTemp, formatDateTime } from '@/lib/utils'
import { LoadingSpinner, EmptyState, ErrorState, StatusBadge } from '@/components/ui'
import type { AnomalyEvent } from '@/types'

interface Response { anomalies: AnomalyEvent[] }

export default function AnomaliesPage() {
  const [data, setData] = useState<AnomalyEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [offset, setOffset] = useState(0)
  const LIMIT = 50

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.anomalies(LIMIT, offset) as Response
      setData(res?.anomalies ?? [])
    } catch { setError('Gagal memuat anomali') }
    finally { setLoading(false) }
  }, [offset])

  useEffect(() => { fetchData() }, [fetchData])
  useSSE(useCallback((event) => {
    if (event === 'anomaly.created') fetchData()
  }, [fetchData]))

  if (loading) return <LoadingSpinner size="lg" />
  if (error)   return <ErrorState message={error} onRetry={fetchData} />

  return (
    <div className="space-y-4 animate-fade-in">
      <p className="text-sm text-gray-500">{data.length} anomali terdeteksi</p>
      <div className="card overflow-x-auto">
        {data.length === 0 ? (
          <EmptyState message="Tidak ada anomali tercatat — sistem berjalan normal 🎉" />
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Status</th>
                <th>Prediksi S2</th>
                <th>Aktual S2</th>
                <th>Threshold Normal</th>
                <th>Threshold Anomali</th>
                <th>Waktu Deteksi</th>
              </tr>
            </thead>
            <tbody>
              {data.map(a => (
                <tr key={a.id}>
                  <td><StatusBadge status={a.status} size="sm" pulse={a.status !== 'normal'} /></td>
                  <td className="font-mono text-sm">{formatTemp(a.predicted_temperature)}</td>
                  <td className="font-mono text-sm">{a.actual_temperature != null ? formatTemp(a.actual_temperature) : '—'}</td>
                  <td className="text-gray-500 text-xs">&lt; {a.threshold_normal_max}°C</td>
                  <td className="text-gray-500 text-xs">&gt; {a.threshold_anomaly_min}°C</td>
                  <td className="text-gray-500 text-xs">{formatDateTime(a.detected_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
