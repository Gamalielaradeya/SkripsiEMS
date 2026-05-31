/**
 * SensorLayoutMap v3
 * - mix-blend-mode: screen → floorplan blends with dark background
 * - Zoom in/out + pan (mouse wheel + buttons)
 * - Sensor icon size slider
 * - Right-click → Device List → place sensor
 * - X button → unplace sensor
 * - Drag to reposition
 */

import { useState, useRef, useCallback, useEffect, WheelEvent } from 'react'
import { Upload, Move, Save, RotateCcw, Thermometer, Map, X, Cpu, ZoomIn, ZoomOut, Maximize2, Sliders } from 'lucide-react'
import { cn, statusDot } from '@/lib/utils'
import type { ThermalStatus } from '@/types'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface SensorNode {
  id: string
  label: string
  role: string
  temperature?: number | null
  humidity?: number | null
  status: ThermalStatus
}

export interface PlacedPosition {
  x: number  // percentage 0–100
  y: number
}

export type PositionMap = Record<string, PlacedPosition | null>

interface ContextMenuState {
  visible: boolean
  pixelX: number
  pixelY: number
  mapX: number
  mapY: number
}

const STORAGE_KEY_POSITIONS = 'ems_layout_positions_v2'
const STORAGE_KEY_FLOORPLAN = 'ems_floorplan_image'
const STORAGE_KEY_ICON_SIZE = 'ems_layout_icon_size'

function loadPositions(): PositionMap {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY_POSITIONS) ?? 'null') ?? {} }
  catch { return {} }
}
function persistPositions(p: PositionMap) {
  localStorage.setItem(STORAGE_KEY_POSITIONS, JSON.stringify(p))
}
function loadIconSize(): number {
  return parseInt(localStorage.getItem(STORAGE_KEY_ICON_SIZE) ?? '40')
}

// ─── Sensor Pin ───────────────────────────────────────────────────────────────

interface SensorPinProps {
  node: SensorNode
  pos: PlacedPosition
  editMode: boolean
  iconSize: number
  onMove: (id: string, x: number, y: number) => void
  onRemove: (id: string) => void
  containerRef: React.RefObject<HTMLDivElement>
}

function SensorPin({ node, pos, editMode, iconSize, onMove, onRemove, containerRef }: SensorPinProps) {
  const isDragging = useRef(false)
  const startMouse = useRef({ x: 0, y: 0 })
  const startPos = useRef({ x: 0, y: 0 })

  const statusGlow = node.status === 'normal'
    ? 'bg-green-500 shadow-green-500/60 ring-green-400/30'
    : node.status === 'waspada'
      ? 'bg-amber-500 shadow-amber-500/60 ring-amber-400/30'
      : node.status === 'anomali'
        ? 'bg-red-500 shadow-red-500/60 ring-red-400/30'
        : 'bg-gray-500 shadow-gray-500/60 ring-gray-400/30'
  const tempColor = node.status === 'normal' ? 'text-green-400'
    : node.status === 'waspada' ? 'text-amber-400'
      : node.status === 'anomali' ? 'text-red-400' : 'text-gray-400'

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!editMode) return
    if ((e.target as HTMLElement).closest('[data-remove]')) return
    e.preventDefault()
    isDragging.current = true
    startMouse.current = { x: e.clientX, y: e.clientY }
    startPos.current = { x: pos.x, y: pos.y }
    const onMouseMove = (ev: MouseEvent) => {
      if (!isDragging.current || !containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const dx = ((ev.clientX - startMouse.current.x) / rect.width) * 100
      const dy = ((ev.clientY - startMouse.current.y) / rect.height) * 100
      onMove(node.id, Math.max(2, Math.min(98, startPos.current.x + dx)), Math.max(2, Math.min(98, startPos.current.y + dy)))
    }
    const onUp = () => {
      isDragging.current = false
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onUp)
  }, [editMode, pos, node.id, onMove, containerRef])

  const circleSize = iconSize
  const fontSize = Math.max(9, Math.round(iconSize * 0.28))
  const cardWidth = Math.max(72, Math.round(iconSize * 2.2))

  return (
    <div
      data-sensor-pin="true"
      className={cn('absolute flex flex-col items-center select-none', editMode ? 'cursor-grab active:cursor-grabbing' : 'cursor-default')}
      style={{ left: `${pos.x}%`, top: `${pos.y}%`, transform: 'translate(-50%, -50%)', zIndex: 10, gap: 3 }}
      onMouseDown={handleMouseDown}
    >
      {editMode && (
        <button
          data-remove="true"
          onClick={e => { e.stopPropagation(); onRemove(node.id) }}
          className="absolute -top-1.5 -right-1.5 z-20 w-4 h-4 bg-red-600 hover:bg-red-500 rounded-full flex items-center justify-center shadow border border-red-400/40 transition-colors"
        >
          <X className="w-2.5 h-2.5 text-white" />
        </button>
      )}
      <div
        className={cn('rounded-full flex items-center justify-center ring-4 shadow-lg transition-all duration-300', statusGlow, editMode && 'hover:scale-110')}
        style={{ width: circleSize, height: circleSize }}
      >
        <Thermometer style={{ width: circleSize * 0.38, height: circleSize * 0.38 }} className="text-white" />
      </div>
      <div className="bg-gray-900/95 backdrop-blur border border-gray-700 rounded-lg text-center shadow-xl" style={{ width: cardWidth, padding: '4px 6px' }}>
        <p style={{ fontSize: Math.max(10, fontSize + 1) }} className="font-bold text-gray-100 leading-tight">{node.id}</p>
        <p style={{ fontSize: Math.max(8, fontSize - 1) }} className="text-gray-500 leading-tight">{node.role}</p>
        {node.temperature != null && (
          <p style={{ fontSize }} className={cn('font-semibold mt-0.5', tempColor)}>{node.temperature.toFixed(1)}°C</p>
        )}
      </div>
      {editMode && (
        <div className="absolute -bottom-1 -right-1 bg-gray-700 rounded-full p-0.5 opacity-60">
          <Move style={{ width: 9, height: 9 }} className="text-gray-400" />
        </div>
      )}
    </div>
  )
}

