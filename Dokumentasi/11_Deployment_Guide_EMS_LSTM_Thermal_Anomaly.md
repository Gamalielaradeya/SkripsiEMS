# 11 Deployment Guide — EMS LSTM Thermal Anomaly Monitoring System

> **Catatan implementasi terbaru:** gunakan `15_Implementation_Runbook_Final.md` sebagai panduan deploy lokal. Compose aktual memakai service `db`, migration layout `004_layout_constraints.sql`, seed layout `007_seed_layout.sql`, dan hardware fisik berada di `gateway-rpi/`.

**Judul Skripsi:** Prediksi Anomali Termal pada Environment Monitoring System Server Menggunakan Algoritma Long Short-Term Memory  
**Jenis Dokumen:** Deployment Guide  
**Versi:** 1.0  
**Status:** Final untuk dasar implementasi, demo, dan AI Agent  
**Target Pengguna Dokumen:** AI coding agent, developer, mahasiswa, dan penguji  
**Tanggal:** 2026-05-23  

---

## 1. Tujuan Dokumen

Dokumen ini menjelaskan cara menjalankan sistem **EMS LSTM Thermal Anomaly Monitoring System** dari awal sampai bisa digunakan untuk development, pengujian, dan demo skripsi.

Deployment guide ini mencakup:

1. Struktur folder project.
2. Kebutuhan software.
3. Setup environment.
4. Setup database PostgreSQL/TimescaleDB.
5. Setup Go backend.
6. Setup React dashboard.
7. Setup Python gateway simulator/hardware.
8. Setup Python ML Worker.
9. Setup Telegram Bot.
10. Setup Docker Compose opsional.
11. Alur menjalankan sistem lokal.
12. Alur demo menggunakan simulator.
13. Troubleshooting.

---

## 2. Ringkasan Sistem yang Akan Dijalankan

Sistem terdiri dari beberapa service:

```text
Raspberry Pi Gateway / Simulator
        ↓
Go Backend API
        ↓
PostgreSQL + TimescaleDB
        ↓
Python ML Worker
        ↓
React Dashboard
        ↓
Telegram Alert
```

Mode deployment yang disediakan:

1. **Simulator Mode**  
   Digunakan saat hardware belum tersedia. Gateway simulator mengirim data S1/S2 ke backend.

2. **Hardware Mode**  
   Digunakan saat Raspberry Pi, XY-MD02, dan USB RS485 Converter sudah tersedia.

3. **Demo Mode**  
   Digunakan untuk presentasi, dengan skenario normal, waspada, anomali, dan trouble.

4. **Docker Compose Mode**  
   Digunakan untuk menjalankan database dan beberapa service secara lebih rapi di laptop lokal.

---

## 3. Struktur Folder Project

Struktur folder final yang direkomendasikan:

