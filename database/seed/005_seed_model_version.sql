-- ================================================================
-- Seed 005 — Initial Model Version
-- ================================================================
INSERT INTO model_versions (
    model_name,
    model_type,
    version,
    algorithm,
    feature_columns,
    target_column,
    window_size,
    horizon_minutes,
    sampling_interval_seconds,
    parameters
)
VALUES (
    'EMS Thermal LSTM',
    'LSTM',
    'v1.0.0',
    'Long Short-Term Memory',
    '["temperature_s1", "humidity_s1", "temperature_s2", "humidity_s2"]',
    'temperature_s2',
    30,
    5,
    60,
    '{
        "architecture": [
            {"type": "LSTM", "units": 64, "return_sequences": true},
            {"type": "Dropout", "rate": 0.2},
            {"type": "LSTM", "units": 32, "return_sequences": false},
            {"type": "Dropout", "rate": 0.2},
            {"type": "Dense", "units": 16, "activation": "relu"},
            {"type": "Dense", "units": 1}
        ],
        "optimizer": "adam",
        "loss": "mse",
        "early_stopping_patience": 10,
        "max_epochs": 100,
        "batch_size": 32
    }'
) ON CONFLICT (model_name, version) DO NOTHING;

SELECT 'Seed 005 — Initial model version seeded.' AS result;
