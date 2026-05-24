import { useState, useEffect, useCallback } from 'react'
import { Map, Pencil, StopCircle, Info } from 'lucide-react'
import { api } from '@/lib/api'
import { useSSE } from '@/lib/sse'
import { LoadingSpinner } from '@/components/ui'
import { SensorLayoutMap } from '@/components/layout/SensorLayoutMap'
import type { SensorNode } from '@/components/layout/SensorLayoutMap'
import type { DashboardSummary } from '@/types'

export default function LayoutPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [editMode, setEditMode] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      const sum = await api.dashboardSummary() as DashboardSummary
      setSummary(sum)
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

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
    <div className="flex flex-col gap-4 animate-fade-in h-full">

      {/* Top bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-ems-600/15 border border-ems-600/30 flex items-center justify-center">
            <Map className="w-4 h-4 text-ems-400" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-100">Sensor Layout</h2>
            <p className="text-xs text-gray-500">Posisi sensor pada denah ruangan server</p>
          </div>
        </div>

        {/* Edit / Stop Edit button — mirrors the reference UI */}
        <button
          onClick={() => setEditMode(m => !m)}
          className={editMode
            ? 'btn text-sm bg-red-600/80 hover:bg-red-600 text-white flex items-center gap-2 shadow-lg'
            : 'btn btn-primary text-sm flex items-center gap-2 shadow-lg shadow-ems-500/20'
          }
        >
          {editMode
            ? <><StopCircle className="w-4 h-4" /> Stop Edit</>
            : <><Pencil className="w-4 h-4" /> Edit Location</>
          }
        </button>
      </div>

      {/* Map — full area */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <div className="card flex-1 p-3">
          <SensorLayoutMap
            sensors={sensors}
            editMode={editMode}
            height={520}
          />
        </div>
      )}

      {/* Info note */}
      <div className="flex items-start gap-2 p-3 bg-ems-500/5 border border-ems-500/20 rounded-xl">
        <Info className="w-4 h-4 text-ems-400 shrink-0 mt-0.5" />
        <p className="text-xs text-gray-400 leading-relaxed">
          Klik <strong className="text-gray-300">Edit Location</strong> untuk mengaktifkan mode edit. 
          Lalu <strong className="text-gray-300">klik kanan</strong> di area denah untuk meletakkan sensor dari <em>Device List</em>. 
          Seret ikon untuk memindahkan posisi. Klik <strong className="text-gray-300">✕</strong> di sudut ikon untuk melepasnya kembali ke Device List.
          Posisi tersimpan di browser dan ter-sinkron ke mini-map di Dashboard.
        </p>
      </div>
    </div>
  )
}
