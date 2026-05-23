# ML Worker — EMS LSTM Thermal Anomaly

Python ML Worker untuk training LSTM, evaluasi, dan inference prediksi suhu S2.

## Setup

```bash
pip install -r requirements.txt
cp .env.example .env
```

## Perintah

```bash
# Training LSTM (butuh data minimal di database)
python src/train_lstm.py

# Inference (prediksi suhu S2 terbaru)
python src/inference.py
```

## Pipeline

```
Dataset Loader → Preprocess → Windowing → Baseline → LSTM Train → Evaluate → Inference → Write DB
```

## Output

- Model disimpan di `models/lstm_model.keras`
- Scaler disimpan di `models/scaler.pkl`
- Hasil prediksi disimpan ke tabel `predictions`
- Anomali disimpan ke tabel `anomaly_events`
- Metrik disimpan ke tabel `model_metrics`
- Baseline disimpan ke tabel `baseline_results`
