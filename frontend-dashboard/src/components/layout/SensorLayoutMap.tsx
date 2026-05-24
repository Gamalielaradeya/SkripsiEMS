/**
 * SensorLayoutMap
 * Reusable component: 
 *   - editMode=false  → read-only mini map (Dashboard)
 *   - editMode=true   → interactive editor (LayoutPage)
 *
 * Sensor positions stored in localStorage key: 'ems_layout'
 * Floorplan image stored in localStorage key: 'ems_floorplan'
 */

import { useState, useRef, useCallback, useEffect } from 'react'
import { Upload, Move, Save, RotateCcw, Thermometer, Droplets, Map } from 'lucide-react'
import { cn, statusDot } from '@/lib/utils'
import type { ThermalStatus } from '@/types'

// ─── Types ──────────────────────────────────────────────────────────────────

export interface SensorNode {
  id: string           // 'S1' | 'S2'
  label: string
  role: string
  temperature?: number | null
  humidity?: number | null
  status: ThermalStatus
}

interface SensorPosition {
  id: string
  x: number  // percentage (0–100) of container width
  y: number  // percentage (0–100) of container height
}

const STORAGE_KEY_POSITIONS = 'ems_layout_positions'
const STORAGE_KEY_FLOORPLAN = 'ems_floorplan_image'

// ─── Default positions ───────────────────────────────────────────────────────

const DEFAULT_POSITIONS: SensorPosition[] = [
  { id: 'S1', x: 20, y: 40 },
  { id: 'S2', x: 65, y: 30 },
]

// ─── Load/Save localStorage ──────────────────────────────────────────────────

function loadPositions(): SensorPosition[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_POSITIONS)
    return raw ? JSON.parse(raw) : DEFAULT_POSITIONS
  } catch { return DEFAULT_POSITIONS }
}

function savePositions(positions: SensorPosition[]) {
  localStorage.setItem(STORAGE_KEY_POSITIONS, JSON.stringify(positions))
}

// ─── Sensor Pin Component ────────────────────────────────────────────────────

interface SensorPinProps {
  node: SensorNode
  position: SensorPosition
  draggable: boolean
  onDragEnd: (id: string, x: number, y: number) => void
  containerRef: React.RefObject<HTMLDivElement>
}

