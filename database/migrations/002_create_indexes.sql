-- ================================================================
-- Migration 002 — Create Indexes
-- EMS LSTM Thermal Anomaly Monitoring System
-- ================================================================

-- sensor_readings indexes (most queried table)
CREATE INDEX IF NOT EXISTS idx_sensor_readings_recorded_at
    ON sensor_readings (recorded_at DESC);

CREATE INDEX IF NOT EXISTS idx_sensor_readings_sensor_recorded
    ON sensor_readings (sensor_id, recorded_at DESC);

CREATE INDEX IF NOT EXISTS idx_sensor_readings_gateway_recorded
    ON sensor_readings (gateway_id, recorded_at DESC);

CREATE INDEX IF NOT EXISTS idx_sensor_readings_quality
    ON sensor_readings (quality_status);

-- predictions indexes
CREATE INDEX IF NOT EXISTS idx_predictions_predicted_for
    ON predictions (predicted_for DESC);

CREATE INDEX IF NOT EXISTS idx_predictions_target_sensor
    ON predictions (target_sensor_id, predicted_for DESC);

CREATE INDEX IF NOT EXISTS idx_predictions_model_version
    ON predictions (model_version_id);

CREATE INDEX IF NOT EXISTS idx_predictions_created_at
    ON predictions (created_at DESC);

-- anomaly_events indexes
CREATE INDEX IF NOT EXISTS idx_anomaly_events_detected_at
    ON anomaly_events (detected_at DESC);

CREATE INDEX IF NOT EXISTS idx_anomaly_events_status
    ON anomaly_events (status);

CREATE INDEX IF NOT EXISTS idx_anomaly_events_sensor_detected
    ON anomaly_events (sensor_id, detected_at DESC);

-- notification_logs indexes
CREATE INDEX IF NOT EXISTS idx_notification_logs_created_at
    ON notification_logs (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notification_logs_status
    ON notification_logs (status);

-- system_logs indexes
CREATE INDEX IF NOT EXISTS idx_system_logs_created_at
    ON system_logs (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_system_logs_level
    ON system_logs (level);

CREATE INDEX IF NOT EXISTS idx_system_logs_source
    ON system_logs (source);

SELECT 'Migration 002 — All indexes created successfully.' AS result;
