-- ================================================================
-- Migration 003 — TimescaleDB Hypertable
-- EMS LSTM Thermal Anomaly Monitoring System
-- Jalankan hanya jika TimescaleDB tersedia
-- ================================================================

CREATE EXTENSION IF NOT EXISTS timescaledb;

SELECT create_hypertable(
    'sensor_readings',
    'recorded_at',
    if_not_exists => TRUE,
    migrate_data => TRUE
);

SELECT 'Migration 003 — TimescaleDB hypertable created for sensor_readings.' AS result;
