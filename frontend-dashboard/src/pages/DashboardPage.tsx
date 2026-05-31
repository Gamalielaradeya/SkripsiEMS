import { useState, useEffect, useCallback } from 'react'
import { Thermometer, Droplets, TrendingUp, Activity, AlertTriangle, Clock, Server } from 'lucide-react'
import { api } from '@/lib/api'
import { useSSE } from '@/lib/sse'
import { formatTemp, formatHum, formatDateTime, formatRelative, cn, statusBg, statusDot, statusLabel } from '@/lib/utils'
import { MetricCard, LoadingSpinner, ErrorState, StatusBadge } from '@/components/ui'
import { TemperatureChart } from '@/components/charts/TemperatureChart'
import { PredictionChart } from '@/components/charts/PredictionChart'
import { LayoutPreviewSection } from '@/components/layout/LayoutPreviewSection'
import type { DashboardSummary, AnomalyEvent } from '@/types'

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [anomalies, setAnomalies] = useState<AnomalyEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      const [sum, anom] = await Promise.all([
        api.dashboardSummary() as Promise<DashboardSummary>,
        api.anomalies(5, 0) as Promise<{ anomalies: AnomalyEvent[] }>,
      ])
      setSummary(sum)
      setAnomalies(anom?.anomalies ?? [])
      setError(null)
    } catch (e) {
      setError('Gagal memuat data dashboard')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  // SSE real-time updates
  useSSE(useCallback((event) => {
    if (event === 'reading.latest' || event === 'sensor.trouble' || event === 'prediction.latest' || event === 'anomaly.created') {
      fetchData()
    }
  }, [fetchData]))

  if (loading) return <LoadingSpinner size="lg" />
  if (error) return <ErrorState message={error} onRetry={fetchData} />

  const thermalStatus = summary?.thermal_status ?? 'normal'

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ── Status Banner ── */}
      <div className={cn(
        'rounded-xl border p-4 flex items-center justify-between',
        thermalStatus === 'normal'  && 'bg-green-500/5 border-green-500/20',
        thermalStatus === 'waspada' && 'bg-amber-500/5 border-amber-500/20',
        thermalStatus === 'anomali' && 'bg-red-500/5 border-red-500/20',
        thermalStatus === 'trouble' && 'bg-gray-500/5 border-gray-500/20',
      )}>
        <div className="flex items-center gap-3">
          <span className={cn('status-dot w-3 h-3', statusDot(thermalStatus), thermalStatus !== 'normal' && 'animate-pulse')} />
          <div>
            <p className="text-sm font-semibold text-gray-100">Status Termal: <span className={cn(thermalStatus === 'normal' ? 'text-green-400' : thermalStatus === 'waspada' ? 'text-amber-400' : 'text-red-400')}>{statusLabel(thermalStatus)}</span></p>
            <p className="text-xs text-gray-500">
              Update terakhir: {formatRelative(summary?.last_updated_at)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 text-xs text-gray-500">
            <Server className="w-3.5 h-3.5" />
            Gateway
            <span className={cn(
              'font-semibold uppercase',
              summary?.gateway_status === 'online' ? 'text-green-400' : 'text-red-400'
            )}>
              {summary?.gateway_status ?? 'offline'}
            </span>
          </div>
          <StatusBadge status={thermalStatus} size="lg" pulse />
        </div>
      </div>

      {/* ── Layout Preview + Sensor Cards (side by side) ── */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">

        {/* Layout mini-map — takes 3/5 */}
        <div className="xl:col-span-3">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">Peta Sensor</h2>
          <LayoutPreviewSection
            s1={summary?.s1_latest}
            s2={summary?.s2_latest}
            thermalStatus={thermalStatus}
          />
        </div>

        {/* Sensor metric cards — takes 2/5, stacked */}
        <div className="xl:col-span-2">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">Pembacaan Sensor</h2>
          <div className="grid grid-cols-2 gap-3">
            <MetricCard
              title="Suhu S1"
              value={formatTemp(summary?.s1_latest?.temperature ?? null)}
              icon={<Thermometer className="w-4 h-4" />}
              color="text-blue-400"
              subtitle={summary?.s1_latest?.recorded_at ? formatRelative(summary.s1_latest.recorded_at) : 'Belum ada data'}
            />
            <MetricCard
              title="Hum S1"
              value={formatHum(summary?.s1_latest?.humidity ?? null)}
              icon={<Droplets className="w-4 h-4" />}
              color="text-blue-300"
              subtitle="Ambient"
            />
            <MetricCard
              title="Suhu S2"
              value={formatTemp(summary?.s2_latest?.temperature ?? null)}
              icon={<Thermometer className="w-4 h-4" />}
              color={thermalStatus === 'anomali' ? 'text-red-400' : thermalStatus === 'waspada' ? 'text-amber-400' : 'text-orange-400'}
              subtitle={summary?.s2_latest?.recorded_at ? formatRelative(summary.s2_latest.recorded_at) : 'Belum ada data'}
            />
            <MetricCard
              title="Hum S2"
              value={formatHum(summary?.s2_latest?.humidity ?? null)}
              icon={<Droplets className="w-4 h-4" />}
              color="text-orange-300"
              subtitle="Hotspot"
            />
          </div>
        </div>
      </div>

      {/* ── Prediction Card ── */}
      <div>
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">Prediksi LSTM</h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <MetricCard
            title="Prediksi Suhu S2"
            value={formatTemp(summary?.latest_prediction?.predicted_temperature ?? null)}
            icon={<TrendingUp className="w-4 h-4" />}
            color={thermalStatus === 'anomali' ? 'text-red-400' : thermalStatus === 'waspada' ? 'text-amber-400' : 'text-ems-400'}
            subtitle={`Horizon: ${summary?.latest_prediction?.prediction_horizon_minutes ?? 5} menit ke depan`}
          />
          <MetricCard
            title="Status Termal"
            value={statusLabel(thermalStatus)}
            icon={<Activity className="w-4 h-4" />}
            color={thermalStatus === 'normal' ? 'text-green-400' : thermalStatus === 'waspada' ? 'text-amber-400' : 'text-red-400'}
            subtitle="Berdasarkan prediksi S2"
          />
          <MetricCard
            title="Diprediksi Untuk"
            value={summary?.latest_prediction?.predicted_for
              ? formatDateTime(summary.latest_prediction.predicted_for).split(' ').slice(1).join(' ')
              : '—'}
            icon={<Clock className="w-4 h-4" />}
            color="text-gray-300"
            subtitle={summary?.latest_prediction?.created_at ? formatRelative(summary.latest_prediction.created_at) : 'Belum ada prediksi'}
          />
        </div>
      </div>

      {/* ── Charts ── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-sm font-semibold text-gray-300 mb-4">📈 Grafik Suhu Historis</h3>
          <TemperatureChart />
        </div>
        <div className="card">
          <h3 className="text-sm font-semibold text-gray-300 mb-4">🎯 Aktual S2 vs Prediksi</h3>
          <PredictionChart />
        </div>
      </div>


      {/* ── Recent Anomalies ── */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            Anomali Terbaru
          </h3>
        </div>
        {anomalies.length === 0 ? (
          <p className="text-sm text-gray-600 py-4 text-center">Tidak ada anomali tercatat 🎉</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Suhu Prediksi</th>
                  <th>Threshold</th>
                  <th>Waktu Deteksi</th>
                </tr>
              </thead>
              <tbody>
                {anomalies.map(a => (
                  <tr key={a.id}>
                    <td><StatusBadge status={a.status} size="sm" /></td>
                    <td className="font-mono">{formatTemp(a.predicted_temperature)}</td>
                    <td className="text-gray-500 text-xs">
                      Normal &lt;{a.threshold_normal_max}°C · Anomali &gt;{a.threshold_anomaly_min}°C
                    </td>
                    <td className="text-gray-500 text-xs">{formatDateTime(a.detected_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  )
}