```text
ems-lstm-thermal-anomaly/
├── backend-go/
│   ├── cmd/
│   │   └── server/
│   │       └── main.go
│   ├── internal/
│   │   ├── config/
│   │   ├── handler/
│   │   ├── middleware/
│   │   ├── model/
│   │   ├── repository/
│   │   ├── service/
│   │   ├── sse/
│   │   ├── telegram/
│   │   ├── validator/
│   │   └── logger/
│   ├── migrations/
│   ├── go.mod
│   ├── .env.example
│   └── README.md
│
├── frontend-dashboard/
│   ├── src/
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── components.json
│   ├── .env.example
│   └── README.md
│
├── gateway/
│   ├── src/
│   ├── logs/
│   ├── data/
│   ├── config.example.yaml
│   ├── .env.example
│   ├── requirements.txt
│   └── README.md
│
├── ml-worker/
│   ├── src/
│   ├── models/
│   ├── artifacts/
│   ├── notebooks/
│   ├── tests/
│   ├── requirements.txt
│   ├── .env.example
│   └── README.md
│
├── database/
│   ├── migrations/
│   ├── seed/
│   ├── views/
│   └── README.md
│
├── docs/
│   ├── 01_PRD_EMS_LSTM_Thermal_Anomaly.md
│   ├── 02_SRS_EMS_LSTM_Thermal_Anomaly.md
│   ├── 03_System_Architecture_EMS_LSTM_Thermal_Anomaly.md
│   ├── 04_Database_Design_EMS_LSTM_Thermal_Anomaly.md
│   ├── 05_API_Specification_EMS_LSTM_Thermal_Anomaly.md
│   ├── 06_Gateway_Sensor_Spec_EMS_LSTM_Thermal_Anomaly.md
│   ├── 07_ML_Model_Spec_EMS_LSTM_Thermal_Anomaly.md
│   ├── 08_UI_Wireframe_EMS_LSTM_Thermal_Anomaly.md
│   ├── 09_Alert_Rules_EMS_LSTM_Thermal_Anomaly.md
│   ├── 10_Test_Plan_EMS_LSTM_Thermal_Anomaly.md
│   └── 11_Deployment_Guide_EMS_LSTM_Thermal_Anomaly.md
│
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## 4. Kebutuhan Software

## 4.1 Software Wajib

| Software | Fungsi |
|---|---|
| Git | Version control |
| Go | Menjalankan backend API |
| Python | Gateway dan ML Worker |
| Node.js | Menjalankan React dashboard |
| PostgreSQL | Database utama |
| Docker Desktop | Opsional untuk menjalankan PostgreSQL/TimescaleDB dan service lain |
| Postman/Thunder Client/curl | Testing API |
| Browser | Membuka dashboard |
| Telegram | Menerima alert |

---

## 4.2 Versi Rekomendasi

| Komponen | Versi Rekomendasi |
|---|---|
| Go | 1.22+ |
| Python | 3.10 atau 3.11 |
| Node.js | 20 LTS+ |
| PostgreSQL | 15 atau 16 |
| TimescaleDB | Sesuai kompatibilitas PostgreSQL |
| TensorFlow | 2.15+ atau versi stabil yang kompatibel |
| React | Latest stable |
| Vite | Latest stable |

Catatan:

1. Untuk TensorFlow, pastikan versi Python kompatibel.
2. Jika TensorFlow bermasalah di Python 3.12, gunakan Python 3.10 atau 3.11.
3. ML Worker boleh dijalankan di virtual environment terpisah.

---

## 5. Environment Variables Global

File root `.env.example`:

```env
APP_ENV=development

# Backend
BACKEND_PORT=8080
BACKEND_BASE_URL=http://localhost:8080

# Frontend
FRONTEND_PORT=5173
FRONTEND_BASE_URL=http://localhost:5173

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=ems_user
DB_PASSWORD=ems_password
DB_NAME=ems_db
DB_SSLMODE=disable

# Gateway
GATEWAY_ID=raspi-gateway-01
GATEWAY_API_TOKEN=change-me
SAMPLING_INTERVAL_SECONDS=60

# ML
WINDOW_SIZE=30
HORIZON_MINUTES=5
NORMAL_MAX_TEMPERATURE=30
ANOMALY_MIN_TEMPERATURE=32

# Telegram
TELEGRAM_ENABLED=false
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
TELEGRAM_COOLDOWN_MINUTES=5
```

---

# 6. Setup Database

## 6.1 Opsi A — PostgreSQL Lokal

Buat database:

```bash
createdb ems_db
```

Buat user:

```sql
CREATE USER ems_user WITH PASSWORD 'ems_password';
GRANT ALL PRIVILEGES ON DATABASE ems_db TO ems_user;
```

Masuk ke database:

```bash
psql -U ems_user -d ems_db
```

---

## 6.2 Opsi B — PostgreSQL dengan Docker

Jalankan PostgreSQL:

```bash
docker run --name ems-postgres \
  -e POSTGRES_USER=ems_user \
  -e POSTGRES_PASSWORD=ems_password \
  -e POSTGRES_DB=ems_db \
  -p 5432:5432 \
  -d postgres:16
