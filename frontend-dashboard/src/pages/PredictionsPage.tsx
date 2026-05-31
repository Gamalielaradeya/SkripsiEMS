import { useState, useEffect, useCallback } from 'react'
import { api } from '@/lib/api'
import { useSSE } from '@/lib/sse'
import { formatTemp, formatDateTime } from '@/lib/utils'
import { LoadingSpinner, EmptyState, ErrorState } from '@/components/ui'
import type { Prediction } from '@/types'

interface Response { predictions: Prediction[] }

export default function PredictionsPage() {
  const [data, setData] = useState<Prediction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [offset, setOffset] = useState(0)
  const LIMIT = 50

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.predictionsHistory(LIMIT, offset) as Response
      setData(res?.predictions ?? [])
    } catch { setError('Gagal memuat prediksi') }
    finally { setLoading(false) }
  }, [offset])

  useEffect(() => { fetchData() }, [fetchData])
  useSSE(useCallback((event) => {
    if (event === 'prediction.latest') fetchData()
  }, [fetchData]))

  if (loading) return <LoadingSpinner size="lg" />
  if (error)   return <ErrorState message={error} onRetry={fetchData} />

  return (
    <div className="space-y-4 animate-fade-in">
      <p className="text-sm text-gray-500">{data.length} prediksi tercatat</p>
      <div className="card overflow-x-auto">
        {data.length === 0 ? (
          <EmptyState message="Belum ada prediksi — jalankan ML Worker untuk melatih model" />
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Prediksi Suhu S2</th>
                <th>Horizon</th>
                <th>Window Size</th>
                <th>Diprediksi Untuk</th>
                <th>Created At</th>
              </tr>
            </thead>
            <tbody>
              {data.map(p => (
                <tr key={p.id}>
                  <td className="text-gray-600 text-xs font-mono">#{p.id}</td>
                  <td className="font-mono text-purple-400 font-semibold">{formatTemp(p.predicted_temperature)}</td>
                  <td className="text-xs text-gray-500">{p.prediction_horizon_minutes} menit</td>
                  <td className="text-xs text-gray-500">{p.input_window_size} data</td>
                  <td className="text-xs text-gray-400">{formatDateTime(p.predicted_for)}</td>
                  <td className="text-xs text-gray-600">{formatDateTime(p.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
