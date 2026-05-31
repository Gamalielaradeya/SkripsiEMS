# AGENTS.md

## Project Overview

Repository ini adalah proyek skripsi Informatika berjudul kerja:

**Prediksi Anomali Termal pada Environment Monitoring System Server Menggunakan Algoritma Long Short-Term Memory**

Fokus sistem adalah **Environment Monitoring System (EMS) server testbed** untuk:
- membaca suhu dan kelembaban dari sensor XY-MD02;
- mengirim data sensor dari Raspberry Pi Gateway ke EMS Server;
- menyimpan data sensor sebagai time-series;
- menampilkan dashboard monitoring;
- melakukan prediksi suhu S2 menggunakan LSTM;
- menentukan status termal `normal`, `waspada`, `anomali`, atau `trouble`;
- mengirim peringatan Telegram untuk kondisi `waspada` atau `anomali`.

Proyek ini adalah **jalur perekayasaan sistem**, bukan riset PUE, bukan kontrol pendingin otomatis, dan bukan optimasi energi. Jangan memperluas scope ke PUE aktual, kontrol AC/kipas otomatis, MQTT, Kubernetes, microservice kompleks, atau fitur enterprise lain kecuali diminta eksplisit.

---

## High-Level Architecture

Arsitektur final yang harus dijaga:

```text
Sensor XY-MD02 S1/S2
    ↓ Modbus RTU / RS485
Raspberry Pi Gateway atau Gateway Simulator
    ↓ HTTP POST + Bearer Token
Go Backend API
    ↓
PostgreSQL / TimescaleDB
    ↓
Python ML Worker LSTM
    ↓
React Frontend Dashboard + Telegram Alert
```

Prinsip penting:

1. **Gateway, backend, dan frontend adalah komponen terpisah.**
2. **Gateway tidak digabung ke backend utama.**
3. **Backend tidak membaca sensor secara langsung.**
4. **Frontend EMS utama tidak sama dengan Web UI gateway.**
5. **ML Worker berjalan terpisah dari backend Go.**
6. **Database menjadi sumber data utama untuk readings, predictions, metrics, anomaly events, settings, dan notification logs.**

---

## Component Responsibilities

### Root

Root repo berisi konfigurasi umum, Docker Compose, dokumentasi, dan folder setiap modul.

Komponen utama:
- `docker-compose.yml` untuk database lokal.
- `.env.example` sebagai contoh environment root.
- `README.md` sebagai quick start manusia.
- `AGENTS.md` sebagai instruksi untuk coding agent.

### `backend-go/`

Backend EMS utama berbasis Go/Golang.

Tanggung jawab:
- menyediakan REST API `/api/v1/...`;
- menerima data sensor dari gateway melalui endpoint readings;
- validasi payload, gateway, sensor, timestamp, suhu, dan kelembaban;
- menyimpan data ke PostgreSQL/TimescaleDB;
- menyediakan data dashboard;
- menyediakan SSE real-time stream;
- mengelola notifikasi Telegram;
- menjaga keamanan dasar dengan Bearer Token untuk endpoint gateway.

Jangan:
- membaca Modbus langsung dari backend;
- menjalankan training LSTM di backend;
- mencampur logic UI React ke backend;
- menyimpan konfigurasi rahasia di source code.

Endpoint penting yang harus dipertahankan:
- `GET /api/v1/health`
- `POST /api/v1/readings`
- `GET /api/v1/readings`
- `GET /api/v1/readings/latest`
- `GET /api/v1/dashboard/summary`
- `GET /api/v1/predictions`
- `GET /api/v1/predictions/latest`
- `GET /api/v1/anomalies`
- `GET /api/v1/model-metrics`
- `GET /api/v1/notifications`
- `GET /api/v1/events`

### `frontend-dashboard/`

Frontend EMS utama berbasis React, Vite, TypeScript, Tailwind CSS, shadcn/ui, dan Chart.js.

Tanggung jawab:
- dashboard utama EMS;
- menampilkan suhu dan kelembaban S1/S2;
- menampilkan status termal;
- menampilkan grafik readings historis;
- menampilkan prediksi suhu S2;
- menampilkan riwayat anomali;
- menampilkan evaluasi model RMSE, MAE, MAPE, dan baseline;
- menampilkan layout sensor;
- menampilkan riwayat notifikasi dan logs;
- menerima update real-time dari backend melalui SSE.