```

Cek container:

```bash
docker ps
```

Masuk ke PostgreSQL:

```bash
docker exec -it ems-postgres psql -U ems_user -d ems_db
```

---

## 6.3 Opsi C — TimescaleDB dengan Docker

Jika ingin menggunakan TimescaleDB:

```bash
docker run --name ems-timescaledb \
  -e POSTGRES_USER=ems_user \
  -e POSTGRES_PASSWORD=ems_password \
  -e POSTGRES_DB=ems_db \
  -p 5432:5432 \
  -d timescale/timescaledb:latest-pg16
```

Aktifkan ekstensi:

```sql
CREATE EXTENSION IF NOT EXISTS timescaledb;
```

Buat hypertable setelah tabel `sensor_readings` dibuat:

```sql
SELECT create_hypertable('sensor_readings', 'recorded_at', if_not_exists => TRUE);
```

Catatan: jika TimescaleDB sulit dijalankan, gunakan PostgreSQL biasa dengan index timestamp. Sistem tetap valid untuk skripsi.

---

## 6.4 Run Migration

Jika menggunakan migration tool Go seperti `golang-migrate`:

```bash
migrate -path backend-go/migrations -database "postgres://ems_user:ems_password@localhost:5432/ems_db?sslmode=disable" up
```

Jika menggunakan file SQL manual:

```bash
psql -U ems_user -d ems_db -f database/migrations/001_create_gateways_table.up.sql
psql -U ems_user -d ems_db -f database/migrations/002_create_sensors_table.up.sql
psql -U ems_user -d ems_db -f database/migrations/003_create_sensor_readings_table.up.sql
```

Lanjutkan sampai semua migration selesai.

---

## 6.5 Run Seed

```bash
psql -U ems_user -d ems_db -f database/seed/001_seed_gateways.sql
psql -U ems_user -d ems_db -f database/seed/002_seed_sensors.sql
psql -U ems_user -d ems_db -f database/seed/003_seed_status_icons.sql
psql -U ems_user -d ems_db -f database/seed/004_seed_settings.sql
psql -U ems_user -d ems_db -f database/seed/005_seed_model_version.sql
```

Cek data sensor:

```sql
SELECT * FROM sensors;
```

Expected:

```text
S1 Ambient Sensor
S2 Hotspot Sensor
```

---

# 7. Setup Backend Go

## 7.1 Masuk Folder Backend

```bash
cd backend-go
```

## 7.2 Buat `.env`

Copy:

```bash
cp .env.example .env
```

Isi `.env`:

```env
APP_ENV=development
APP_PORT=8080

DB_HOST=localhost
DB_PORT=5432
DB_USER=ems_user
DB_PASSWORD=ems_password
DB_NAME=ems_db
DB_SSLMODE=disable

GATEWAY_API_TOKEN=change-me

TELEGRAM_ENABLED=false
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
TELEGRAM_COOLDOWN_MINUTES=5

CORS_ALLOWED_ORIGINS=http://localhost:5173
```

## 7.3 Install Dependency

```bash
go mod tidy
```

## 7.4 Run Backend

```bash
go run ./cmd/server
```

Expected output:

```text
EMS Backend running on :8080
Database connected
```

## 7.5 Test Health Check

```bash
curl http://localhost:8080/api/v1/health
```

Expected response:

```json
{
  "status": "success",
  "message": "Service is healthy"
}
```

---

# 8. Setup Gateway Simulator

## 8.1 Masuk Folder Gateway

```bash
cd gateway
```

## 8.2 Buat Virtual Environment

Linux/macOS:

```bash
python3 -m venv .venv
source .venv/bin/activate
```

Windows PowerShell:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

## 8.3 Install Dependency

```bash
pip install -r requirements.txt
```

## 8.4 Buat Config

```bash
cp config.example.yaml config.yaml
```

Pastikan mode simulator:

```yaml
gateway:
  id: "raspi-gateway-01"
  mode: "simulator"

