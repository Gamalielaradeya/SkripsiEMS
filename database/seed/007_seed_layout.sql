-- ================================================================
-- Seed 007 - Default EMS sensor layout
-- ================================================================
INSERT INTO layouts (name, description, is_active)
SELECT 'Server Testbed', 'Layout sensor EMS untuk S1 ambient dan S2 hotspot.', TRUE
WHERE NOT EXISTS (
    SELECT 1 FROM layouts WHERE is_active = TRUE
);

INSERT INTO layout_devices (layout_id, sensor_id, pos_x, pos_y, label)
SELECT
    l.id,
    s.id,
    CASE s.sensor_code WHEN 'S1' THEN 20.00 ELSE 75.00 END,
    CASE s.sensor_code WHEN 'S1' THEN 35.00 ELSE 60.00 END,
    CASE s.sensor_code WHEN 'S1' THEN 'S1 Ambient' ELSE 'S2 Hotspot' END
FROM layouts l
JOIN sensors s ON s.sensor_code IN ('S1', 'S2')
WHERE l.is_active = TRUE
ORDER BY l.updated_at DESC, s.sensor_code
ON CONFLICT (layout_id, sensor_id) DO NOTHING;

SELECT 'Seed 007 - Default layout seeded.' AS result;
