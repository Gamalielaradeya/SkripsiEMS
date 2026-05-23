import { useState, useEffect, useCallback } from 'react'
import { BarChart3, TrendingDown } from 'lucide-react'
import { api } from '@/lib/api'
import { formatMetric, formatDateTime } from '@/lib/utils'
import { LoadingSpinner, ErrorState, MetricCard, EmptyState } from '@/components/ui'
import { Bar } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js'
import type { ModelMetrics, BaselineResult } from '@/types'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

export default function EvaluationPage() {
  const [metrics, setMetrics] = useState<ModelMetrics | null>(null)
  const [baselines, setBaselines] = useState<BaselineResult[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      const [m, b] = await Promise.all([
        api.modelMetrics() as Promise<ModelMetrics>,
        api.baselines() as Promise<BaselineResult[]>,
      ])
      setMetrics(m)
      setBaselines(b ?? [])
    } catch { setError('Gagal memuat evaluasi model') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  if (loading) return <LoadingSpinner size="lg" />
  if (error)   return <ErrorState message={error} onRetry={fetchData} />

  const persistence  = baselines.find(b => b.baseline_type === 'persistence')
  const movingAvg    = baselines.find(b => b.baseline_type === 'moving_average')

  // Chart comparison
  const compData = {
    labels: ['RMSE', 'MAE', 'MAPE (%)'],
    datasets: [
      {
        label: 'LSTM',
        data: metrics ? [metrics.rmse, metrics.mae, metrics.mape] : [],
        backgroundColor: 'rgba(167,139,250,0.7)',
        borderColor: '#a78bfa', borderWidth: 1, borderRadius: 4,
      },
      {
        label: 'Persistence',
        data: persistence ? [persistence.rmse, persistence.mae, persistence.mape] : [],
        backgroundColor: 'rgba(251,146,60,0.5)',
        borderColor: '#fb923c', borderWidth: 1, borderRadius: 4,
      },
      {
        label: 'Moving Average',
        data: movingAvg ? [movingAvg.rmse, movingAvg.mae, movingAvg.mape] : [],
        backgroundColor: 'rgba(96,165,250,0.5)',
        borderColor: '#60a5fa', borderWidth: 1, borderRadius: 4,
      },
    ],
  }

  const compOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: '#9ca3af', font: { size: 11 } } },
      tooltip: { backgroundColor: '#111827', titleColor: '#f9fafb', bodyColor: '#9ca3af', borderColor: '#374151', borderWidth: 1 },
    },
    scales: {
      x: { ticks: { color: '#6b7280' }, grid: { color: '#1f2937' } },
      y: { ticks: { color: '#6b7280' }, grid: { color: '#1f2937' } },
    },
  }

  return (
    <div className="space-y-6 animate-fade-in">

      {/* LSTM Metrics */}
      <div>
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">Evaluasi LSTM</h2>
        {!metrics ? (
          <div className="card"><EmptyState message="Belum ada evaluasi — jalankan train_lstm.py dulu" /></div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-4 mb-2">
              <MetricCard title="RMSE" value={formatMetric(metrics.rmse)} icon={<TrendingDown className="w-4 h-4" />} color="text-purple-400" subtitle="Root Mean Squared Error" />
              <MetricCard title="MAE" value={formatMetric(metrics.mae)} icon={<TrendingDown className="w-4 h-4" />} color="text-purple-300" subtitle="Mean Absolute Error" />
              <MetricCard title="MAPE" value={`${formatMetric(metrics.mape, 2)}%`} icon={<BarChart3 className="w-4 h-4" />} color="text-violet-400" subtitle="Mean Absolute % Error" />
            </div>
            <p className="text-xs text-gray-600 ml-1">Train: {metrics.train_size ?? '—'} · Test: {metrics.test_size ?? '—'} · {formatDateTime(metrics.created_at)}</p>
          </>
        )}
      </div>

      {/* Baseline Comparison */}
      <div>
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">Perbandingan Baseline</h2>
        <div className="grid grid-cols-2 gap-4 mb-4">
          {persistence && (
            <div className="card">
              <p className="metric-label mb-2">Persistence Model</p>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div><div className="text-lg font-bold text-orange-400">{formatMetric(persistence.rmse)}</div><div className="text-xs text-gray-600">RMSE</div></div>
                <div><div className="text-lg font-bold text-orange-300">{formatMetric(persistence.mae)}</div><div className="text-xs text-gray-600">MAE</div></div>
                <div><div className="text-lg font-bold text-amber-400">{formatMetric(persistence.mape, 2)}%</div><div className="text-xs text-gray-600">MAPE</div></div>
              </div>
            </div>
          )}
          {movingAvg && (
            <div className="card">
              <p className="metric-label mb-2">Moving Average (window=5)</p>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div><div className="text-lg font-bold text-blue-400">{formatMetric(movingAvg.rmse)}</div><div className="text-xs text-gray-600">RMSE</div></div>
                <div><div className="text-lg font-bold text-blue-300">{formatMetric(movingAvg.mae)}</div><div className="text-xs text-gray-600">MAE</div></div>
                <div><div className="text-lg font-bold text-cyan-400">{formatMetric(movingAvg.mape, 2)}%</div><div className="text-xs text-gray-600">MAPE</div></div>
              </div>
            </div>
          )}
          {!persistence && !movingAvg && <div className="card col-span-2"><EmptyState message="Belum ada hasil baseline" /></div>}
        </div>

        {/* Bar chart comparison */}
        {metrics && (
          <div className="card">
            <h3 className="text-sm font-semibold text-gray-300 mb-4">📊 LSTM vs Baseline Comparison</h3>
            <div style={{ height: 280 }}>
              <Bar data={compData} options={compOptions as any} />
            </div>
          </div>
        )}
      </div>

    </div>
  )
}