// ─── Context Menu ─────────────────────────────────────────────────────────────

interface ContextMenuProps {
  unplacedSensors: SensorNode[]
  pixelX: number
  pixelY: number
  containerRef: React.RefObject<HTMLDivElement>
  onPlace: (id: string) => void
  onClose: () => void
}

function DeviceListMenu({ unplacedSensors, pixelX, pixelY, containerRef, onPlace, onClose }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)
  const menuW = 260
  const containerRect = containerRef.current?.getBoundingClientRect()
  let ax = pixelX, ay = pixelY
  if (containerRect) {
    if (ax + menuW > containerRect.width) ax = pixelX - menuW
    if (ay + 200 > containerRect.height) ay = pixelY - 200
  }
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [onClose])

  return (
    <div ref={menuRef} className="absolute z-50 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl overflow-hidden" style={{ left: ax, top: ay, width: menuW }} onContextMenu={e => e.preventDefault()}>
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-gray-800 bg-gray-950">
        <div className="flex items-center gap-2">
          <Cpu className="w-3.5 h-3.5 text-ems-400" />
          <span className="text-xs font-semibold text-gray-200">Device List</span>
        </div>
        <button onClick={onClose} className="text-gray-600 hover:text-gray-400 rounded"><X className="w-3.5 h-3.5" /></button>
      </div>
      {unplacedSensors.length === 0 ? (
        <div className="px-4 py-6 text-center"><p className="text-xs text-gray-500">Semua sensor sudah di peta.</p></div>
      ) : (
        <div className="divide-y divide-gray-800 max-h-56 overflow-y-auto">
          {unplacedSensors.map(s => (
            <button key={s.id} onClick={() => { onPlace(s.id); onClose() }} className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-800 transition-colors text-left">
              <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center shrink-0">
                <Thermometer className="w-4 h-4 text-ems-400" />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-200">{s.id} — {s.label}</p>
                <p className="text-[10px] text-gray-500">{s.role}</p>
              </div>
            </button>
          ))}
        </div>
      )}
      <div className="px-3 py-2 border-t border-gray-800 bg-gray-950">
        <p className="text-[10px] text-gray-600">Klik sensor untuk meletakkan di titik ini</p>
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface SensorLayoutMapProps {
  sensors: SensorNode[]
  editMode?: boolean
  height?: number
  className?: string
  initialPositions?: PositionMap
  onSavePositions?: (positions: PositionMap) => Promise<void>
}

const MIN_ZOOM = 50, MAX_ZOOM = 300, ZOOM_STEP = 25

export function SensorLayoutMap({ sensors, editMode = false, height = 340, className, initialPositions, onSavePositions }: SensorLayoutMapProps) {
  const containerRef = useRef<HTMLDivElement>(null!)
  const [positions, setPositions] = useState<PositionMap>(() => initialPositions ?? loadPositions())
  const [floorplan, setFloorplan] = useState<string | null>(() => localStorage.getItem(STORAGE_KEY_FLOORPLAN))
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [zoom, setZoom] = useState(100)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [iconSize, setIconSize] = useState(loadIconSize)
  const [showSizeSlider, setShowSizeSlider] = useState(false)
  const [bgMode, setBgMode] = useState<'dark' | 'light'>(
    () => (localStorage.getItem('ems_layout_bgmode') as 'dark' | 'light') ?? 'dark'
  )
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({ visible: false, pixelX: 0, pixelY: 0, mapX: 0, mapY: 0 })
  const isPanning = useRef(false)
  const panStart = useRef({ mx: 0, my: 0, px: 0, py: 0 })

  useEffect(() => {
    if (initialPositions) setPositions(initialPositions)
  }, [initialPositions])

  const placedSensors = sensors.filter(s => positions[s.id] != null)
  const unplacedSensors = sensors.filter(s => positions[s.id] == null)

  const handleMove = useCallback((id: string, x: number, y: number) => setPositions(prev => ({ ...prev, [id]: { x, y } })), [])
  const handleRemove = useCallback((id: string) => setPositions(prev => ({ ...prev, [id]: null })), [])
  const handlePlace = useCallback((sensorId: string) => {
    setPositions(prev => ({ ...prev, [sensorId]: { x: contextMenu.mapX, y: contextMenu.mapY } }))
  }, [contextMenu.mapX, contextMenu.mapY])

  const handleSave = async () => {
    setSaving(true)
    setSaveError(null)
    persistPositions(positions)
    localStorage.setItem(STORAGE_KEY_ICON_SIZE, String(iconSize))
    localStorage.setItem('ems_layout_bgmode', bgMode)
    if (floorplan) localStorage.setItem(STORAGE_KEY_FLOORPLAN, floorplan)
    else localStorage.removeItem(STORAGE_KEY_FLOORPLAN)
    try {
      await onSavePositions?.(positions)
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch {
      setSaveError('Gagal sinkron ke server. Draft tetap tersimpan di browser.')
    } finally {
      setSaving(false)
    }
  }
  const handleReset = () => {
    const empty: PositionMap = {}
    sensors.forEach(s => { empty[s.id] = null })
    setPositions(empty)
    persistPositions(empty)
    setZoom(100); setPan({ x: 0, y: 0 })
  }
  const handleFloorplanUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    const reader = new FileReader()
    reader.onload = ev => setFloorplan(ev.target?.result as string)
    reader.readAsDataURL(file); e.target.value = ''
  }

  const handleWheel = useCallback((e: WheelEvent<HTMLDivElement>) => {
    e.preventDefault()
    setZoom(z => Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, z - Math.sign(e.deltaY) * ZOOM_STEP)))
  }, [])

  const handleMapMouseDown = useCallback((e: React.MouseEvent) => {
    // Pan on left-click on empty area (not on a sensor pin or button)
    if (e.button === 0) {
      const target = e.target as HTMLElement
      // Don't pan if clicking on a sensor pin or any interactive element
      if (target.closest('[data-sensor-pin]') || target.closest('[data-remove]') || target.closest('[data-context-menu]')) return
      e.preventDefault()
      isPanning.current = true
      panStart.current = { mx: e.clientX, my: e.clientY, px: pan.x, py: pan.y }
      const onMouseMove = (ev: MouseEvent) => {
        if (!isPanning.current) return
        setPan({ x: panStart.current.px + (ev.clientX - panStart.current.mx), y: panStart.current.py + (ev.clientY - panStart.current.my) })
      }
      const onUp = () => { isPanning.current = false; window.removeEventListener('mousemove', onMouseMove); window.removeEventListener('mouseup', onUp) }
      window.addEventListener('mousemove', onMouseMove); window.addEventListener('mouseup', onUp)
    }
  }, [pan])

  const handleContextMenu = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!editMode) return
    e.preventDefault()
    const rect = containerRef.current.getBoundingClientRect()
    const pixelX = e.clientX - rect.left
    const pixelY = e.clientY - rect.top
    const mapX = ((pixelX - pan.x - rect.width * (1 - zoom / 100) / 2) / (rect.width * zoom / 100)) * 100
    const mapY = ((pixelY - pan.y - rect.height * (1 - zoom / 100) / 2) / (rect.height * zoom / 100)) * 100
    setContextMenu({ visible: true, pixelX, pixelY, mapX: Math.max(2, Math.min(98, mapX)), mapY: Math.max(2, Math.min(98, mapY)) })
  }, [editMode, zoom, pan])

  return (
    <div className={cn('flex flex-col gap-3', className)}>

      {/* Toolbar */}
      {editMode && (
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <label className="btn btn-ghost text-xs cursor-pointer flex items-center gap-1.5">
              <Upload className="w-3.5 h-3.5" />
              {floorplan ? 'Ganti Denah' : 'Upload Denah'}
              <input type="file" accept="image/*" className="hidden" onChange={handleFloorplanUpload} />
            </label>
            {floorplan && <button onClick={() => { setFloorplan(null); localStorage.removeItem(STORAGE_KEY_FLOORPLAN) }} className="btn btn-ghost text-xs text-red-400">Hapus</button>}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {unplacedSensors.length > 0 && (
              <span className="text-xs text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2 py-1 rounded-lg">
                {unplacedSensors.length} sensor belum diletakkan — klik kanan di peta
              </span>
            )}
            {/* Icon size slider */}
            <div className="relative">
              <button onClick={() => setShowSizeSlider(s => !s)} className={cn('btn btn-ghost text-xs flex items-center gap-1.5', showSizeSlider && 'text-ems-400 bg-ems-600/10')}>
                <Sliders className="w-3.5 h-3.5" /> Ukuran Ikon
              </button>
              {showSizeSlider && (
                <div className="absolute right-0 top-9 z-50 bg-gray-900 border border-gray-700 rounded-xl p-3 w-52 shadow-xl">
                  <p className="text-[10px] text-gray-500 mb-2">Ukuran Ikon: <span className="text-gray-300 font-bold">{iconSize}px</span></p>
                  <input type="range" min={24} max={80} step={4} value={iconSize} onChange={e => setIconSize(Number(e.target.value))} className="w-full accent-ems-500" />
                  <div className="flex justify-between text-[10px] text-gray-600 mt-1"><span>Kecil</span><span>Besar</span></div>
                </div>
              )}
            </div>

            {/* Background mode toggle */}
            <div className="flex items-center gap-1 bg-gray-800 rounded-lg p-0.5">
              <button
                onClick={() => setBgMode('dark')}
                className={cn('text-[11px] px-2.5 py-1 rounded-md font-medium transition-all flex items-center gap-1',
                  bgMode === 'dark' ? 'bg-gray-700 text-gray-100 shadow' : 'text-gray-500 hover:text-gray-300'
                )}
              >
                🌑 Gelap
              </button>
              <button
                onClick={() => setBgMode('light')}
                className={cn('text-[11px] px-2.5 py-1 rounded-md font-medium transition-all flex items-center gap-1',
                  bgMode === 'light' ? 'bg-white text-gray-800 shadow' : 'text-gray-500 hover:text-gray-300'
                )}
              >
                ☀️ Terang
              </button>
            </div>
            <button onClick={handleReset} className="btn btn-ghost text-xs flex items-center gap-1.5"><RotateCcw className="w-3.5 h-3.5" /> Reset</button>
            <button onClick={handleSave} disabled={saving} className={cn('btn text-xs flex items-center gap-1.5 transition-all', saved ? 'btn-ghost text-green-400' : 'btn-primary')}>
              <Save className="w-3.5 h-3.5" />{saving ? 'Menyimpan...' : saved ? 'Tersimpan' : 'Simpan Layout'}
            </button>
          </div>
        </div>
      )}
      {saveError && <p className="text-xs text-red-400">{saveError}</p>}

      {/* Map wrapper — overflow-hidden prevents zoom from leaking out */}
      <div className="relative overflow-hidden rounded-xl" style={{ height }}>
        {/* Zoom buttons */}
        <div className="absolute top-3 left-3 z-30 flex flex-col gap-1">
          <button onClick={() => setZoom(z => Math.min(MAX_ZOOM, z + ZOOM_STEP))} className="w-7 h-7 bg-gray-900/90 border border-gray-700 rounded-lg flex items-center justify-center hover:bg-gray-800 text-gray-300 transition-colors" title="Zoom In"><ZoomIn className="w-3.5 h-3.5" /></button>
          <button onClick={() => { setZoom(100); setPan({ x: 0, y: 0 }) }} className="w-7 h-7 bg-gray-900/90 border border-gray-700 rounded-lg flex items-center justify-center hover:bg-gray-800 text-gray-400 transition-colors" title="Reset"><Maximize2 className="w-3 h-3" /></button>
          <button onClick={() => setZoom(z => Math.max(MIN_ZOOM, z - ZOOM_STEP))} className="w-7 h-7 bg-gray-900/90 border border-gray-700 rounded-lg flex items-center justify-center hover:bg-gray-800 text-gray-300 transition-colors" title="Zoom Out"><ZoomOut className="w-3.5 h-3.5" /></button>
          <span className="text-[9px] text-gray-600 text-center">{zoom}%</span>
        </div>

        {/* Map canvas — pure black or white bg, no grid */}
        <div
          ref={containerRef}
          className={cn('w-full h-full border cursor-grab active:cursor-grabbing', editMode ? 'border-ems-600/40' : 'border-gray-800')}
          style={{ background: bgMode === 'dark' ? '#000000' : '#ffffff' }}
          onContextMenu={handleContextMenu}
          onMouseDown={handleMapMouseDown}
          onWheel={handleWheel}
          onClick={() => setContextMenu(p => ({ ...p, visible: false }))}
        >
          {/* NO grid overlay — clean canvas */}

          {/* Zoomable inner layer */}
          <div className="absolute inset-0 origin-center" style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom / 100})`, transition: 'transform 0.1s ease-out' }}>

            {/* Floorplan — plain image, no blend mode, bg controlled by bgMode */}
            {floorplan ? (
              <img
                src={floorplan} alt="Denah Ruangan" draggable={false}
                className="absolute inset-0 w-full h-full object-contain"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="flex flex-col items-center gap-2 text-gray-800">
                  <Map className="w-14 h-14" />
                  {editMode && <p className="text-xs text-gray-700 text-center max-w-[200px]">Upload denah ruangan, lalu klik kanan untuk meletakkan sensor</p>}
                </div>
              </div>
            )}

            {/* Sensor Pins */}
            {placedSensors.map(s => {
              const pos = positions[s.id]; if (!pos) return null
              return <SensorPin key={s.id} node={s} pos={pos} editMode={editMode} iconSize={iconSize} onMove={handleMove} onRemove={handleRemove} containerRef={containerRef} />
            })}
          </div>

          {/* Context Menu — outside zoomable layer */}
          {editMode && contextMenu.visible && (
            <DeviceListMenu unplacedSensors={unplacedSensors} pixelX={contextMenu.pixelX} pixelY={contextMenu.pixelY} containerRef={containerRef} onPlace={handlePlace} onClose={() => setContextMenu(p => ({ ...p, visible: false }))} />
          )}

          {/* Edit hint */}
          {editMode && (
            <div className="absolute top-3 right-3 bg-gray-900/80 backdrop-blur rounded-lg px-2.5 py-1.5 border border-ems-600/30">
              <p className="text-[10px] text-ems-400">Klik kanan · Scroll zoom · Ctrl+drag pan</p>
            </div>
          )}

          {/* Legend */}
          <div className="absolute bottom-3 left-12 flex gap-3 bg-gray-900/80 backdrop-blur rounded-lg px-3 py-1.5 border border-gray-700">
            {(['normal', 'waspada', 'anomali', 'trouble'] as ThermalStatus[]).map(s => (
              <div key={s} className="flex items-center gap-1.5">
                <span className={cn('w-2 h-2 rounded-full', statusDot(s))} />
                <span className="text-[10px] text-gray-500 capitalize">{s}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  )
}
