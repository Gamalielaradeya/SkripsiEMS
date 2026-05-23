-- ================================================================
-- Seed 004 — Settings (Threshold & Config)
-- ================================================================
INSERT INTO settings (key, value, description) VALUES
    ('threshold_normal_max',     '30.00', 'Batas atas suhu prediksi S2 untuk status normal (°C)'),
    ('threshold_anomaly_min',    '32.00', 'Batas bawah suhu prediksi S2 untuk status anomali (°C)'),
    ('telegram_enabled',         'false', 'Aktifkan notifikasi Telegram (true/false)'),
    ('telegram_bot_token',       '',      'Token Bot Telegram dari BotFather'),
    ('telegram_chat_id',         '',      'Chat ID target untuk notifikasi Telegram'),
    ('telegram_cooldown_minutes','5',     'Cooldown antar notifikasi Telegram dalam menit'),
    ('sampling_interval_seconds','60',    'Interval sampling sensor dalam detik'),
    ('window_size',              '30',    'Jumlah data terakhir sebagai input LSTM'),
    ('horizon_minutes',          '5',     'Horizon prediksi LSTM dalam menit'),
    ('gateway_timeout_seconds',  '120',   'Timeout gateway sebelum dianggap offline (detik)')
ON CONFLICT (key) DO NOTHING;

SELECT 'Seed 004 — Settings seeded.' AS result;
