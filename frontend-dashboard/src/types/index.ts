// ── Sensor & Reading Types ─────────────────────────────────────────────────

export interface Sensor {
  id: number
  sensor_code: 'S1' | 'S2'
  sensor_role: 'ambient' | 'hotspot'
  name: string
  status: string
  last_seen_at: string | null
}

export interface SensorReading {
  id: number
  gateway_id: number
  sensor_id: number
  temperature: number
  humidity: number
  recorded_at: string
  quality_status: 'valid' | 'simulated' | 'invalid' | 'timeout'
  created_at: string
}

export interface LatestSensorData {
  sensor_code: string
  sensor_role: string
  temperature: number
  humidity: number
  recorded_at: string
  status: string
}

// ── Dashboard Types ────────────────────────────────────────────────────────

export interface DashboardSummary {
  s1_latest: LatestSensorData | null
  s2_latest: LatestSensorData | null
  latest_prediction: Prediction | null
  thermal_status: 'normal' | 'waspada' | 'anomali' | 'trouble'
  gateway_status: string
  last_updated_at: string | null
}

// ── Prediction Types ───────────────────────────────────────────────────────

export interface Prediction {
  id: number
  model_version_id: number
  target_sensor_id: number
  predicted_temperature: number
  prediction_horizon_minutes: number
  input_window_size: number
  predicted_for: string
  created_at: string
}

// ── Anomaly Types ──────────────────────────────────────────────────────────

export interface AnomalyEvent {
  id: number
  prediction_id: number
  sensor_id: number
  status: 'normal' | 'waspada' | 'anomali'
  predicted_temperature: number
  actual_temperature: number | null
  threshold_normal_max: number
  threshold_anomaly_min: number
  description: string
  detected_at: string
  created_at: string
}

// ── Metrics Types ──────────────────────────────────────────────────────────

export interface ModelMetrics {
  id: number
  model_version_id: number
  train_size: number | null
  test_size: number | null
  rmse: number
  mae: number
  mape: number
  created_at: string
}

export interface BaselineResult {
  id: number
  baseline_type: 'persistence' | 'moving_average'
  rmse: number
  mae: number
  mape: number
  created_at: string
}

// ── Notification Types ─────────────────────────────────────────────────────

export interface NotificationLog {
  id: number
  anomaly_event_id: number | null
  channel: string
  recipient: string | null
  message: string
  status: 'pending' | 'sent' | 'failed' | 'skipped'
  sent_at: string | null
  error_message: string | null
  created_at: string
}

// ── Setting Types ──────────────────────────────────────────────────────────

export interface Setting {
  id: number
  key: string
  value: string
  description: string
  updated_at: string
}

// ── System Log Types ───────────────────────────────────────────────────────

export interface SystemLog {
  id: number
  source: string
  level: 'debug' | 'info' | 'warn' | 'error'
  message: string
  created_at: string
}

// ── SSE Event Types ────────────────────────────────────────────────────────

export type ThermalStatus = 'normal' | 'waspada' | 'anomali' | 'trouble'
