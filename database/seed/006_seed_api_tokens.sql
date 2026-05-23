-- ================================================================
-- Seed 006 — API Tokens
-- ================================================================
INSERT INTO api_tokens (gateway_id, token, description, is_active)
SELECT
    g.id,
    'dev-token-change-in-production',
    'Token development untuk simulator dan Raspberry Pi gateway',
    TRUE
FROM gateways g WHERE g.gateway_code = 'raspi-gateway-01'
ON CONFLICT (token) DO NOTHING;

SELECT 'Seed 006 — API tokens seeded.' AS result;
