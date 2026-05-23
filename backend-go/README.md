# Backend Go — EMS LSTM Thermal Anomaly

Backend API menggunakan Go/Golang. Menyediakan REST API dan Server-Sent Events untuk dashboard.

## Setup

```bash
cp .env.example .env
# Edit .env sesuai konfigurasi database

go mod tidy
go run cmd/server/main.go
```

## Endpoints Utama

| Method | Path | Keterangan |
|---|---|---|
| GET | /api/v1/health | Health check |
| POST | /api/v1/readings | Terima data sensor dari gateway |
| GET | /api/v1/dashboard/summary | Ringkasan dashboard |
| GET | /api/v1/events | SSE stream |
| GET | /api/v1/readings/latest | Data sensor terbaru |
| GET | /api/v1/predictions/latest | Prediksi terbaru |
| GET | /api/v1/anomalies | Riwayat anomali |

Lihat `docs/05_API_Specification_EMS_LSTM_Thermal_Anomaly.md` untuk dokumentasi lengkap.