backend:
  url: "http://localhost:8080/api/v1/readings"
  token: "change-me"
```

## 8.5 Jalankan Simulator Normal

```bash
python src/main.py --mode simulator --scenario normal
```

Expected:

```text
Payload sent successfully stored_count=2
```

## 8.6 Jalankan Simulator Waspada

```bash
python src/main.py --mode simulator --scenario waspada
```

## 8.7 Jalankan Simulator Anomali

```bash
python src/main.py --mode simulator --scenario anomali
```

## 8.8 Jalankan Simulator Trouble

```bash
python src/main.py --mode simulator --scenario trouble
```

---

# 9. Setup Gateway Hardware Raspberry Pi

## 9.1 Persiapan Raspberry Pi

Update package:

```bash
sudo apt update
sudo apt upgrade -y
```

Install Python dan dependency dasar:

```bash
sudo apt install python3 python3-venv python3-pip git -y
```

## 9.2 Cek USB RS485 Converter

Colok USB RS485 Converter lalu jalankan:

```bash
ls /dev/ttyUSB*
```

Expected:

```text
/dev/ttyUSB0
```

Jika permission denied:

```bash
sudo usermod -a -G dialout $USER
```

Logout dan login ulang.

## 9.3 Setup Gateway di Raspberry Pi

```bash
cd gateway
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp config.example.yaml config.yaml
```

Edit `config.yaml`:

```yaml
gateway:
  id: "raspi-gateway-01"
  mode: "hardware"

backend:
  url: "http://<IP-LAPTOP-BACKEND>:8080/api/v1/readings"
  token: "change-me"

modbus:
  port: "/dev/ttyUSB0"
  baudrate: 9600

sensors:
  - code: "S1"
    role: "ambient"
    slave_id: 1
  - code: "S2"
    role: "hotspot"
    slave_id: 2
```

## 9.4 Test Sensor

```bash
python src/main.py --test-sensor
```

## 9.5 Run Hardware Mode

```bash
python src/main.py --mode hardware
```

Expected:

```text
Read S1 temperature=...
Read S2 temperature=...
Payload sent successfully
```

---

# 10. Setup Frontend Dashboard

## 10.1 Masuk Folder Frontend

```bash
cd frontend-dashboard
```

## 10.2 Install Dependency

```bash
npm install
```

Jika project belum dibuat, AI agent dapat membuatnya dengan:

```bash
npm create vite@latest frontend-dashboard -- --template react-ts
cd frontend-dashboard
npm install
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
npx shadcn@latest init
npm install chart.js react-chartjs-2 lucide-react
```

## 10.3 Buat `.env`

```bash
cp .env.example .env
```

Isi:

```env
VITE_API_BASE_URL=http://localhost:8080/api/v1
VITE_SSE_URL=http://localhost:8080/api/v1/events
VITE_APP_NAME=EMS Thermal Monitoring
```

## 10.4 Jalankan Dashboard

```bash
npm run dev
```

Buka browser:

```text
http://localhost:5173
```

Expected:

1. Sidebar tampil.
2. Topbar tampil.
3. Dashboard card tampil.
4. Data S1/S2 tampil setelah gateway simulator berjalan.
5. Grafik tampil setelah data historis tersedia.

---

# 11. Setup ML Worker

## 11.1 Masuk Folder ML Worker

```bash
cd ml-worker
```

## 11.2 Buat Virtual Environment

Linux/macOS:

```bash
python3 -m venv .venv
source .venv/bin/activate
```

Windows PowerShell:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

## 11.3 Install Dependency

```bash
pip install -r requirements.txt
```

Catatan: instalasi TensorFlow dapat memakan waktu. Jika gagal, cek versi Python. Gunakan Python 3.10 atau 3.11 jika Python 3.12 bermasalah.

## 11.4 Buat `.env`

```bash
cp .env.example .env
```

Isi:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=ems_user
DB_PASSWORD=ems_password
DB_NAME=ems_db
DB_SSLMODE=disable

MODEL_NAME=ems_lstm_s2_temperature
MODEL_VERSION=v1.0.0
MODEL_DIR=./models

WINDOW_SIZE=30
HORIZON_MINUTES=5
SAMPLING_INTERVAL_SECONDS=60

NORMAL_MAX_TEMPERATURE=30
ANOMALY_MIN_TEMPERATURE=32

TRAIN_RATIO=0.70
VAL_RATIO=0.15
TEST_RATIO=0.15

EPOCHS=50
BATCH_SIZE=32
LEARNING_RATE=0.001
EARLY_STOPPING_PATIENCE=8
```

