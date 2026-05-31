-- ================================================================
-- Migration 004 - Layout device persistence constraints
-- ================================================================
CREATE UNIQUE INDEX IF NOT EXISTS uq_layout_devices_layout_sensor
    ON layout_devices (layout_id, sensor_id);

SELECT 'Migration 004 - Layout constraints created.' AS result;
