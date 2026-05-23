# EMS LSTM Thermal Anomaly Monitoring System

> **Skripsi Teknik Informatika — Universitas Bunda Mulia (UBM) 2026**
> Sistem pemantauan suhu server testbed berbasis IoT dengan prediksi anomali menggunakan LSTM.

---

## 🏗️ Arsitektur Sistem

```
[Sensor XY-MD02] ─── Modbus RTU ──► [Raspberry Pi Gateway]
                                            │ HTTP POST
                                            ▼
                                    [Go Backend API :8080]
                                     │           │
                                     ▼           ▼
                               [PostgreSQL]   [SSE Hub]
                                     │           │
                                     ▼           ▼
                              [Python ML]  [React Frontend :5173]
                              [LSTM Worker]
                                     │
                                     ▼
                              [Telegram Bot]
```

---

## 🚀 Quick Start (Demo)

### 1. Prasyarat

| Tool | Versi |
|---|---|
| Docker Desktop | ≥ 4.x |
| Go | ≥ 1.22 |
| Python | ≥ 3.10 |
| Node.js | ≥ 18 |

### 2. Start Database

```bash
docker-compose up -d
# Verifikasi:
docker exec ems_db pg_isready -U ems_user -d ems_db
```

### 3. Start Backend API

```bash
cd backend-go
go run cmd/server/main.go
# → http://localhost:8080/api/v1/health
```

### 4. Start Frontend Dashboard

```bash
cd frontend-dashboard
npm install
npm run dev
# → http://localhost:5173
```

### 5. Jalankan Gateway Simulator

```bash
cd gateway/src

# Skenario normal (suhu S1≈25°C, S2≈27°C)
python main.py --mode simulator --scenario normal

# Skenario waspada (S2 mendekati 30°C)
python main.py --mode simulator --scenario waspada

# Skenario anomali (S2 > 32°C)
python main.py --mode simulator --scenario anomali

# Inject 300 data historis untuk demo chart
python ../inject_demo_data.py
```

### 6. Training LSTM Model

```bash
cd ml-worker/src

# Install dependencies (sekali saja)
pip install -r ../requirements.txt

# Training penuh
python train_lstm.py
# → Model disimpan: ml-worker/models/lstm_model.keras
# → Metrics disimpan ke database
```

### 7. Inferensi Prediksi

```bash
cd ml-worker/src

# Satu kali prediksi (untuk test)
python scheduler.py --once

# Loop periodik setiap 5 menit
python scheduler.py

# Loop setiap 1 menit (untuk demo cepat)
python scheduler.py --interval 1
```

---

## 📊 Komponen Sistem

### Backend API (Go)
- **Framework**: Chi Router
- **Database**: pgxpool (PostgreSQL)
- **Auth**: Bearer Token Middleware
- **Features**: SSE real-time push, Telegram notification, CRUD semua entitas
- **Endpoint utama**: `GET /api/v1/dashboard/summary`, `POST /api/v1/readings`

### Gateway Simulator (Python)
- **Protokol**: HTTP POST ke backend (mendukung Modbus RTU untuk hardware nyata)
- **Skenario**: `normal` | `warming` | `waspada` | `anomali` | `trouble`
- **Fitur**: Retry otomatis, local buffer jika backend mati, validasi nilai sensor

### ML Worker (Python + TensorFlow)
- **Model**: LSTM 2 layer (64→32 unit), Dropout 0.2
- **Input**: Window 30 menit data suhu & kelembaban S1+S2
- **Output**: Prediksi suhu S2 t+5 menit
- **Baseline**: Persistence model + Moving Average (window=5)
- **Metrik**: RMSE, MAE, MAPE

### Frontend Dashboard (React + TypeScript)
- **Tech**: Vite + TailwindCSS + Chart.js
- **Halaman**: Dashboard, Readings, Predictions, Anomalies, Evaluation, Layout, Notifications, Settings, Logs
- **Real-time**: Server-Sent Events (SSE) dengan auto-reconnect

---

## 🔧 Environment Variables

Salin `.env.example` ke `.env` di setiap modul:

```bash
# Root
cp .env.example .env

# Backend Go
cp backend-go/.env.example backend-go/.env

# Gateway
cp gateway/.env.example gateway/.env

# ML Worker
cp ml-worker/.env.example ml-worker/.env

# Frontend
cp frontend-dashboard/.env.example frontend-dashboard/.env
```

### Konfigurasi penting di `.env`:
```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=ems_user
DB_PASS=ems_password
DB_NAME=ems_db

# Gateway Auth
GATEWAY_API_TOKEN=dev-token-change-in-production

# Telegram (opsional)
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_CHAT_ID=your_chat_id_here
```

---

## 🗄️ Database

### Migration & Seed

```bash
# Jalankan migrasi (sudah dieksekusi saat setup awal)
docker exec -i ems_db psql -U ems_user -d ems_db < database/migrations/001_create_tables.sql
docker exec -i ems_db psql -U ems_user -d ems_db < database/migrations/002_create_indexes.sql

# Jalankan seed data
docker exec -i ems_db psql -U ems_user -d ems_db < database/seed/001_seed_gateway.sql
docker exec -i ems_db psql -U ems_user -d ems_db < database/seed/002_seed_sensors.sql
docker exec -i ems_db psql -U ems_user -d ems_db < database/seed/003_seed_status_icons.sql
docker exec -i ems_db psql -U ems_user -d ems_db < database/seed/004_seed_settings.sql
docker exec -i ems_db psql -U ems_user -d ems_db < database/seed/005_seed_model_version.sql
docker exec -i ems_db psql -U ems_user -d ems_db < database/seed/006_seed_api_tokens.sql
```

### Cek data

```sql
-- Verifikasi tabel
SELECT 'gateways', COUNT(*) FROM gateways
UNION ALL SELECT 'sensors', COUNT(*) FROM sensors
UNION ALL SELECT 'sensor_readings', COUNT(*) FROM sensor_readings
UNION ALL SELECT 'predictions', COUNT(*) FROM predictions
UNION ALL SELECT 'anomaly_events', COUNT(*) FROM anomaly_events;
```

---

## 📁 Struktur Folder

```
SkripsiGama/
├── docker-compose.yml          ← PostgreSQL container
├── backend-go/                 ← Go API Server (M3)
│   ├── cmd/server/main.go
│   └── internal/{config,model,repository,handler,middleware,service}/
├── frontend-dashboard/         ← React Dashboard (M5)
│   └── src/{pages,components,lib,types}/
├── gateway/                    ← Python Gateway (M4)
│   └── src/{main,simulator,http_sender,...}.py
├── ml-worker/                  ← Python ML (M6)
│   ├── src/{train_lstm,inference,scheduler,...}.py
│   └── models/                 ← Saved LSTM model
├── database/
│   ├── migrations/             ← SQL DDL (M2)
│   └── seed/                   ← SQL seed data (M2)
└── Dokumentasi/                ← Dokumen spesifikasi skripsi
```

---

## 🎓 Informasi Skripsi

- **Judul**: Sistem Monitoring Suhu Server Testbed Berbasis IoT dengan Deteksi Anomali Menggunakan LSTM
- **Program Studi**: Teknik Informatika — Universitas Bunda Mulia (UBM)
- **Tahun**: 2026
- **Stack**: Go + Python + React + PostgreSQL + TensorFlow