## 11.5 Cek Dataset

```bash
python src/load_dataset.py --days 1
```

Jika data belum cukup:

```text
Not enough data.
Run gateway simulator first.
```

## 11.6 Generate Data Simulator

Jalankan gateway simulator selama beberapa menit, atau buat script generator untuk memasukkan data dummy beberapa ratus baris.

Contoh:

```bash
python src/main.py --mode simulator --scenario mixed
```

## 11.7 Jalankan Baseline

```bash
python src/baseline.py --days 7
```

Expected:

```text
Persistence RMSE: ...
Moving Average RMSE: ...
```

## 11.8 Training LSTM

```bash
python src/train_lstm.py --days 7
```

Expected output:

```text
Training started
Model saved to models/lstm_model_v1.0.0.keras
Metrics saved to database
```

## 11.9 Inference

```bash
python src/inference.py --model-version v1.0.0
```

Expected output:

```text
Predicted S2 temperature: 31.4°C
Status: waspada
Prediction saved to database
```

## 11.10 Inference Loop

```bash
python src/inference.py --model-version v1.0.0 --loop --interval 300
```

Artinya inference berjalan setiap 300 detik atau 5 menit.

---

# 12. Setup Telegram Bot

## 12.1 Buat Bot Telegram

1. Buka Telegram.
2. Cari `@BotFather`.
3. Kirim `/newbot`.
4. Ikuti instruksi.
5. Simpan bot token.

## 12.2 Dapatkan Chat ID

Opsi sederhana:

1. Kirim pesan ke bot yang sudah dibuat.
2. Buka URL berikut di browser:

```text
https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates
```

3. Cari `chat.id`.

## 12.3 Aktifkan di Backend `.env`

```env
TELEGRAM_ENABLED=true
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_CHAT_ID=your_chat_id
TELEGRAM_COOLDOWN_MINUTES=5
```

Restart backend.

## 12.4 Test Telegram

```bash
curl -X POST http://localhost:8080/api/v1/notifications/test \
  -H "Content-Type: application/json" \
  -d '{"message":"Test notification from EMS Thermal Monitoring System"}'
```

Expected:

```text
Pesan masuk ke Telegram
```

Jika gagal, cek:

1. Token.
2. Chat ID.
3. Internet.
4. Backend log.
5. `notification_logs`.

---

# 13. Docker Compose Opsional

## 13.1 Tujuan Docker Compose

Docker Compose digunakan untuk menjalankan database dan service pendukung dengan cepat. Untuk ML Worker, boleh tetap dijalankan manual karena TensorFlow kadang lebih mudah dijalankan di virtual environment lokal.

## 13.2 Contoh `docker-compose.yml`

```yaml
version: "3.9"

services:
  postgres:
    image: timescale/timescaledb:latest-pg16
    container_name: ems-postgres
    environment:
      POSTGRES_USER: ems_user
      POSTGRES_PASSWORD: ems_password
      POSTGRES_DB: ems_db
    ports:
      - "5432:5432"
    volumes:
      - ems_postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  pgadmin:
    image: dpage/pgadmin4:latest
    container_name: ems-pgadmin
    environment:
      PGADMIN_DEFAULT_EMAIL: admin@ems.local
      PGADMIN_DEFAULT_PASSWORD: admin
    ports:
      - "5050:80"
    depends_on:
      - postgres
    restart: unless-stopped

volumes:
  ems_postgres_data:
```