Jangan:
- membaca sensor langsung dari browser;
- melakukan training LSTM di browser;
- menjadikan Web UI gateway sebagai dashboard EMS utama;
- hardcode URL backend jika sudah tersedia `.env`.

### `gateway/`

Gateway simulator berbasis Python CLI.

Tanggung jawab:
- menghasilkan data simulasi S1/S2;
- mengirim payload readings ke backend menggunakan HTTP POST;
- mendukung skenario demo: `normal`, `warming`, `waspada`, `anomali`, dan `trouble`;
- membantu pengujian ketika Raspberry Pi atau sensor fisik belum tersedia;
- menjaga format payload tetap sama dengan gateway fisik.

Jangan:
- menyimpan logic dashboard utama;
- mengubah tabel database langsung;
- bypass backend saat mengirim readings.

### `gateway-rpi/`

Program gateway fisik mandiri untuk Raspberry Pi.

Tanggung jawab:
- membaca sensor XY-MD02 melalui Modbus RTU/RS485;
- mendeteksi port serial USB RS485;
- mengatur konfigurasi gateway melalui `config.yaml`;
- menyediakan Web UI lokal untuk konfigurasi port serial, Modbus, URL EMS Server, token, identitas gateway, dan mode gather data;
- mengirim data sensor ke backend EMS melalui HTTP POST;
- menyimpan data lokal ke SQLite hanya untuk mode `Gather Data` apabila diperlukan.

Catatan penting:
- Web UI pada `gateway-rpi/` adalah **frontend lokal gateway**, bukan frontend EMS utama.
- Web UI gateway hanya untuk konfigurasi dan pengumpulan data sensor di Raspberry Pi.
- Dashboard EMS tetap berada di `frontend-dashboard/`.

Jangan:
- memindahkan dashboard EMS utama ke gateway;
- menjadikan Raspberry Pi sebagai tempat training LSTM;
- menyimpan token produksi di repo;
- membuat gateway tergantung pada frontend EMS agar bisa membaca sensor.

### `ml-worker/`

Worker machine learning berbasis Python dan TensorFlow/Keras.

Tanggung jawab:
- mengambil data historis dari database;
- melakukan preprocessing time-series;
- membuat window data;
- melatih model LSTM;
- mengevaluasi model dengan RMSE, MAE, MAPE;
- membandingkan LSTM dengan baseline persistence model dan moving average;
- melakukan inference prediksi suhu S2;
- menyimpan model, scaler, predictions, anomaly events, metrics, dan baseline result.

Spesifikasi metodologi yang harus dipertahankan:
- target prediksi: suhu S2;
- fitur input: suhu dan kelembaban S1/S2;
- window input: 30 data terakhir;
- horizon prediksi: 5 menit ke depan;
- split data: kronologis, bukan random;
- baseline: persistence model dan/atau moving average;
- metrik: RMSE, MAE, MAPE;
- status termal:
  - `normal`: prediksi suhu S2 < 30°C;
  - `waspada`: 30°C sampai 32°C;
  - `anomali`: > 32°C;
  - `trouble`: sensor timeout, tidak terbaca, atau data tidak valid.

Jangan:
- mengubah target prediksi menjadi semua sensor tanpa alasan;
- menggunakan random split untuk data time-series;
- menghapus baseline;
- menghapus evaluasi RMSE/MAE/MAPE;
- mengklaim threshold sebagai standar universal industri. Threshold adalah batas operasional penelitian.

### `database/`

Folder migration dan seed database.

Tanggung jawab:
- mendefinisikan struktur tabel;
- menyediakan seed data awal;
- menjaga integritas data time-series;
- menyediakan indeks yang dibutuhkan untuk query berdasarkan timestamp dan sensor.

Tabel inti yang perlu dijaga:
- `gateways`
- `sensors`
- `sensor_readings`
- `predictions`
- `anomaly_events`
- `model_metrics`
- `baseline_results`
- `notifications`
- `settings`

Jika ada fitur layout sensor, pertahankan tabel terkait layout, status icon, atau device position sesuai implementasi yang sudah ada.

Jangan:
- mengganti database utama menjadi SQLite untuk EMS Server;
- menghapus timestamp dari readings;
- menghapus relasi sensor ke readings/predictions/anomaly events;
- mengubah migration tanpa mempertimbangkan seed dan kode repository.

