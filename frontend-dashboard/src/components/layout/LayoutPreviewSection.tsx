import { useEffect, useState } from 'react'
import { Map, ExternalLink } from 'lucide-react'
import { Link } from 'react-router-dom'
import { api } from '@/lib/api'
import { SensorLayoutMap } from '@/components/layout/SensorLayoutMap'
import type { PositionMap, SensorNode } from '@/components/layout/SensorLayoutMap'
import type { ActiveLayoutResponse, ThermalStatus } from '@/types'

interface LayoutPreviewSectionProps {
  s1?: { temperature?: number | null; humidity?: number | null } | null
  s2?: { temperature?: number | null; humidity?: number | null } | null
  thermalStatus: string
}

export function LayoutPreviewSection({ s1, s2, thermalStatus }: LayoutPreviewSectionProps) {
  const [positions, setPositions] = useState<PositionMap | undefined>()

  useEffect(() => {
    api.layout()
      .then(result => {
        const layout = result as ActiveLayoutResponse
        setPositions(Object.fromEntries(layout.devices.map(d => [
          d.sensor_code,
          { x: d.pos_x, y: d.pos_y },
        ])))
      })
      .catch(() => setPositions(undefined))
  }, [])

  const sensors: SensorNode[] = [
    {
      id: 'S1',
      label: 'Sensor 1',
      role: 'Ambient/Referensi',
      temperature: s1?.temperature,
      humidity: s1?.humidity,
      status: 'normal', // S1 is ambient, always shown as normal
    },
    {
      id: 'S2',
      label: 'Sensor 2',
      role: 'Hotspot/Exhaust',
      temperature: s2?.temperature,
      humidity: s2?.humidity,
      status: (thermalStatus as ThermalStatus) ?? 'normal',
    },
  ]

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
          <Map className="w-4 h-4 text-ems-400" />
          Posisi Sensor (Live)
        </h3>
        <Link
          to="/layout"
          className="btn btn-ghost text-xs flex items-center gap-1.5 text-ems-400 hover:text-ems-300"
        >
          <ExternalLink className="w-3 h-3" />
          Edit Layout
        </Link>
      </div>

      <SensorLayoutMap sensors={sensors} editMode={false} height={220} initialPositions={positions} />
    </div>
  )
}