## 13.3 Jalankan Docker Compose

```bash
docker compose up -d
```

Cek:

```bash
docker compose ps
```

Stop:

```bash
docker compose down
```

Reset database:

```bash
docker compose down -v
docker compose up -d
```

---

# 14. Urutan Menjalankan Sistem Lokal

Gunakan urutan berikut saat development:

```text
1. Jalankan PostgreSQL/TimescaleDB
2. Jalankan migration dan seed
3. Jalankan Go backend
4. Jalankan React dashboard
5. Jalankan gateway simulator
6. Cek data tampil di dashboard
7. Jalankan ML Worker training jika data cukup
8. Jalankan ML Worker inference
9. Cek prediksi dan status tampil
10. Aktifkan Telegram
11. Test skenario waspada/anomali
```

## 14.1 Command Ringkas

Terminal 1 — Database:

```bash
docker compose up -d postgres
```

Terminal 2 — Backend:

```bash
cd backend-go
go run ./cmd/server
```

Terminal 3 — Frontend:

```bash
cd frontend-dashboard
npm run dev
```

Terminal 4 — Gateway Simulator:

```bash
cd gateway
source .venv/bin/activate
python src/main.py --mode simulator --scenario normal
```

Terminal 5 — ML Worker:

```bash
cd ml-worker
source .venv/bin/activate
python src/inference.py --model-version v1.0.0
```

---

# 15. Demo Mode

## 15.1 Tujuan Demo Mode

Demo mode digunakan saat presentasi untuk menunjukkan:

1. Data sensor masuk.
2. Dashboard berubah.
3. Prediksi suhu S2 tampil.
4. Status normal/waspada/anomali tampil.
5. Telegram alert terkirim.
6. Layout sensor menunjukkan posisi S1 dan S2.
7. Evaluasi model tampil.

## 15.2 Skenario Demo Normal

```bash
cd gateway
python src/main.py --mode simulator --scenario normal
```

Expected:

1. S1 dan S2 normal.
2. Dashboard badge normal.
3. Tidak ada Telegram alert.

## 15.3 Skenario Demo Waspada

```bash
python src/main.py --mode simulator --scenario waspada
```

Atau jalankan inference yang menghasilkan prediksi 30–32°C.

Expected:

1. Status waspada.
2. Marker S2 kuning/oranye.
3. Anomaly event tersimpan.
4. Telegram terkirim jika cooldown mengizinkan.

## 15.4 Skenario Demo Anomali

```bash
python src/main.py --mode simulator --scenario anomali
```

Expected:

1. Status anomali.
2. Marker S2 merah.
3. Telegram alert terkirim.
4. Riwayat anomali bertambah.

## 15.5 Skenario Demo Trouble

```bash
python src/main.py --mode simulator --scenario trouble
```

Expected:

1. Sensor trouble tampil.
2. System log bertambah.
3. Dashboard menampilkan trouble.
4. Telegram opsional untuk S2 trouble.

---

# 16. Health Check dan Validasi Setelah Deploy

## 16.1 Backend

```bash
curl http://localhost:8080/api/v1/health
```

Expected:

```text
service healthy
database connected
```

## 16.2 Database

```sql
SELECT COUNT(*) FROM sensors;
SELECT COUNT(*) FROM sensor_readings;
SELECT COUNT(*) FROM predictions;
SELECT COUNT(*) FROM anomaly_events;
```

## 16.3 Frontend

Buka:

```text
http://localhost:5173
```

Pastikan:

1. Dashboard terbuka.
2. Tidak ada error API.
3. SSE connected atau fallback polling.

## 16.4 Gateway

Cek log:

```bash
tail -f gateway/logs/gateway.log
```

## 16.5 ML Worker

