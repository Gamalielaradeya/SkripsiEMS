-- ================================================================
-- Migration 001 — Create All Tables
-- EMS LSTM Thermal Anomaly Monitoring System
-- ================================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ================================================================
-- TABLE: gateways
-- ================================================================
CREATE TABLE IF NOT EXISTS gateways (
    id          BIGSERIAL PRIMARY KEY,
    gateway_code VARCHAR(100) NOT NULL UNIQUE,
    name        VARCHAR(150) NOT NULL,
    location    VARCHAR(255),
    description TEXT,
    ip_address  INET,
    status      VARCHAR(30) NOT NULL DEFAULT 'active',
    last_seen_at TIMESTAMPTZ,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ================================================================
-- TABLE: sensors
-- ================================================================
CREATE TABLE IF NOT EXISTS sensors (
    id              BIGSERIAL PRIMARY KEY,
    gateway_id      BIGINT REFERENCES gateways(id) ON DELETE SET NULL,
    sensor_code     VARCHAR(20) NOT NULL,
    sensor_role     VARCHAR(30) NOT NULL,
    name            VARCHAR(150) NOT NULL,
    type            VARCHAR(100) NOT NULL DEFAULT 'XY-MD02',
    location        VARCHAR(255),
    modbus_slave_id INT,
    status          VARCHAR(30) NOT NULL DEFAULT 'normal',
    last_seen_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_sensor_code   CHECK (sensor_code IN ('S1', 'S2')),
    CONSTRAINT chk_sensor_role   CHECK (sensor_role IN ('ambient', 'hotspot')),
    CONSTRAINT chk_sensor_status CHECK (status IN ('normal', 'waspada', 'anomali', 'trouble', 'inactive')),
    CONSTRAINT uq_gateway_sensor_code UNIQUE (gateway_id, sensor_code)
);

-- ================================================================
-- TABLE: sensor_readings
-- ================================================================
CREATE TABLE IF NOT EXISTS sensor_readings (
    id             BIGSERIAL PRIMARY KEY,
    gateway_id     BIGINT NOT NULL REFERENCES gateways(id) ON DELETE CASCADE,
    sensor_id      BIGINT NOT NULL REFERENCES sensors(id) ON DELETE CASCADE,
    temperature    NUMERIC(6,2) NOT NULL,
    humidity       NUMERIC(6,2) NOT NULL,
    recorded_at    TIMESTAMPTZ NOT NULL,
    quality_status VARCHAR(30) NOT NULL DEFAULT 'valid',
    raw_payload    JSONB,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_temperature_range CHECK (temperature >= 0 AND temperature <= 80),
    CONSTRAINT chk_humidity_range    CHECK (humidity >= 0 AND humidity <= 100),
    CONSTRAINT chk_quality_status    CHECK (quality_status IN ('valid', 'invalid', 'timeout', 'simulated'))
);

-- ================================================================
-- TABLE: model_versions
-- ================================================================
CREATE TABLE IF NOT EXISTS model_versions (
    id                         BIGSERIAL PRIMARY KEY,
    model_name                 VARCHAR(150) NOT NULL,
    model_type                 VARCHAR(50)  NOT NULL DEFAULT 'LSTM',
    version                    VARCHAR(50)  NOT NULL,
    algorithm                  VARCHAR(100) NOT NULL DEFAULT 'Long Short-Term Memory',
    feature_columns            JSONB        NOT NULL,
    target_column              VARCHAR(100) NOT NULL DEFAULT 'temperature_s2',
    window_size                INT          NOT NULL DEFAULT 30,
    horizon_minutes            INT          NOT NULL DEFAULT 5,
    sampling_interval_seconds  INT          NOT NULL DEFAULT 60,
    model_path                 TEXT,
    scaler_path                TEXT,
    parameters                 JSONB,
    trained_at                 TIMESTAMPTZ,
    created_at                 TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_model_version UNIQUE (model_name, version)
);

-- ================================================================
-- TABLE: prediction_runs
-- ================================================================
CREATE TABLE IF NOT EXISTS prediction_runs (
    id               BIGSERIAL PRIMARY KEY,
    model_version_id BIGINT REFERENCES model_versions(id) ON DELETE SET NULL,
    run_type         VARCHAR(30) NOT NULL,
    started_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    finished_at      TIMESTAMPTZ,
    status           VARCHAR(30) NOT NULL DEFAULT 'running',
    message          TEXT,
    metadata         JSONB,

    CONSTRAINT chk_prediction_run_type   CHECK (run_type IN ('training', 'inference', 'batch')),
    CONSTRAINT chk_prediction_run_status CHECK (status IN ('running', 'success', 'failed'))
);

-- ================================================================
-- TABLE: predictions
-- ================================================================
CREATE TABLE IF NOT EXISTS predictions (
    id                         BIGSERIAL PRIMARY KEY,
    prediction_run_id          BIGINT REFERENCES prediction_runs(id) ON DELETE SET NULL,
    model_version_id           BIGINT NOT NULL REFERENCES model_versions(id) ON DELETE RESTRICT,
    target_sensor_id           BIGINT NOT NULL REFERENCES sensors(id) ON DELETE RESTRICT,
    predicted_temperature      NUMERIC(6,2) NOT NULL,
    prediction_horizon_minutes INT          NOT NULL DEFAULT 5,
    input_window_size          INT          NOT NULL DEFAULT 30,
    input_start_at             TIMESTAMPTZ,
    input_end_at               TIMESTAMPTZ,
    predicted_for              TIMESTAMPTZ  NOT NULL,
    created_at                 TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    metadata                   JSONB
);

-- ================================================================
-- TABLE: anomaly_events
-- ================================================================
CREATE TABLE IF NOT EXISTS anomaly_events (
    id                    BIGSERIAL PRIMARY KEY,
    prediction_id         BIGINT NOT NULL REFERENCES predictions(id) ON DELETE CASCADE,
    sensor_id             BIGINT NOT NULL REFERENCES sensors(id) ON DELETE RESTRICT,
    status                VARCHAR(30) NOT NULL,
    predicted_temperature NUMERIC(6,2) NOT NULL,
    actual_temperature    NUMERIC(6,2),
    threshold_normal_max  NUMERIC(6,2) NOT NULL DEFAULT 30.00,
    threshold_anomaly_min NUMERIC(6,2) NOT NULL DEFAULT 32.00,
    description           TEXT,
    detected_at           TIMESTAMPTZ NOT NULL,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_anomaly_status CHECK (status IN ('normal', 'waspada', 'anomali'))
);

-- ================================================================
-- TABLE: model_metrics
-- ================================================================
CREATE TABLE IF NOT EXISTS model_metrics (
    id               BIGSERIAL PRIMARY KEY,
    model_version_id BIGINT NOT NULL REFERENCES model_versions(id) ON DELETE CASCADE,
    dataset_start_at TIMESTAMPTZ,
    dataset_end_at   TIMESTAMPTZ,
    train_size       INT,
    test_size        INT,
    rmse             NUMERIC(10,4) NOT NULL,
    mae              NUMERIC(10,4) NOT NULL,
    mape             NUMERIC(10,4) NOT NULL,
    metadata         JSONB,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ================================================================
-- TABLE: baseline_results
-- ================================================================
CREATE TABLE IF NOT EXISTS baseline_results (
    id               BIGSERIAL PRIMARY KEY,
    model_version_id BIGINT REFERENCES model_versions(id) ON DELETE SET NULL,
    baseline_type    VARCHAR(50) NOT NULL,
    dataset_start_at TIMESTAMPTZ,
    dataset_end_at   TIMESTAMPTZ,
    rmse             NUMERIC(10,4) NOT NULL,
    mae              NUMERIC(10,4) NOT NULL,
    mape             NUMERIC(10,4) NOT NULL,
    parameters       JSONB,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_baseline_type CHECK (baseline_type IN ('persistence', 'moving_average'))
);

-- ================================================================
-- TABLE: notification_logs
-- ================================================================
CREATE TABLE IF NOT EXISTS notification_logs (
    id               BIGSERIAL PRIMARY KEY,
    anomaly_event_id BIGINT REFERENCES anomaly_events(id) ON DELETE SET NULL,
    channel          VARCHAR(30) NOT NULL DEFAULT 'telegram',
    recipient        VARCHAR(255),
    message          TEXT NOT NULL,
    status           VARCHAR(30) NOT NULL DEFAULT 'pending',
    sent_at          TIMESTAMPTZ,
    error_message    TEXT,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_notification_status  CHECK (status IN ('pending', 'sent', 'failed', 'skipped')),
    CONSTRAINT chk_notification_channel CHECK (channel IN ('telegram'))
);

-- ================================================================
-- TABLE: layouts
-- ================================================================
CREATE TABLE IF NOT EXISTS layouts (
    id          BIGSERIAL PRIMARY KEY,
    name        VARCHAR(150) NOT NULL,
    description TEXT,
    image_path  TEXT,
    is_active   BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ================================================================
-- TABLE: status_icons
-- ================================================================
CREATE TABLE IF NOT EXISTS status_icons (
    id          BIGSERIAL PRIMARY KEY,
    status      VARCHAR(30) NOT NULL UNIQUE,
    icon_path   TEXT NOT NULL,
    description TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ================================================================
-- TABLE: layout_devices
-- ================================================================
CREATE TABLE IF NOT EXISTS layout_devices (
    id             BIGSERIAL PRIMARY KEY,
    layout_id      BIGINT NOT NULL REFERENCES layouts(id) ON DELETE CASCADE,
    sensor_id      BIGINT NOT NULL REFERENCES sensors(id) ON DELETE CASCADE,
    status_icon_id BIGINT REFERENCES status_icons(id) ON DELETE SET NULL,
    pos_x          NUMERIC(6,2) NOT NULL DEFAULT 0,
    pos_y          NUMERIC(6,2) NOT NULL DEFAULT 0,
    label          VARCHAR(100),
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ================================================================
-- TABLE: settings
-- ================================================================
CREATE TABLE IF NOT EXISTS settings (
    id          BIGSERIAL PRIMARY KEY,
    key         VARCHAR(100) NOT NULL UNIQUE,
    value       TEXT NOT NULL,
    description TEXT,
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ================================================================
-- TABLE: api_tokens
-- ================================================================
CREATE TABLE IF NOT EXISTS api_tokens (
    id          BIGSERIAL PRIMARY KEY,
    gateway_id  BIGINT REFERENCES gateways(id) ON DELETE CASCADE,
    token       VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    is_active   BOOLEAN NOT NULL DEFAULT TRUE,
    expires_at  TIMESTAMPTZ,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ================================================================
-- TABLE: system_logs
-- ================================================================
CREATE TABLE IF NOT EXISTS system_logs (
    id         BIGSERIAL PRIMARY KEY,
    source     VARCHAR(50) NOT NULL,
    level      VARCHAR(20) NOT NULL DEFAULT 'info',
    message    TEXT NOT NULL,
    metadata   JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_log_level  CHECK (level IN ('debug', 'info', 'warn', 'error')),
    CONSTRAINT chk_log_source CHECK (source IN ('backend', 'gateway', 'ml-worker', 'system'))
);

-- Done
SELECT 'Migration 001 — All tables created successfully.' AS result;
