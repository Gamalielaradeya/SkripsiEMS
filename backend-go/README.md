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
| POST | /api/v1/ml/inference-events | Callback internal ML Worker |
| GET | /api/v1/layout | Layout aktif dan posisi sensor |
| PUT | /api/v1/layout/devices/{sensorCode} | Simpan posisi sensor |
| DELETE | /api/v1/layout/devices/{sensorCode} | Lepas sensor dari layout |

Endpoint gateway memakai `GATEWAY_API_TOKEN`. Callback ML memakai `ML_WORKER_API_TOKEN`.

Lihat `Dokumentasi/15_Implementation_Runbook_Final.md` untuk kontrak operasional terbaru.
