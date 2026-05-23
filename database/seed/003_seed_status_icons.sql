-- ================================================================
-- Seed 003 — Status Icons
-- ================================================================
INSERT INTO status_icons (status, icon_path, description) VALUES
    ('normal',  'assets/icons/status_normal.svg',  'Ikon status normal — hijau'),
    ('waspada', 'assets/icons/status_waspada.svg', 'Ikon status waspada — kuning'),
    ('anomali', 'assets/icons/status_anomali.svg', 'Ikon status anomali — merah'),
    ('trouble', 'assets/icons/status_trouble.svg', 'Ikon status trouble — abu-abu')
ON CONFLICT (status) DO NOTHING;

SELECT 'Seed 003 — Status icons seeded.' AS result;