Cek model:

```bash
ls ml-worker/models/
```

Expected:

```text
lstm_model_v1.0.0.keras
feature_scaler_v1.0.0.pkl
target_scaler_v1.0.0.pkl
metadata_v1.0.0.json
```

---

# 17. Troubleshooting

## 17.1 Backend Tidak Bisa Connect Database

Gejala:

```text
database connection refused
```

Solusi:

1. Pastikan PostgreSQL running.
2. Cek host, port, user, password.
3. Cek Docker port mapping.
4. Jalankan:

```bash
docker ps
```

---

## 17.2 Dashboard Tidak Menampilkan Data

Kemungkinan:

1. Backend belum jalan.
2. API base URL salah.
3. CORS error.
4. Data sensor belum masuk.
5. Database kosong.

Solusi:

```bash
curl http://localhost:8080/api/v1/readings/latest
```

Cek `.env` frontend:

```env
VITE_API_BASE_URL=http://localhost:8080/api/v1
```

---

## 17.3 Gateway 401 Unauthorized

Kemungkinan:

1. Token salah.
2. Header Authorization tidak dikirim.
3. Backend `.env` berbeda dari gateway config.

Solusi:

1. Samakan `GATEWAY_API_TOKEN` di backend.
2. Samakan `backend.token` di gateway config.
3. Cek header:

```text
Authorization: Bearer change-me
```

---

## 17.4 Sensor Tidak Terbaca

Kemungkinan:

1. USB RS485 belum terdeteksi.
2. Slave ID salah.
3. Kabel A/B terbalik.
4. Baudrate salah.
5. Register salah.
6. Permission serial port.

Solusi:

```bash
ls /dev/ttyUSB*
sudo usermod -a -G dialout $USER
```

Cek konfigurasi:

```yaml
modbus:
  port: "/dev/ttyUSB0"
  baudrate: 9600
```

---

## 17.5 ML Worker Data Tidak Cukup

Gejala:

```text
Not enough data for window size 30 and horizon 5
```

Solusi:

1. Jalankan gateway simulator lebih lama.
2. Gunakan replay dataset.
3. Generate data dummy untuk development.
4. Pastikan S1 dan S2 sama-sama masuk.

---

## 17.6 TensorFlow Gagal Install

Solusi:

1. Gunakan Python 3.10 atau 3.11.
2. Upgrade pip:

```bash
python -m pip install --upgrade pip
```

3. Install ulang:

```bash
pip install tensorflow
```

4. Jika tetap gagal, dokumentasikan versi yang berhasil digunakan.

---

## 17.7 Telegram Tidak Terkirim

Cek:

1. `TELEGRAM_ENABLED=true`.
2. Bot token benar.
3. Chat ID benar.
4. Bot sudah pernah menerima pesan dari user.
5. Internet aktif.
6. Cek `notification_logs`.

Test:

```bash
curl -X POST http://localhost:8080/api/v1/notifications/test \
  -H "Content-Type: application/json" \
  -d '{"message":"Test EMS Telegram"}'
```

---

## 17.8 SSE Tidak Connect

Kemungkinan:

1. Backend SSE endpoint belum jalan.
2. CORS.
3. Browser disconnect.
4. Proxy buffering jika nanti dihosting.

Solusi development:

1. Cek endpoint `/api/v1/events`.
2. Gunakan fallback polling.
3. Pastikan frontend `.env` benar.

---

# 18. Reset Data Demo

Jika ingin mengulang demo dari awal:

## 18.1 Reset Data Sensor dan Hasil Prediksi

```sql
TRUNCATE TABLE
  notification_logs,
  anomaly_events,
  predictions,
  prediction_runs,
  model_metrics,
  baseline_results,
  sensor_readings
RESTART IDENTITY CASCADE;
```

Jangan hapus:

```text
gateways
sensors
settings
status_icons
model_versions
layouts
layout_devices
```

## 18.2 Reset Docker Database Total

