-- ================================================================
-- Seed 002 — Sensors S1 dan S2
-- ================================================================
INSERT INTO sensors (gateway_id, sensor_code, sensor_role, name, type, location, modbus_slave_id, status)
SELECT
    g.id,
    'S1',
    'ambient',
    'S1 Ambient Sensor',
    'XY-MD02',
    'Area ambient/referensi ruangan',
    1,
    'normal'
FROM gateways g WHERE g.gateway_code = 'raspi-gateway-01'
ON CONFLICT (gateway_id, sensor_code) DO NOTHING;

INSERT INTO sensors (gateway_id, sensor_code, sensor_role, name, type, location, modbus_slave_id, status)
SELECT
    g.id,
    'S2',
    'hotspot',
    'S2 Hotspot Sensor',
    'XY-MD02',
    'Area hotspot/exhaust server testbed',
    2,
    'normal'
FROM gateways g WHERE g.gateway_code = 'raspi-gateway-01'
ON CONFLICT (gateway_id, sensor_code) DO NOTHING;

SELECT 'Seed 002 — Sensors S1 and S2 seeded.' AS result;