function SensorPin({ node, position, draggable, onDragEnd, containerRef }: SensorPinProps) {
  const isDraggingRef = useRef(false)
  const startMouseRef = useRef({ x: 0, y: 0 })
  const startPosRef = useRef({ x: 0, y: 0 })

  const statusColor = node.status === 'normal'
    ? 'bg-green-500 shadow-green-500/50'
    : node.status === 'waspada'
      ? 'bg-amber-500 shadow-amber-500/50'
      : 'bg-red-500 shadow-red-500/50'

  const ringColor = node.status === 'normal'
    ? 'ring-green-400/40'
    : node.status === 'waspada'
      ? 'ring-amber-400/40'
      : 'ring-red-400/40'

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!draggable) return
    e.preventDefault()
    isDraggingRef.current = true
    startMouseRef.current = { x: e.clientX, y: e.clientY }
    startPosRef.current = { x: position.x, y: position.y }

    const handleMouseMove = (ev: MouseEvent) => {
      if (!isDraggingRef.current || !containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const dx = ((ev.clientX - startMouseRef.current.x) / rect.width) * 100
      const dy = ((ev.clientY - startMouseRef.current.y) / rect.height) * 100
      const newX = Math.max(3, Math.min(97, startPosRef.current.x + dx))
      const newY = Math.max(5, Math.min(92, startPosRef.current.y + dy))
      onDragEnd(node.id, newX, newY)
    }

    const handleMouseUp = () => {
      isDraggingRef.current = false
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
  }, [draggable, position, node.id, onDragEnd, containerRef])

  return (
    <div
      className={cn(
        'absolute flex flex-col items-center gap-1 select-none',
        draggable && 'cursor-grab active:cursor-grabbing'
      )}
      style={{
        left: `${position.x}%`,
        top: `${position.y}%`,
        transform: 'translate(-50%, -50%)',
        zIndex: 10,
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Pin body */}
      <div className={cn(
        'w-10 h-10 rounded-full flex items-center justify-center ring-4 shadow-lg transition-all duration-300',
        statusColor, ringColor,
        draggable && 'hover:scale-110'
      )}>
        <Thermometer className="w-4 h-4 text-white" />
      </div>

      {/* Label card */}
      <div className="bg-gray-900/90 backdrop-blur border border-gray-700 rounded-lg px-2 py-1 min-w-[80px] text-center shadow-xl">
        <p className="text-[11px] font-bold text-gray-100">{node.id}</p>
        <p className="text-[9px] text-gray-500 leading-tight">{node.role}</p>
        {node.temperature != null && (
          <p className={cn('text-[11px] font-semibold mt-0.5',
            node.status === 'normal' ? 'text-green-400'
            : node.status === 'waspada' ? 'text-amber-400'
            : 'text-red-400'
          )}>
            {node.temperature.toFixed(1)}°C
          </p>
        )}
      </div>

      {/* Drag handle icon hint */}
      {draggable && (
        <div className="absolute -top-1 -right-1 bg-gray-700 rounded-full p-0.5">
          <Move className="w-2.5 h-2.5 text-gray-400" />
        </div>
      )}
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────────────────────────

interface SensorLayoutMapProps {
  sensors: SensorNode[]
  editMode?: boolean
  height?: number
  className?: string
}

export function SensorLayoutMap({
  sensors,
  editMode = false,
  height = 340,
  className,
}: SensorLayoutMapProps) {
  const containerRef = useRef<HTMLDivElement>(null!)
  const [positions, setPositions] = useState<SensorPosition[]>(loadPositions)
  const [floorplan, setFloorplan] = useState<string | null>(() =>
    localStorage.getItem(STORAGE_KEY_FLOORPLAN)
  )
  const [saved, setSaved] = useState(false)

  // Keep positions synced with sensors
  useEffect(() => {
    const loaded = loadPositions()
    const merged = sensors.map(s => {
      const saved = loaded.find(p => p.id === s.id)
      const def = DEFAULT_POSITIONS.find(p => p.id === s.id)
      return saved ?? def ?? { id: s.id, x: 50, y: 50 }
    })
    setPositions(merged)
  }, [sensors])

  const handlePositionChange = useCallback((id: string, x: number, y: number) => {
    setPositions(prev => prev.map(p => p.id === id ? { ...p, x, y } : p))
  }, [])

  const handleSave = () => {
    savePositions(positions)
    if (floorplan) localStorage.setItem(STORAGE_KEY_FLOORPLAN, floorplan)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const handleReset = () => {
    setPositions(DEFAULT_POSITIONS)
    savePositions(DEFAULT_POSITIONS)
  }

  const handleFloorplanUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string
      setFloorplan(dataUrl)
    }
    reader.readAsDataURL(file)
    e.target.value = '' // reset input
  }

  const handleRemoveFloorplan = () => {
    setFloorplan(null)
    localStorage.removeItem(STORAGE_KEY_FLOORPLAN)
  }

  return (
    <div className={cn('flex flex-col gap-3', className)}>

      {/* Toolbar (edit mode only) */}
      {editMode && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <label className="btn btn-ghost text-xs cursor-pointer flex items-center gap-1.5">
              <Upload className="w-3.5 h-3.5" />
              {floorplan ? 'Ganti Denah' : 'Upload Denah'}
              <input type="file" accept="image/*" className="hidden" onChange={handleFloorplanUpload} />
            </label>
            {floorplan && (
              <button onClick={handleRemoveFloorplan} className="btn btn-ghost text-xs text-red-400">
                Hapus Denah
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleReset} className="btn btn-ghost text-xs flex items-center gap-1.5">
              <RotateCcw className="w-3.5 h-3.5" /> Reset Posisi
            </button>
            <button
              onClick={handleSave}
              className={cn('btn text-xs flex items-center gap-1.5 transition-all',
                saved ? 'btn-ghost text-green-400' : 'btn-primary'
              )}
            >
              <Save className="w-3.5 h-3.5" />
              {saved ? '✓ Tersimpan!' : 'Simpan Layout'}
            </button>
          </div>
        </div>
      )}

      {/* Map container */}
      <div
        ref={containerRef}
        className="relative rounded-xl border border-gray-800 overflow-hidden bg-gray-950"
        style={{ height }}
      >
        {/* Grid background */}
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: 'linear-gradient(#6366f1 1px, transparent 1px), linear-gradient(90deg, #6366f1 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />

        {/* Floorplan image */}
        {floorplan ? (
          <img
            src={floorplan}
            alt="Floorplan"
            className="absolute inset-0 w-full h-full object-contain opacity-60"
            draggable={false}
          />
        ) : (
          /* Default visual when no floorplan */
          <div className="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none">
            <div className="flex flex-col items-center gap-2 text-gray-600">
              <Map className="w-16 h-16" />
              {editMode && <p className="text-xs">Upload denah ruangan untuk tampilan yang lebih nyata</p>}
            </div>
          </div>
        )}

        {/* Sensor Pins */}
        {sensors.map(s => {
          const pos = positions.find(p => p.id === s.id)
          if (!pos) return null
          return (
            <SensorPin
              key={s.id}
              node={s}
              position={pos}
              draggable={editMode}
              onDragEnd={handlePositionChange}
              containerRef={containerRef}
            />
          )
        })}

        {/* Edit mode hint */}
        {editMode && (
          <div className="absolute bottom-3 right-3 bg-gray-900/80 backdrop-blur rounded-lg px-2 py-1 border border-gray-700">
            <p className="text-[10px] text-gray-500 flex items-center gap-1">
              <Move className="w-3 h-3" /> Seret sensor untuk memindahkan posisinya
            </p>
          </div>
        )}

        {/* Legend */}
        <div className="absolute bottom-3 left-3 flex gap-3 bg-gray-900/80 backdrop-blur rounded-lg px-3 py-1.5 border border-gray-700">
          {(['normal', 'waspada', 'anomali'] as ThermalStatus[]).map(s => (
            <div key={s} className="flex items-center gap-1.5">
              <span className={cn('w-2 h-2 rounded-full', statusDot(s))} />
              <span className="text-[10px] text-gray-500 capitalize">{s}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}