```bash
docker compose down -v
docker compose up -d
```

Lalu jalankan migration dan seed ulang.

---

# 19. Deployment Checklist

## 19.1 Database

```text
[ ] PostgreSQL berjalan
[ ] TimescaleDB aktif jika digunakan
[ ] Migration berhasil
[ ] Seed berhasil
[ ] S1 dan S2 tersedia
[ ] Settings tersedia
```

## 19.2 Backend

```text
[ ] .env backend sudah benar
[ ] Backend berjalan di port 8080
[ ] Health check sukses
[ ] CORS frontend benar
[ ] Gateway token benar
```

## 19.3 Gateway

```text
[ ] Mode simulator berjalan
[ ] Mode hardware siap jika sensor tersedia
[ ] Payload berhasil dikirim
[ ] Retry dan log tersedia
[ ] Failed payload buffer tersedia
```

## 19.4 Frontend

```text
[ ] npm install berhasil
[ ] .env frontend benar
[ ] Dashboard berjalan di port 5173
[ ] Card sensor tampil
[ ] Chart tampil
[ ] SSE atau polling berjalan
```

## 19.5 ML Worker

```text
[ ] Virtual environment aktif
[ ] Dependency terinstall
[ ] Dataset bisa dibaca
[ ] Baseline bisa dijalankan
[ ] Training LSTM bisa dijalankan
[ ] Inference bisa dijalankan
[ ] Metrics tersimpan
[ ] Prediction tersimpan
```

## 19.6 Telegram

```text
[ ] Bot token tersedia
[ ] Chat ID tersedia
[ ] Telegram enabled jika ingin demo alert
[ ] Test notification berhasil
[ ] Failure handling aman
```

## 19.7 Demo

```text
[ ] Skenario normal berhasil
[ ] Skenario waspada berhasil
[ ] Skenario anomali berhasil
[ ] Skenario trouble berhasil
[ ] Dashboard menampilkan status
[ ] Telegram terkirim
[ ] Evaluasi model tampil
```

---

# 20. Instruksi Implementasi untuk AI Agent

AI agent harus mengikuti instruksi berikut:

1. Buat README root yang merangkum cara menjalankan semua modul.
2. Buat `.env.example` untuk root, backend, frontend, gateway, dan ML Worker.
3. Buat command setup yang jelas.
4. Buat Docker Compose minimal untuk PostgreSQL/TimescaleDB.
5. Jangan memaksa ML Worker Docker jika TensorFlow lebih mudah di virtual environment.
6. Pastikan simulator dapat digunakan untuk development tanpa hardware.
7. Pastikan backend dapat menerima payload simulator.
8. Pastikan dashboard dapat berjalan walaupun model belum siap.
9. Pastikan ML Worker menangani data kurang dengan aman.
10. Pastikan Telegram error tidak membuat sistem crash.
11. Buat troubleshooting di README.
12. Jangan menambahkan PUE, optimasi energi, atau kontrol pendingin otomatis.
13. Pastikan seluruh sistem dapat didemokan lokal.

---

## 21. Ringkasan Final Deployment

```text
Database       : PostgreSQL / TimescaleDB optional
Backend        : Go API, port 8080
Frontend       : React Vite Dashboard, port 5173
Gateway        : Python, mode simulator/hardware/replay
ML Worker      : Python TensorFlow/Keras
Notification   : Telegram Bot API
Realtime       : SSE
Development    : Local laptop
Hardware mode  : Raspberry Pi + XY-MD02 + USB RS485 Converter
Demo fallback  : Simulator mode
Batasan        : Tidak PUE, tidak kontrol pendingin, tidak optimasi energi
```

Deployment dianggap berhasil jika alur berikut berjalan:

```text
Gateway Simulator / Sensor Hardware
        ↓
Go Backend API
        ↓
PostgreSQL
        ↓
Dashboard
        ↓
ML Worker Prediction
        ↓
Status Thermal
        ↓
Telegram Alert
```
