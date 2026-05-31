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

## Catatan Implementasi

- Layout sensor memakai database EMS sebagai sumber utama posisi.
- Browser menyimpan localStorage hanya sebagai draft fallback saat API layout gagal.
- SSE menangani `reading.latest`, `sensor.trouble`, `prediction.latest`, `anomaly.created`, dan `notification.sent`.
- Dashboard menyediakan sidebar desktop dan bottom navigation mobile.
