import { Map, Info } from 'lucide-react'

export default function LayoutPage() {
  return (
    <div className="space-y-4 animate-fade-in">
      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-ems-600/15 border border-ems-600/30 flex items-center justify-center">
            <Map className="w-5 h-5 text-ems-400" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-100">Sensor Layout</h2>
            <p className="text-xs text-gray-500">Posisi sensor XY-MD02 pada server testbed</p>
          </div>
        </div>

        {/* Layout visual — placeholder */}
        <div className="relative bg-gray-950 rounded-xl border border-gray-800 overflow-hidden" style={{ height: 360 }}>
          {/* Background grid */}
          <div className="absolute inset-0 opacity-10"
            style={{ backgroundImage: 'linear-gradient(#374151 1px, transparent 1px), linear-gradient(90deg, #374151 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

          {/* Server rack illustration */}
          <div className="absolute inset-0 flex items-center justify-center gap-16">
            {/* Server rack */}
            <div className="relative">
              <div className="w-28 h-48 bg-gray-800 border border-gray-600 rounded-lg flex flex-col items-center justify-center gap-2">
                <div className="text-xs text-gray-400 font-medium">Server</div>
                <div className="text-xs text-gray-500">Testbed</div>
                <div className="w-20 h-2 bg-gray-700 rounded" />
                <div className="w-20 h-2 bg-gray-700 rounded" />
                <div className="w-20 h-2 bg-gray-700 rounded" />
              </div>
              {/* S2 hotspot marker */}
              <div className="absolute -right-10 -top-2 flex items-center gap-1.5">
                <div className="status-dot status-dot-normal animate-pulse" />
                <span className="text-xs text-orange-400 font-semibold">S2</span>
                <span className="text-[10px] text-gray-500">Hotspot/Exhaust</span>
              </div>
            </div>

            {/* S1 ambient marker */}
            <div className="flex flex-col items-center gap-2">
              <div className="w-16 h-16 bg-gray-800 border border-gray-600 rounded-lg flex items-center justify-center">
                <span className="text-2xl">🌡️</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="status-dot status-dot-normal" />
                <span className="text-xs text-blue-400 font-semibold">S1</span>
                <span className="text-[10px] text-gray-500">Ambient</span>
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="absolute bottom-3 left-3 flex gap-4">
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <div className="status-dot status-dot-normal" /> Normal
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <div className="status-dot status-dot-waspada" /> Waspada
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <div className="status-dot status-dot-anomali" /> Anomali
            </div>
          </div>
        </div>

        <div className="flex items-start gap-2 mt-3 p-3 bg-blue-500/5 border border-blue-500/20 rounded-lg">
          <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
          <p className="text-xs text-gray-400">
            Sensor layout dapat dikonfigurasi via database tabel <code className="text-ems-400">layouts</code> dan <code className="text-ems-400">layout_devices</code>.
            Posisi sensor dapat diupload dengan gambar denah ruangan server.
          </p>
        </div>
      </div>
    </div>
  )
}
