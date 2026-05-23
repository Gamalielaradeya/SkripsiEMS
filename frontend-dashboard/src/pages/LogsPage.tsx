import { useState, useEffect, useCallback } from 'react'
import { api } from '@/lib/api'
import { formatDateTime } from '@/lib/utils'
import { LoadingSpinner, EmptyState, ErrorState } from '@/components/ui'
import type { SystemLog } from '@/types'

interface Response { logs: SystemLog[] }

const levelColor: Record<string, string> = {
  debug: 'text-gray-500', info: 'text-blue-400',
  warn: 'text-amber-400', error: 'text-red-400',
}

export default function LogsPage() {
  const [data, setData] = useState<SystemLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<string>('all')

  const fetchData = useCallback(async () => {
    try {
      const res = await api.systemLogs(100) as Response
      setData(res?.logs ?? [])
    } catch { setError('Gagal memuat logs') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const filtered = filter === 'all' ? data : data.filter(l => l.level === filter)

  if (loading) return <LoadingSpinner size="lg" />
  if (error)   return <ErrorState message={error} onRetry={fetchData} />

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex gap-2">
        {['all', 'info', 'warn', 'error'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`btn btn-ghost text-xs uppercase ${filter === f ? 'bg-gray-800 text-gray-100' : ''}`}>
            {f}
          </button>
        ))}
        <button onClick={fetchData} className="btn btn-ghost text-xs ml-auto">Refresh</button>
      </div>
      <div className="card overflow-x-auto">
        {filtered.length === 0 ? <EmptyState message="Tidak ada log" /> : (
          <table className="data-table">
            <thead><tr><th>Level</th><th>Source</th><th>Message</th><th>Waktu</th></tr></thead>
            <tbody>
              {filtered.map(l => (
                <tr key={l.id}>
                  <td><span className={`text-xs font-semibold uppercase ${levelColor[l.level] ?? 'text-gray-400'}`}>{l.level}</span></td>
                  <td className="text-xs text-gray-500 font-mono">{l.source}</td>
                  <td className="text-xs text-gray-300 max-w-md truncate">{l.message}</td>
                  <td className="text-xs text-gray-600">{formatDateTime(l.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
