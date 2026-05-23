-- ================================================================
-- Seed 001 — Gateway
-- ================================================================
INSERT INTO gateways (gateway_code, name, location, description, status)
VALUES (
    'raspi-gateway-01',
    'Raspberry Pi Gateway',
    'Server Testbed Room',
    'Gateway utama untuk membaca sensor XY-MD02 S1 dan S2',
    'active'
) ON CONFLICT (gateway_code) DO NOTHING;

SELECT 'Seed 001 — Gateway seeded.' AS result;
