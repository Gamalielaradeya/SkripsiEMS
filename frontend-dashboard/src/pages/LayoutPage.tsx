import { useState, useEffect, useCallback } from 'react'
import { Map, Move, Info } from 'lucide-react'
import { api } from '@/lib/api'
import { useSSE } from '@/lib/sse'
import { LoadingSpinner } from '@/components/ui'
import { SensorLayoutMap } from '@/components/layout/SensorLayoutMap'
import type { SensorNode } from '@/components/layout/SensorLayoutMap'
import type { DashboardSummary } from '@/types'

export default function LayoutPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    try {
      const sum = await api.dashboardSummary() as DashboardSummary
      setSummary(sum)
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  // Auto-refresh sensor live readings via SSE
  useSSE(useCallback((event) => {
    if (event === 'reading.latest' || event === 'prediction.latest') {
      fetchData()
    }
  }, [fetchData]))

  const thermalStatus = summary?.thermal_status ?? 'normal'

  const sensors: SensorNode[] = [
    {
      id: 'S1',
      label: 'Sensor 1',
      role: 'Ambient/Referensi',
      temperature: summary?.s1_latest?.temperature,
      humidity: summary?.s1_latest?.humidity,
      status: 'normal',
    },
    {
      id: 'S2',
      label: 'Sensor 2',
      role: 'Hotspot/Exhaust',
      temperature: summary?.s2_latest?.temperature,
      humidity: summary?.s2_latest?.humidity,
      status: thermalStatus as SensorNode['status'],
    },
  ]

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-100 flex items-center gap-2">
            <Map className="w-5 h-5 text-ems-400" /> Sensor Layout Editor
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            Atur posisi sensor pada denah ruangan. Posisi tersimpan secara lokal di browser.
          </p>
        </div>
      </div>

      {/* How-to guide */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {[
          { icon: '🗺️', title: 'Upload Denah', desc: 'Klik "Upload Denah" untuk mengunggah gambar floor plan / denah ruangan (JPG/PNG).' },
          { icon: '🖱️', title: 'Drag & Drop Sensor', desc: 'Seret ikon sensor S1 (ambient) dan S2 (hotspot) ke posisi yang sesuai pada denah.' },
          { icon: '💾', title: 'Simpan Layout', desc: 'Klik "Simpan Layout". Posisi akan tampil live di Dashboard dan terupdate secara real-time.' },
        ].map((step, i) => (
          <div key={i} className="card flex items-start gap-3 p-4">
            <span className="text-2xl leading-none mt-0.5">{step.icon}</span>
            <div>
              <p className="text-sm font-semibold text-gray-200">{step.title}</p>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">{step.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Map Editor */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-ems-600/15 border border-ems-600/30 flex items-center justify-center">
            <Move className="w-4 h-4 text-ems-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-100">Edit Mode Aktif</h3>
            <p className="text-xs text-gray-500">Seret sensor untuk memindahkan posisinya</p>
          </div>
        </div>

        {loading ? (
          <LoadingSpinner size="lg" />
        ) : (
          <SensorLayoutMap
            sensors={sensors}
            editMode={true}
            height={480}
          />
        )}
      </div>

      {/* Note */}
      <div className="flex items-start gap-2 p-3 bg-ems-500/5 border border-ems-500/20 rounded-xl">
        <Info className="w-4 h-4 text-ems-400 shrink-0 mt-0.5" />
        <p className="text-xs text-gray-400">
          Posisi sensor dan gambar denah disimpan di <strong className="text-gray-300">localStorage browser</strong>. 
          Untuk deployment multi-user di masa mendatang, posisi ini dapat dimigrasikan ke tabel database <code className="text-ems-400">layout_devices</code>.
          Perubahan posisi akan langsung terlihat pada mini-map di halaman Dashboard.
        </p>
      </div>

    </div>
  )
}
