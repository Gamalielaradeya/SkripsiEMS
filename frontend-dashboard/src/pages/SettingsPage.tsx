import { useState, useEffect, useCallback } from 'react'
import { api } from '@/lib/api'
import { LoadingSpinner, ErrorState } from '@/components/ui'
import type { Setting } from '@/types'

const GROUPS = [
  {
    title: 'Parameter Machine Learning',
    keys: ['threshold_normal_max', 'threshold_anomaly_min', 'window_size', 'horizon_minutes']
  },
  {
    title: 'Konfigurasi Gateway & Sensor',
    keys: ['sampling_interval_seconds', 'gateway_timeout_seconds']
  },
  {
    title: 'Notifikasi Telegram',
    keys: ['telegram_enabled', 'telegram_bot_token', 'telegram_chat_id', 'telegram_cooldown_minutes']
  }
]

export default function SettingsPage() {
  const [originalSettings, setOriginalSettings] = useState<Setting[]>([])
  const [formState, setFormState] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      const res = await api.settings() as Setting[]
      setOriginalSettings(res ?? [])
      
      const formInit: Record<string, string> = {}
      res?.forEach(s => { formInit[s.key] = s.value })
      setFormState(formInit)
    } catch { setError('Gagal memuat pengaturan') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  // Detect dirty state
  const isDirty = originalSettings.some(s => formState[s.key] !== s.value)

  // Warn before leaving if dirty
  useEffect(() => {
    if (!isDirty) return

    // 1. Intercept refresh / close tab
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = '' // Required for Chrome to show prompt
    }
    window.addEventListener('beforeunload', handleBeforeUnload)

    // 2. Intercept React Router in-app navigation (clicks on Sidebar links)
    const handleClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest('a')
      if (target && target.href && !target.href.includes('/settings')) {
        if (!window.confirm('⚠️ Ada perubahan yang belum disimpan. Yakin ingin meninggalkan halaman?')) {
          e.preventDefault()
          e.stopPropagation()
        }
      }
    }
    // Use capture phase to catch the event before React Router does
    document.addEventListener('click', handleClick, { capture: true })

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      document.removeEventListener('click', handleClick, { capture: true })
    }
  }, [isDirty])

  const handleSave = async () => {
    setSaving(true)
    setSaveMsg(null)
    try {
      const changes = originalSettings.filter(s => formState[s.key] !== s.value)
      // Save sequentially
      for (const s of changes) {
        await api.settingUpdate(s.key, formState[s.key])
      }
      setSaveMsg('✅ Berhasil menyimpan pengaturan')
      fetchData() // refresh original state
    } catch { 
      setSaveMsg('❌ Gagal menyimpan pengaturan') 
    }
    setSaving(false)
    setTimeout(() => setSaveMsg(null), 3000)
  }

  if (loading) return <LoadingSpinner size="lg" />
  if (error)   return <ErrorState message={error} onRetry={fetchData} />

  return (
    <div className="max-w-4xl space-y-6 animate-fade-in relative pb-20">
      
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-100">Sistem Pengaturan</h2>
          <p className="text-sm text-gray-400 mt-1">Konfigurasi parameter operasional dan notifikasi EMS.</p>
        </div>
      </div>

      {GROUPS.map((group, i) => (
        <div key={i} className="card">
          <h3 className="text-sm font-semibold text-ems-400 mb-4 pb-2 border-b border-gray-800">{group.title}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {group.keys.map(key => {
              const setting = originalSettings.find(s => s.key === key)
              if (!setting) return null
              
              // Handle boolean differently
              const isBool = setting.value === 'true' || setting.value === 'false'
              
              return (
                <div key={key} className="space-y-1">
                  <label className="text-xs font-medium text-gray-300 block">{key.replace(/_/g, ' ').toUpperCase()}</label>
                  <p className="text-[10px] text-gray-500 mb-2 min-h-[15px]">{setting.description}</p>
                  
                  {isBool ? (
                    <select 
                      value={formState[key]} 
                      onChange={e => setFormState(p => ({ ...p, [key]: e.target.value }))}
                      className="w-full bg-gray-800 border border-gray-700 text-sm text-gray-200 rounded px-3 py-2 focus:outline-none focus:border-ems-500 transition-colors"
                    >
                      <option value="true">Aktif (True)</option>
                      <option value="false">Mati (False)</option>
                    </select>
                  ) : (
                    <input 
                      type={key.includes('token') ? 'password' : 'text'}
                      value={formState[key]}
                      onChange={e => setFormState(p => ({ ...p, [key]: e.target.value }))}
                      className="w-full bg-gray-800 border border-gray-700 text-sm text-gray-200 rounded px-3 py-2 focus:outline-none focus:border-ems-500 transition-colors"
                      placeholder={`Masukkan ${key}...`}
                    />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}

      {/* Floating Save Bar */}
      <div className={`fixed bottom-14 md:bottom-0 left-0 md:left-60 right-0 p-4 glass border-t border-gray-800 flex flex-wrap gap-3 justify-between items-center transition-transform duration-300 z-40 ${isDirty ? 'translate-y-0' : 'translate-y-full'}`}>
        <div className="flex items-center gap-3">
          <span className="text-amber-400 text-sm font-medium animate-pulse">⚠️ Ada perubahan yang belum disimpan</span>
          {saveMsg && <span className="text-sm">{saveMsg}</span>}
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => fetchData()} 
            disabled={saving}
            className="btn btn-ghost text-sm"
          >
            Batal
          </button>
          <button 
            onClick={handleSave} 
            disabled={saving}
            className="btn btn-primary text-sm shadow-lg shadow-ems-500/20"
          >
            {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
          </button>
        </div>
      </div>

    </div>
  )
}
