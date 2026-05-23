import { useState, useEffect, useCallback } from 'react'
import { Send } from 'lucide-react'
import { api } from '@/lib/api'
import { formatDateTime } from '@/lib/utils'
import { LoadingSpinner, EmptyState, ErrorState } from '@/components/ui'
import type { NotificationLog } from '@/types'

interface Response { notifications: NotificationLog[] }

export default function NotificationsPage() {
  const [data, setData] = useState<NotificationLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [testSending, setTestSending] = useState(false)
  const [testResult, setTestResult] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      const res = await api.notifications(50) as Response
      setData(res?.notifications ?? [])
    } catch { setError('Gagal memuat notifikasi') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const sendTest = async () => {
    setTestSending(true)
    setTestResult(null)
    try {
      const res = await api.notificationsTest() as { status: string; error?: string }
      setTestResult(res?.status === 'sent' ? '✅ Test notification berhasil dikirim ke Telegram!' : `❌ Gagal: ${res?.error ?? 'unknown error'}`)
    } catch { setTestResult('❌ Gagal mengirim — cek token Telegram di settings') }
    setTestSending(false)
  }

  if (loading) return <LoadingSpinner size="lg" />

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="card flex items-center justify-between p-4">
        <div>
          <p className="text-sm font-medium text-gray-200">Test Notifikasi Telegram</p>
          <p className="text-xs text-gray-500 mt-0.5">Kirim pesan test ke Telegram untuk verifikasi koneksi bot</p>
          {testResult && <p className="text-xs mt-2 font-medium">{testResult}</p>}
        </div>
        <button onClick={sendTest} disabled={testSending} className="btn btn-primary shrink-0">
          <Send className="w-4 h-4" />
          {testSending ? 'Mengirim...' : 'Kirim Test'}
        </button>
      </div>

      {error ? <ErrorState message={error} onRetry={fetchData} /> : (
        <div className="card overflow-x-auto">
          <h3 className="text-sm font-semibold text-gray-300 mb-4">Riwayat Notifikasi</h3>
          {data.length === 0 ? <EmptyState message="Belum ada notifikasi terkirim" /> : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Channel</th>
                  <th>Status</th>
                  <th>Message</th>
                  <th>Sent At</th>
                </tr>
              </thead>
              <tbody>
                {data.map(n => (
                  <tr key={n.id}>
                    <td className="text-xs font-medium text-blue-400">{n.channel}</td>
                    <td>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${n.status === 'sent' ? 'bg-green-500/15 text-green-400' : n.status === 'failed' ? 'bg-red-500/15 text-red-400' : 'bg-gray-500/15 text-gray-400'}`}>
                        {n.status}
                      </span>
                    </td>
                    <td className="text-xs text-gray-500 max-w-xs truncate">{n.message}</td>
                    <td className="text-xs text-gray-600">{n.sent_at ? formatDateTime(n.sent_at) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}