---

## Run Commands

### Start database

```bash
docker-compose up -d
docker exec ems_db pg_isready -U ems_user -d ems_db
```

### Start backend

```bash
cd backend-go
go mod tidy
go run cmd/server/main.go
```

Health check:

```bash
curl http://localhost:8080/api/v1/health
```

### Start frontend dashboard

```bash
cd frontend-dashboard
npm install
npm run dev
```

Open:

```text
http://localhost:5173
```

### Run gateway simulator

```bash
cd gateway/src

python main.py --mode simulator --scenario normal
python main.py --mode simulator --scenario warming
python main.py --mode simulator --scenario waspada
python main.py --mode simulator --scenario anomali
python main.py --mode simulator --scenario trouble
```

Inject demo data if available:

```bash
python ../inject_demo_data.py
```

### Run Raspberry Pi gateway

```bash
cd gateway-rpi
chmod +x install.sh
./install.sh

source .venv/bin/activate
cd src
uvicorn main:app --host 0.0.0.0 --port 8765
```

Access from laptop:

```text
http://<IP-Raspberry-Pi>:8765
```

### Train LSTM

```bash
cd ml-worker
pip install -r requirements.txt
cd src
python train_lstm.py
```

### Run inference

```bash
cd ml-worker/src

python inference.py
python scheduler.py --once
python scheduler.py --interval 1
```

---

## Environment Rules

Use `.env.example` as the template for each module.

Common variables:
- database host, port, user, password, and name;
- gateway API token;
- backend base URL;
- Telegram bot token and chat ID;
- frontend API base URL.

Rules:
- Never commit real `.env` secrets.
- Never hardcode Telegram token, database password, or gateway token.
- Development token boleh sederhana, tetapi production/demo token tetap harus lewat `.env`.
- Keep `.env.example` updated when adding a new variable.

---

## API Payload Rules

Payload readings dari gateway ke backend harus minimal memuat:
- `gateway_id` atau identitas gateway;
- `sensor_id` atau kode sensor seperti `S1` dan `S2`;
- `timestamp`;
- `temperature`;
- `humidity`.

Validation rules:
- suhu tidak boleh kosong;
- kelembaban tidak boleh kosong;
- sensor harus dikenal;
- timestamp harus valid;
- value tidak logis harus ditolak atau ditandai trouble;
- request gateway harus menggunakan Bearer Token.

---

## Coding Guidelines

### General

- Buat perubahan kecil dan jelas.
- Pertahankan struktur folder yang sudah ada.
- Ikuti pola kode existing sebelum membuat pola baru.
- Jangan rewrite besar-besaran tanpa kebutuhan.
- Jangan menghapus fitur yang dipakai Bab 4: dashboard, readings, predictions, anomalies, evaluation, layout, notifications, logs, simulator, RPi gateway, SSE, Telegram.
- Setelah mengubah API, update type frontend, handler backend, dokumentasi endpoint, dan contoh request.
- Setelah mengubah database, update migration, seed, repository query, model Go/Python, dan dokumentasi tabel.

### Go backend

- Gunakan struktur `cmd/server` dan `internal/...`.
- Pisahkan handler, service, repository, middleware, model, dan config.
- Gunakan context dan error handling yang jelas.
- Jangan panic untuk error normal request.
- Response JSON harus konsisten.
- Endpoint yang menerima data gateway wajib dilindungi token.
- SSE tidak boleh memblokir request API biasa.

### React frontend

- Gunakan TypeScript type/interface untuk response API.
- Komponen UI harus clean dan cocok untuk dashboard skripsi.
- Pertahankan navigasi halaman utama:
  - Dashboard
  - Sensor Readings
  - Predictions
  - Anomalies
  - Model Evaluation
  - Sensor Layout
  - Notifications
  - Settings
  - System Logs
- Jangan hardcode dummy data sebagai data final jika API sudah tersedia.
- Dummy data hanya boleh untuk fallback dev dan harus jelas penandaannya.

### Python gateway

- Pisahkan simulator, sender HTTP, config, dan retry/buffer logic.
- Payload simulator harus sama dengan payload gateway fisik.
- Retry boleh ada, tetapi jangan membuat spam request tak terbatas.
- Local buffer boleh dipakai saat backend offline.

### Raspberry Pi gateway

