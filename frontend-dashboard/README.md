# Frontend Dashboard — EMS LSTM Thermal Anomaly

Dashboard monitoring menggunakan React + Vite + TypeScript + Tailwind CSS + shadcn/ui + Chart.js.

## Setup

```bash
cp .env.example .env
npm install
npm run dev
```

Buka: http://localhost:5173

## Halaman

- **Dashboard** — Ringkasan sensor, prediksi, status termal
- **Sensor Readings** — Data historis S1 dan S2
- **Predictions** — Riwayat prediksi LSTM
- **Anomalies** — Riwayat anomali termal
- **Model Evaluation** — RMSE, MAE, MAPE vs baseline
- **Sensor Layout** — Posisi S1 dan S2
- **Notifications** — Riwayat notifikasi Telegram
- **Settings** — Konfigurasi threshold
- **System Logs** — Log sistem
