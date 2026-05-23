import { useState, useEffect, useCallback } from 'react'
import { api } from '@/lib/api'
import { formatTemp, formatHum, formatDateTime } from '@/lib/utils'
import { LoadingSpinner, ErrorState, EmptyState } from '@/components/ui'
import { useSSE } from '@/lib/sse'
import type { SensorReading } from '@/types'

interface Response { readings: SensorReading[]; limit: number; offset: number }

const LIMIT = 50

export default function ReadingsPage() {
  const [data, setData] = useState<SensorReading[]>([])
  const [offset, setOffset] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.readingsHistory(LIMIT, offset) as Response
      setData(res?.readings ?? [])
    } catch { setError('Gagal memuat readings') }
    finally { setLoading(false) }
  }, [offset])

  useEffect(() => { fetchData() }, [fetchData])

  useSSE(useCallback((event, payload) => {
    if (event === 'reading.latest') {
      const newReadings = payload as SensorReading[]
      setData(prev => {
        // Only auto-prepend if we are on the first page
        if (offset !== 0) return prev
        
        // Filter out readings that are already in the list
        const uniqueNew = newReadings.filter(nr => !prev.some(r => r.id === nr.id))
        if (uniqueNew.length === 0) return prev
        
        const next = [...uniqueNew, ...prev]
        if (next.length > LIMIT) next.length = LIMIT // truncate
        return next
      })
    }
  }, [offset]))

  if (loading) return <LoadingSpinner size="lg" />
  if (error)   return <ErrorState message={error} onRetry={fetchData} />

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          Menampilkan {data.length} data sensor terbaru 
          {offset === 0 && <span className="ml-2 text-green-400 animate-pulse text-xs">• Auto-updating</span>}
        </p>
        <button onClick={fetchData} className="btn btn-ghost text-xs">Refresh</button>
      </div>
      <div className="card overflow-x-auto">
        {data.length === 0 ? <EmptyState message="Belum ada data sensor" /> : (
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Sensor ID</th>
                <th>Suhu</th>
                <th>Kelembaban</th>
                <th>Quality</th>
                <th>Recorded At</th>
              </tr>
            </thead>
            <tbody>
              {data.map(r => (
                <tr key={r.id}>
                  <td className="text-gray-600 text-xs font-mono">#{r.id}</td>
                  <td className="font-mono text-xs">sensor_{r.sensor_id}</td>
                  <td className="font-mono text-blue-400">{formatTemp(r.temperature)}</td>
                  <td className="font-mono text-cyan-400">{formatHum(r.humidity)}</td>
                  <td>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${r.quality_status === 'simulated' ? 'bg-purple-500/15 text-purple-400' : r.quality_status === 'valid' ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'}`}>
                      {r.quality_status}
                    </span>
                  </td>
                  <td className="text-gray-500 text-xs">{formatDateTime(r.recorded_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <div className="flex justify-between items-center">
        <button disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - LIMIT))} className="btn btn-ghost text-xs disabled:opacity-30">← Sebelumnya</button>
        <span className="text-xs text-gray-600">Halaman {Math.floor(offset / LIMIT) + 1}</span>
        <button disabled={data.length < LIMIT} onClick={() => setOffset(offset + LIMIT)} className="btn btn-ghost text-xs disabled:opacity-30">Selanjutnya →</button>
      </div>
    </div>
  )
}