- Pertahankan kemampuan konfigurasi melalui Web UI dan `config.yaml`.
- Pertahankan pembacaan XY-MD02 via Modbus RTU.
- Register default:
  - temperature register: 1, scale ÷10 ke °C;
  - humidity register: 2, scale ÷10 ke %RH.
- Jangan mengasumsikan port selalu `/dev/ttyUSB0`; tetap sediakan scan/config serial.
- Mode gather data boleh menyimpan SQLite lokal, tetapi sinkronisasi utama ke EMS tetap melalui backend API.

### ML Worker

- Selalu jaga preprocessing time-series:
  - validasi timestamp;
  - handling missing value;
  - deteksi nilai tidak wajar;
  - normalisasi;
  - windowing;
  - split kronologis.
- Simpan artefak model di folder `models/` jika memang digunakan.
- Simpan hasil evaluasi ke database.
- Simpan prediction dan anomaly event ke database.
- Jangan menilai LSTM tanpa baseline.
- Jangan mengubah horizon/window tanpa memperbarui Bab 3/Bab 4 dan dokumentasi.

---

## Academic Scope Guardrails

Saat melakukan perubahan, pastikan tetap sesuai skripsi:

- Produk utama: EMS server testbed.
- Modul AI: LSTM untuk prediksi suhu S2.
- Sensor utama: XY-MD02 S1 dan S2.
- S1: ambient/referensi ruangan.
- S2: hotspot/exhaust dan target prediksi.
- Gateway: Raspberry Pi atau simulator.
- Backend: Go.
- Database: PostgreSQL/TimescaleDB.
- Intelligence: Python LSTM.
- Dashboard: React.
- Real-time: SSE.
- Alert: Telegram.

Hindari scope berikut:
- klaim PUE aktual data center;
- optimasi energi;
- kontrol pendingin otomatis;
- otomatisasi kipas/AC sebagai fitur inti;
- prediksi beban CPU sebagai fokus utama;
- MQTT sebagai jalur utama;
- multi-tenant enterprise monitoring;
- deployment cloud kompleks;
- sensor tambahan yang membuat Bab 3 dan Bab 4 tidak konsisten.

---

## Definition of Done

Sebuah perubahan dianggap selesai jika:

1. Kode berjalan minimal pada modul yang diubah.
2. Tidak memutus alur utama sensor → gateway → backend → database → ML Worker → dashboard/Telegram.
3. Endpoint dan payload tetap konsisten.
4. Data readings tersimpan dengan timestamp dan sensor_id.
5. Dashboard tetap bisa mengambil data dari backend.
6. LSTM tetap menargetkan suhu S2.
7. Evaluasi RMSE, MAE, MAPE dan baseline tetap tersedia.
8. Perubahan database disertai migration/seed yang sesuai.
9. Dokumentasi atau README terkait diperbarui bila ada perubahan command, env, endpoint, atau tabel.
10. Tidak ada secret asli yang masuk ke commit.

---

## Recommended Debugging Order

Jika sistem tidak berjalan, cek urutan ini:

1. Database container hidup.
2. `.env` backend benar.
3. Backend health check sukses.
4. Seed gateway dan sensor tersedia.
5. Gateway token cocok dengan backend.
6. Gateway simulator bisa POST readings.
7. Data masuk ke `sensor_readings`.
8. Frontend bisa akses API backend.
9. SSE `/api/v1/events` terhubung.
10. ML Worker bisa membaca data historis.
11. Training menghasilkan model dan metrics.
12. Inference menghasilkan prediction.
13. Status `normal/waspada/anomali/trouble` muncul di dashboard.
14. Telegram token dan chat ID valid jika notifikasi diuji.

---

## Response Style for Coding Agent

Saat menjawab di Codex:

- Jelaskan file yang akan diubah sebelum mengubahnya.
- Setelah mengubah kode, berikan ringkasan singkat:
  - file yang diubah;
  - alasan perubahan;
  - command test/build yang dijalankan;
  - risiko atau catatan lanjutan.
- Jika ada asumsi, tuliskan jelas.
- Jika ada konflik antara README, kode, dan Bab skripsi, prioritaskan:
  1. kode yang sedang berjalan,
  2. README repo terbaru,
  3. Bab 3/Bab 4 yang sudah dikunci,
  4. dokumen pedoman lama.

---