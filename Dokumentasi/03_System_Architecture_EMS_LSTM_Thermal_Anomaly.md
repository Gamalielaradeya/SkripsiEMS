# 03 System Architecture — EMS LSTM Thermal Anomaly Monitoring System

**Judul Skripsi:** Prediksi Anomali Termal pada Environment Monitoring System Server Menggunakan Algoritma Long Short-Term Memory  
**Jenis Dokumen:** System Architecture Document  
**Versi:** 1.0  
**Status:** Final untuk dasar implementasi AI Agent  
**Target Pengguna Dokumen:** AI coding agent, developer, mahasiswa, dan reviewer teknis  
**Tanggal:** 2026-05-23  

---

## 1. Tujuan Dokumen

Dokumen ini menjelaskan arsitektur sistem untuk pengembangan **EMS LSTM Thermal Anomaly Monitoring System**.

Dokumen ini digunakan agar AI coding agent dan developer memahami:

1. Komponen utama sistem.
2. Hubungan antar komponen.
3. Alur data dari sensor sampai dashboard.
4. Alur prediksi LSTM dan deteksi anomali.
5. Integrasi backend, database, ML worker, dashboard, dan Telegram.
6. Mode deployment lokal, simulator, dan hardware.
7. Batasan arsitektur agar implementasi tetap sesuai dengan skripsi.

---

## 2. Ringkasan Arsitektur

Sistem terdiri dari beberapa komponen utama:

1. **Sensor XY-MD02 S1 Ambient**
2. **Sensor XY-MD02 S2 Hotspot**
3. **USB RS485 Converter**
4. **Raspberry Pi Gateway**
5. **Go Backend API**
6. **PostgreSQL + TimescaleDB**
7. **Python ML Worker**
8. **React Dashboard**
9. **Telegram Notification Service**
10. **Sensor Simulator / Demo Replay**

Secara umum, data bergerak dari sensor ke Raspberry Pi, lalu dikirim ke backend, disimpan ke database, dipakai oleh dashboard untuk monitoring, dan dipakai oleh ML worker untuk prediksi suhu S2 menggunakan LSTM.

---

## 3. Prinsip Arsitektur

Arsitektur sistem harus mengikuti prinsip berikut:

1. **Modular**  
   Gateway, backend, database, ML worker, dan dashboard dipisahkan menjadi komponen yang jelas.

2. **Explainable for Thesis**  
   Implementasi harus mudah dijelaskan dalam Bab 4, tidak terlalu enterprise, dan tidak keluar dari scope skripsi.

3. **Sensor-first Design**  
   Data sensor menjadi sumber utama sistem.

4. **Time-series Oriented**  
   Data disimpan dengan timestamp dan diolah secara kronologis.

5. **Predictive Monitoring**  
   Sistem tidak hanya menampilkan data aktual, tetapi juga prediksi suhu S2.

6. **Early Warning**  
   Status termal dan notifikasi digunakan sebagai peringatan dini.

7. **No Automatic Cooling Control**  
   Sistem tidak mengontrol kipas, AC, relay, atau perangkat pendingin.

8. **No PUE Calculation**  
   Sistem tidak menghitung Power Usage Effectiveness aktual.

9. **Development-safe**  
   Sistem harus bisa berjalan dengan simulator ketika hardware belum tersedia.

10. **Demo-ready**  
   Sistem harus dapat didemokan secara lokal dengan data real atau simulasi.

---

## 4. Arsitektur Tingkat Tinggi

```text
[Sensor XY-MD02 S1 Ambient] ─┐
                             ├── [USB RS485 Converter] ── [Raspberry Pi Gateway]
[Sensor XY-MD02 S2 Hotspot] ─┘                                      |
                                                                    | HTTP REST API / JSON
                                                                    v
                                                         [Go Backend API + SSE]
                                                                    |
                                                                    v
                                                  [PostgreSQL + TimescaleDB]
                                                                    |
                                      ┌─────────────────────────────┴─────────────────────────────┐
                                      v                                                           v
                         [Python ML Worker: LSTM]                                      [React Dashboard]
                                      |                                                           |
                                      v                                                           v
               [Prediction + Evaluation + Anomaly Status]                         [Chart + Sensor Layout + Alert]
                                      |                                                           |
                                      └────────────────────── [Telegram Notification] ─────────────┘
```

---

## 5. Deployment View

Sistem memiliki dua mode deployment utama:

1. **Development / Simulator Mode**
2. **Hardware / Real Sensor Mode**

---

## 6. Development / Simulator Mode

Mode ini digunakan ketika sensor XY-MD02 atau Raspberry Pi belum tersedia, atau ketika developer ingin menguji sistem dengan cepat.

```text
[Sensor Simulator Python]
          |
          | HTTP JSON
          v
[Go Backend API]
          |
          v
[PostgreSQL + TimescaleDB]
          |
   ┌──────┴────────┐
   v               v
[ML Worker]   [React Dashboard]
   |               |
   v               v
[Predictions] [Monitoring UI]
   |
   v
[Telegram Alert]
```

### Komponen yang Berjalan

| Komponen | Lokasi |
|---|---|
| Sensor simulator | Laptop development |
| Go backend | Laptop development |
| PostgreSQL | Laptop development / Docker |
| ML worker | Laptop development |
| React dashboard | Laptop development |
| Telegram | Internet API |

### Tujuan Mode Simulator

1. Memastikan API berjalan.
2. Memastikan database menerima data.
3. Memastikan dashboard tampil.
4. Memastikan grafik memiliki data.
5. Memastikan ML worker dapat membaca dataset.
6. Memastikan status normal/waspada/anomali dapat diuji.
7. Memastikan Telegram alert dapat diuji.
8. Menjadi fallback saat demo jika hardware bermasalah.

---

## 7. Hardware / Real Sensor Mode

Mode ini digunakan ketika Raspberry Pi, sensor XY-MD02, dan USB RS485 Converter sudah tersedia.

```text
[XY-MD02 S1] ─┐
              ├── [RS485 Bus] ── [USB RS485 Converter] ── [Raspberry Pi]
[XY-MD02 S2] ─┘                                                    |
                                                                  | HTTP JSON
                                                                  v
                                                       [Go Backend API]
                                                                  |
                                                                  v
                                                    [PostgreSQL + TimescaleDB]
                                                                  |
                                      ┌───────────────────────────┴───────────────────────────┐
                                      v                                                       v
                                [ML Worker]                                           [React Dashboard]
                                      |                                                       |
                                      v                                                       v
                              [LSTM Prediction]                                      [Monitoring + Layout]
                                      |
                                      v
                              [Telegram Alert]
```

### Komponen Fisik

| Komponen | Fungsi |
|---|---|
| XY-MD02 S1 | Membaca suhu dan kelembaban ambient |
| XY-MD02 S2 | Membaca suhu dan kelembaban hotspot/exhaust |
| USB RS485 Converter | Menghubungkan RS485 sensor ke Raspberry Pi |
| Raspberry Pi | Gateway pembaca sensor |
| Laptop/server development | Menjalankan backend, database, ML worker, dashboard |
| Jaringan lokal | Menghubungkan Raspberry Pi dan laptop/server backend |

---

## 8. Component View

```text
ems-lstm-thermal-anomaly/
│
├── gateway/
│   ├── Modbus Reader
│   ├── Sensor Validator
│   ├── Payload Builder
│   ├── HTTP Sender
│   ├── Local Logger
│   └── Simulator
│
├── backend-go/
│   ├── API Handler
│   ├── Request Validator
│   ├── Service Layer
│   ├── Repository Layer
│   ├── SSE Hub
│   ├── Telegram Client
│   ├── Settings Service
│   └── System Logger
│
├── database/
│   ├── Gateways
│   ├── Sensors
│   ├── Sensor Readings
│   ├── Predictions
│   ├── Anomalies
│   ├── Model Versions
│   ├── Model Metrics
│   ├── Baseline Results
│   ├── Layouts
│   ├── Sensor Positions
│   └── Notifications
│
├── ml-worker/
│   ├── Dataset Loader
│   ├── Preprocessor
│   ├── Window Builder
│   ├── Baseline Model
│   ├── LSTM Trainer
│   ├── Evaluator
│   ├── Inference Runner
│   └── Prediction Writer
│
└── frontend-dashboard/
    ├── API Client
    ├── SSE Client
    ├── Dashboard Pages
    ├── Chart Components
    ├── shadcn/ui Components
    ├── Sensor Layout Components
    └── Notification Components
```

---

## 9. Data Flow Architecture

## 9.1 Alur Akuisisi Sensor

```text
Sensor S1/S2
    ↓
USB RS485 Converter
    ↓
Raspberry Pi Gateway
    ↓
Read Modbus Register
    ↓
Validate Sensor Data
    ↓
Build JSON Payload
    ↓
Send HTTP POST
    ↓
Go Backend API
    ↓
Validate Payload
    ↓
Save to PostgreSQL
```

### Penjelasan

1. Sensor S1 dan S2 membaca suhu dan kelembaban.
2. Raspberry Pi membaca sensor melalui USB RS485 Converter.
3. Gateway melakukan validasi awal.
4. Gateway membentuk payload JSON.
5. Payload dikirim ke backend.
6. Backend melakukan validasi ulang.
7. Data disimpan sebagai time-series.

---

## 9.2 Alur Monitoring Dashboard

```text
PostgreSQL / TimescaleDB
        ↓
Go Backend API
        ↓
REST API + SSE
        ↓
React Dashboard
        ↓
Cards + Charts + Tables + Sensor Layout
```

### Data yang Ditampilkan

1. Suhu S1 terbaru.
2. Kelembaban S1 terbaru.
3. Suhu S2 terbaru.
4. Kelembaban S2 terbaru.
5. Grafik suhu historis.
6. Grafik kelembaban historis.
7. Prediksi suhu S2.
8. Status normal/waspada/anomali.
9. Sensor layout.
10. Riwayat anomali.
11. Riwayat notifikasi.
12. Evaluasi model.

---

## 9.3 Alur Prediksi LSTM

```text
Sensor Readings Table
        ↓
ML Worker Dataset Loader
        ↓
Merge S1 and S2 by Timestamp
        ↓
Preprocessing
        ↓
Normalization
        ↓
Window Builder
        ↓
LSTM Model
        ↓
Prediction: S2 Temperature +5 Minutes
        ↓
Threshold Classification
        ↓
Save Prediction + Status
        ↓
Dashboard + Telegram Alert
```

### Parameter Awal

| Parameter | Nilai |
|---|---|
| Sampling interval | 1 menit |
| Window input | 30 data terakhir |
| Horizon prediksi | 5 menit ke depan |
| Feature input | suhu S1, kelembaban S1, suhu S2, kelembaban S2 |
| Target | suhu S2 pada waktu mendatang |
| Output | prediksi suhu S2 dan status termal |

---

## 9.4 Alur Notifikasi Telegram

```text
Prediction Created
        ↓
Thermal Status Classified
        ↓
Status = Waspada or Anomali?
        ↓
Check Notification Cooldown
        ↓
Send Telegram Message
        ↓
Save Notification Log
        ↓
Show on Dashboard
```

---

## 10. Gateway Architecture

## 10.1 Tanggung Jawab Gateway

Gateway bertanggung jawab untuk:

1. Membaca sensor S1.
2. Membaca sensor S2.
3. Memberikan timestamp.
4. Membentuk payload JSON.
5. Mengirim data ke backend.
6. Mendeteksi sensor timeout.
7. Mencatat error lokal.
8. Menyediakan mode simulator.

## 10.2 Internal Module Gateway

```text
gateway/
├── config_loader.py
├── modbus_reader.py
├── sensor_validator.py
├── payload_builder.py
├── http_sender.py
├── local_logger.py
├── simulator.py
└── main.py
```

### 10.2.1 config_loader.py

Membaca konfigurasi:

1. Backend URL.
2. API token.
3. Serial port.
4. Baudrate.
5. Slave ID S1 dan S2.
6. Sampling interval.
7. Mode simulator.

### 10.2.2 modbus_reader.py

Membaca sensor XY-MD02 melalui Modbus RS485.

### 10.2.3 sensor_validator.py

Memvalidasi nilai suhu dan kelembaban.

### 10.2.4 payload_builder.py

Membentuk JSON payload.

### 10.2.5 http_sender.py

Mengirim payload ke backend.

### 10.2.6 simulator.py

Menghasilkan data simulasi.

---

## 11. Backend Architecture

## 11.1 Backend Layer

Backend menggunakan arsitektur berlapis:

```text
HTTP Handler
    ↓
Request Validator
    ↓
Service Layer
    ↓
Repository Layer
    ↓
PostgreSQL
```

## 11.2 Backend Module

```text
backend-go/
├── cmd/
│   └── server/
│       └── main.go
│
├── internal/
│   ├── config/
│   ├── handler/
│   ├── middleware/
│   ├── model/
│   ├── repository/
│   ├── service/
│   ├── sse/
│   ├── telegram/
│   ├── validator/
│   └── logger/
│
├── migrations/
├── go.mod
└── README.md
```

## 11.3 Handler Layer

Handler menerima request HTTP dan mengembalikan response JSON.

Contoh handler:

1. ReadingHandler.
2. DashboardHandler.
3. PredictionHandler.
4. AnomalyHandler.
5. ModelMetricHandler.
6. LayoutHandler.
7. NotificationHandler.
8. HealthHandler.

## 11.4 Service Layer

Service berisi logika bisnis.

Contoh service:

1. ReadingService.
2. DashboardService.
3. PredictionService.
4. AnomalyService.
5. StatusClassificationService.
6. NotificationService.
7. LayoutService.

## 11.5 Repository Layer

Repository bertanggung jawab untuk akses database.

Contoh repository:

1. GatewayRepository.
2. SensorRepository.
3. ReadingRepository.
4. PredictionRepository.
5. AnomalyRepository.
6. MetricRepository.
7. NotificationRepository.
8. LayoutRepository.

## 11.6 SSE Hub

SSE Hub bertugas mengirim event real-time ke dashboard.

Event utama:

| Event | Keterangan |
|---|---|
| reading.latest | Data sensor terbaru |
| prediction.latest | Prediksi terbaru |
| anomaly.created | Anomali baru |
| notification.sent | Notifikasi baru |
| sensor.trouble | Sensor bermasalah |

---

## 12. Database Architecture

## 12.1 Database Engine

Database utama:

```text
PostgreSQL
```

Ekstensi time-series:

```text
TimescaleDB apabila memungkinkan
```

Jika TimescaleDB belum bisa digunakan, sistem tetap dapat berjalan dengan PostgreSQL biasa menggunakan index timestamp.

## 12.2 Tabel Utama

```text
gateways
sensors
sensor_readings
prediction_runs
predictions
anomalies
model_versions
model_metrics
baseline_results
dashboard_layouts
sensor_positions
notifications
system_logs
api_tokens
settings
```

## 12.3 Time-Series Table

Tabel utama time-series adalah:

```text
sensor_readings
```

Index wajib:

```text
recorded_at
(sensor_id, recorded_at)
(gateway_id, recorded_at)
```

Jika TimescaleDB aktif:

```sql
SELECT create_hypertable('sensor_readings', 'recorded_at');
```

## 12.4 Data Integrity Rules

1. Setiap sensor reading wajib memiliki sensor_id.
2. Setiap sensor reading wajib memiliki recorded_at.
3. Data sensor tidak boleh masuk tanpa gateway_id.
4. Prediksi wajib terkait model_version.
5. Anomali wajib terkait prediction.
6. Notification wajib terkait anomaly jika dipicu oleh status.
7. Layout sensor wajib terkait sensor.

---

## 13. ML Worker Architecture

## 13.1 Fungsi Utama ML Worker

ML Worker bertugas untuk:

1. Mengambil data historis.
2. Melakukan preprocessing.
3. Membuat dataset supervised learning.
4. Melatih baseline.
5. Melatih model LSTM.
6. Mengevaluasi model.
7. Menyimpan model dan scaler.
8. Melakukan inference.
9. Menulis hasil prediksi ke database.
10. Menentukan status termal.
11. Memicu alert melalui backend atau database event.

## 13.2 Internal Module ML Worker

```text
ml-worker/
├── src/
│   ├── config.py
│   ├── db.py
│   ├── load_dataset.py
│   ├── preprocess.py
│   ├── windowing.py
│   ├── baseline.py
│   ├── model_lstm.py
│   ├── train_lstm.py
│   ├── evaluate.py
│   ├── inference.py
│   ├── classify_status.py
│   └── write_results.py
│
├── models/
│   ├── lstm_model.keras
│   └── scaler.pkl
│
├── notebooks/
│   └── exploration.ipynb
│
├── requirements.txt
└── README.md
```

## 13.3 Training Pipeline

```text
Load Dataset
    ↓
Clean Data
    ↓
Merge S1/S2
    ↓
Handle Missing Value
    ↓
Normalize Features
    ↓
Build Window
    ↓
Chronological Split
    ↓
Train Baseline
    ↓
Train LSTM
    ↓
Evaluate RMSE/MAE/MAPE
    ↓
Save Model + Scaler
    ↓
Save Metrics to Database
```

## 13.4 Inference Pipeline

```text
Load Latest 30 Data Points
    ↓
Apply Same Preprocessing
    ↓
Load Scaler
    ↓
Load LSTM Model
    ↓
Predict S2 Temperature +5 Minutes
    ↓
Classify Status
    ↓
Save Prediction
    ↓
Create Anomaly if Needed
    ↓
Notify Backend/Dashboard
```

---

## 14. Dashboard Architecture

## 14.1 Technology Stack

```text
React
Vite
TypeScript
Tailwind CSS
shadcn/ui
Chart.js
SSE Client
```

## 14.2 Frontend Structure

```text
frontend-dashboard/
├── src/
│   ├── app/
│   ├── components/
│   │   ├── ui/
│   │   ├── dashboard/
│   │   ├── charts/
│   │   ├── tables/
│   │   ├── layout/
│   │   └── sensor-layout/
│   │
│   ├── pages/
│   │   ├── DashboardPage.tsx
│   │   ├── SensorReadingsPage.tsx
│   │   ├── PredictionsPage.tsx
│   │   ├── AnomaliesPage.tsx
│   │   ├── ModelEvaluationPage.tsx
│   │   ├── SensorLayoutPage.tsx
│   │   ├── NotificationsPage.tsx
│   │   └── SettingsPage.tsx
│   │
│   ├── lib/
│   │   ├── api.ts
│   │   ├── sse.ts
│   │   └── utils.ts
│   │
│   ├── hooks/
│   │   ├── useDashboardSummary.ts
│   │   ├── useSSE.ts
│   │   └── useSensorHistory.ts
│   │
│   ├── types/
│   │   ├── sensor.ts
│   │   ├── prediction.ts
│   │   ├── anomaly.ts
│   │   └── metric.ts
│   │
│   └── main.tsx
│
├── package.json
├── tailwind.config.js
├── components.json
└── vite.config.ts
```

## 14.3 shadcn/ui Components

Komponen shadcn/ui yang digunakan:

| Komponen | Penggunaan |
|---|---|
| Card | Ringkasan suhu, kelembaban, prediksi, status |
| Badge | Status normal/waspada/anomali/trouble |
| Button | Aksi refresh, save, test notification |
| Table | Data sensor, anomali, evaluasi |
| Dialog | Detail anomali/detail sensor |
| Tabs | Halaman grafik dan evaluasi |
| Select | Filter sensor/status |
| Input | Filter tanggal/keyword |
| Alert | Pesan error/sukses |
| Toast | Feedback UI |
| Tooltip | Penjelasan status/metrik |
| Sheet | Sidebar mobile |

## 14.4 Chart Components

Chart.js digunakan untuk:

1. Grafik suhu S1 dan S2.
2. Grafik kelembaban S1 dan S2.
3. Grafik suhu aktual S2 vs prediksi S2.
4. Grafik jumlah anomali.
5. Grafik error model jika diperlukan.

## 14.5 Dashboard Page Layout

```text
+--------------------------------------------------------------------------------+
| Topbar: EMS Thermal Monitoring                                                  |
+----------------------+---------------------------------------------------------+
| Sidebar              | Content                                                 |
|                      |                                                         |
| Dashboard            | [S1 Temp] [S1 Humidity] [S2 Temp] [S2 Humidity]          |
| Sensor Readings      | [Predicted S2] [Thermal Status] [RMSE] [Anomaly Today]   |
| Predictions          |                                                         |
| Anomalies            | [Temperature Chart] [Humidity Chart]                     |
| Model Evaluation     |                                                         |
| Sensor Layout        | [Actual vs Prediction Chart]                             |
| Notifications        |                                                         |
| Settings             | [Sensor Layout Map] [Recent Anomalies]                   |
|                      |                                                         |
+----------------------+---------------------------------------------------------+
```

---

## 15. Notification Architecture

## 15.1 Notification Responsibility

Notifikasi dapat dipicu oleh:

1. Backend saat menerima status trouble.
2. ML Worker saat menghasilkan status waspada/anomali.
3. Backend saat membaca prediksi/anomali baru.

Untuk menjaga arsitektur tetap sederhana, pendekatan yang direkomendasikan:

```text
ML Worker menyimpan prediction + anomaly
        ↓
Backend Notification Service membaca anomaly baru
        ↓
Backend mengirim Telegram
        ↓
Backend menyimpan notification log
```

Alternatif yang juga boleh:

```text
ML Worker memanggil endpoint backend /api/v1/notifications/trigger
```

## 15.2 Telegram Message Format

```text
[EMS THERMAL ALERT]

Status        : ANOMALI
Sensor Acuan  : S2 - Hotspot/Exhaust
Prediksi S2   : 33.1°C
Horizon       : 5 menit ke depan
Waktu Prediksi: 2026-05-23 14:35:00
Waktu Deteksi : 2026-05-23 14:30:00

Sistem memprediksi suhu melewati batas operasional.
Silakan cek dashboard EMS.
```

## 15.3 Cooldown

Default cooldown:

```text
5 menit
```

Aturan:

1. Status yang sama tidak dikirim berulang dalam cooldown.
2. Eskalasi dari waspada ke anomali tetap dikirim.
3. Recovery ke normal dapat dicatat sebagai notifikasi opsional.
4. Error Telegram disimpan tetapi tidak menghentikan sistem.

---

## 16. API Communication

## 16.1 Gateway to Backend

Protocol:

```text
HTTP REST JSON
```

Endpoint:

```text
POST /api/v1/readings
```

Authentication:

```text
Bearer token
```

## 16.2 Dashboard to Backend

Protocol:

```text
HTTP REST JSON + SSE
```

Endpoint penting:

```text
GET /api/v1/dashboard/summary
GET /api/v1/readings/latest
GET /api/v1/readings/history
GET /api/v1/predictions/latest
GET /api/v1/predictions/history
GET /api/v1/anomalies
GET /api/v1/model-metrics/latest
GET /api/v1/baselines/latest
GET /api/v1/layout
GET /api/v1/events
```

## 16.3 ML Worker to Database

ML Worker dapat terhubung langsung ke database untuk:

1. Membaca dataset.
2. Menulis model metrics.
3. Menulis prediction.
4. Menulis anomaly.

Alternatif: ML Worker dapat memanggil backend API. Namun untuk implementasi skripsi, koneksi database langsung dari worker lebih sederhana untuk pipeline training dan evaluasi.

---

## 17. Sequence Diagram

## 17.1 Sensor Reading Sequence

```text
Raspberry Pi Gateway      Go Backend        PostgreSQL        Dashboard
        |                     |                  |                |
        | POST /readings      |                  |                |
        |-------------------->|                  |                |
        |                     | Validate payload |                |
        |                     |------------------|                |
        |                     | Save readings    |                |
        |                     |----------------->|                |
        |                     | Emit SSE event   |                |
        |                     |----------------------------------->|
        | 200 OK              |                  |                |
        |<--------------------|                  |                |
```

## 17.2 LSTM Prediction Sequence

```text
ML Worker          PostgreSQL         Go Backend/SSE       Dashboard
    |                  |                    |                  |
    | Query readings   |                    |                  |
    |----------------->|                    |                  |
    | Dataset          |                    |                  |
    |<-----------------|                    |                  |
    | Preprocess       |                    |                  |
    | Predict S2       |                    |                  |
    | Save prediction  |                    |                  |
    |----------------->|                    |                  |
    | Save anomaly     |                    |                  |
    |----------------->|                    |                  |
    | Notify/emit      |------------------->|                  |
    |                  |                    | SSE prediction   |
    |                  |                    |----------------->|
```

## 17.3 Telegram Alert Sequence

```text
Prediction/Anomaly     Notification Service     Telegram API      Notifications Table
        |                       |                    |                    |
        | New anomaly            |                    |                    |
        |---------------------->|                    |                    |
        |                       | Check cooldown     |                    |
        |                       |------------------- |                    |
        |                       | Send message       |                    |
        |                       |------------------->|                    |
        |                       | Response           |                    |
        |                       |<-------------------|                    |
        |                       | Save log           |                    |
        |                       |-------------------------------------->|
```

---

## 18. Runtime Process

## 18.1 Backend Runtime

```text
Start Go server
    ↓
Load .env
    ↓
Connect PostgreSQL
    ↓
Initialize repositories/services
    ↓
Initialize SSE hub
    ↓
Initialize Telegram service
    ↓
Register routes
    ↓
Listen on port 8080
```

## 18.2 Gateway Runtime

```text
Start gateway
    ↓
Load config
    ↓
Check mode: hardware or simulator
    ↓
Read S1 and S2
    ↓
Validate values
    ↓
Build payload
    ↓
Send to backend
    ↓
Sleep 60 seconds
    ↓
Repeat
```

## 18.3 ML Worker Runtime

Training mode:

```text
Load config
    ↓
Load historical dataset
    ↓
Preprocess
    ↓
Train baseline
    ↓
Train LSTM
    ↓
Evaluate
    ↓
Save model + metrics
```

Inference mode:

```text
Load config
    ↓
Load latest 30 data
    ↓
Load scaler + model
    ↓
Predict S2 temperature
    ↓
Classify status
    ↓
Save prediction/anomaly
    ↓
Trigger notification if needed
```

## 18.4 Dashboard Runtime

```text
Start Vite dev server
    ↓
Load API base URL
    ↓
Fetch dashboard summary
    ↓
Open SSE connection
    ↓
Render cards/charts/tables/layout
    ↓
Update UI when SSE event received
```

---

## 19. Environment Configuration

## 19.1 Backend `.env`

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

TELEGRAM_ENABLED=true
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
TELEGRAM_COOLDOWN_MINUTES=5

CORS_ALLOWED_ORIGINS=http://localhost:5173
```

## 19.2 Gateway `config.yaml`

```yaml
gateway_id: raspi-gateway-01
mode: simulator # simulator or hardware

backend:
  url: "http://localhost:8080/api/v1/readings"
  token: "change-me"

modbus:
  port: "/dev/ttyUSB0"
  baudrate: 9600
  timeout_seconds: 3
  sensors:
    - code: "S1"
      role: "ambient"
      slave_id: 1
    - code: "S2"
      role: "hotspot"
      slave_id: 2

sampling:
  interval_seconds: 60
```

## 19.3 ML Worker `.env`

```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=ems_user
DB_PASSWORD=ems_password
DB_NAME=ems_db

MODEL_DIR=./models
WINDOW_SIZE=30
HORIZON_MINUTES=5
SAMPLING_INTERVAL_SECONDS=60

NORMAL_MAX_TEMPERATURE=30
ANOMALY_MIN_TEMPERATURE=32
```

## 19.4 Frontend `.env`

```env
VITE_API_BASE_URL=http://localhost:8080/api/v1
VITE_SSE_URL=http://localhost:8080/api/v1/events
```

---

## 20. Port Allocation

| Service | Port |
|---|---|
| Go Backend API | 8080 |
| React Vite Dashboard | 5173 |
| PostgreSQL | 5432 |
| pgAdmin optional | 5050 |
| Gateway | No public port |
| ML Worker | No public port |

---

## 21. Docker Compose Architecture

Docker Compose bersifat opsional tetapi direkomendasikan untuk development.

```text
docker-compose.yml
├── postgres
├── backend-go
├── frontend-dashboard
├── ml-worker
└── pgadmin optional
```

Catatan:

1. Gateway hardware biasanya berjalan di Raspberry Pi, tidak wajib di Docker.
2. Gateway simulator boleh berjalan di Docker atau langsung di laptop.
3. ML Worker boleh dijalankan manual agar training lebih mudah dikontrol.
4. TensorFlow di Docker bisa lebih berat, sehingga untuk awal ML Worker boleh berjalan di virtual environment lokal.

---

## 22. Failure Handling Architecture

## 22.1 Sensor Timeout

```text
Sensor timeout
    ↓
Gateway logs error
    ↓
Gateway marks sensor as trouble
    ↓
Backend stores system log / trouble status
    ↓
Dashboard shows sensor trouble
```

## 22.2 Backend Down

```text
Gateway sends payload
    ↓
Request fails
    ↓
Gateway retries
    ↓
Gateway writes local log/buffer
    ↓
Data can be replayed later
```

## 22.3 Database Down

```text
Backend receives request
    ↓
Database insert fails
    ↓
Backend returns 500
    ↓
System log records error
    ↓
Dashboard health shows database disconnected
```

## 22.4 ML Worker Data Not Enough

```text
Worker runs inference/training
    ↓
Dataset < minimum window
    ↓
Worker stops gracefully
    ↓
System log: data not enough
    ↓
Dashboard shows model not ready
```

## 22.5 Telegram Failure

```text
Notification triggered
    ↓
Telegram request fails
    ↓
Error saved to notifications table
    ↓
System continues running
    ↓
Dashboard still shows anomaly
```

---

## 23. Security Architecture

Security yang diterapkan bersifat dasar dan sesuai kebutuhan penelitian.

## 23.1 Gateway API Token

1. Endpoint penerimaan data sensor wajib menggunakan token.
2. Token disimpan di `.env`.
3. Request tanpa token ditolak.
4. Request token salah ditolak.

## 23.2 CORS

Backend hanya mengizinkan origin dashboard.

Development:

```text
http://localhost:5173
```

## 23.3 Secret Management

Data berikut tidak boleh hardcoded:

1. Database password.
2. Gateway API token.
3. Telegram bot token.
4. Telegram chat ID.

## 23.4 Input Validation

Semua data dari gateway wajib divalidasi:

1. gateway_id.
2. sensor_code.
3. sensor_role.
4. temperature.
5. humidity.
6. recorded_at.

---

## 24. Performance Architecture

## 24.1 Sampling

Sampling awal:

```text
1 menit
```

Alasan:

1. Cukup untuk server testbed.
2. Tidak terlalu membebani database.
3. Cukup untuk membangun time-series.
4. Sesuai rancangan window 30 data = 30 menit historis.

## 24.2 Dashboard Update

Dashboard menerima update melalui SSE.

Fallback:

```text
Polling REST API setiap 10-30 detik
```

## 24.3 ML Worker Schedule

Training:

```text
Manual / scheduled harian / setelah dataset cukup
```

Inference:

```text
Setiap data baru masuk atau setiap 5 menit
```

Untuk implementasi awal, inference bisa dijalankan manual atau scheduler sederhana.

---

## 25. Scalability Boundary

Sistem ini tidak dirancang sebagai sistem enterprise besar. Batas skala penelitian:

| Area | Batas Wajar |
|---|---|
| Sensor | 2 sensor utama |
| Gateway | 1 Raspberry Pi |
| Sampling | 1 menit |
| Objek | 1 server testbed/laptop |
| Dashboard user | 1–3 user lokal |
| Model | 1 model LSTM utama |
| Target | Suhu S2 |

Jika dikembangkan di masa depan, sistem dapat ditambah sensor, multi-gateway, multi-server, dan model prediksi lain.

---

## 26. Mapping Arsitektur ke Bab Skripsi

| Bab/Subbab | Bagian Sistem |
|---|---|
| Bab 1 | Latar belakang kebutuhan monitoring dan prediksi |
| Bab 2 | EMS, time-series, LSTM, threshold anomaly, evaluasi, baseline |
| Bab 3 | Rekayasa kebutuhan, arsitektur, flowchart, database, API, dashboard, ML |
| Bab 4 | Implementasi gateway, backend, dashboard, ML worker, pengujian |
| Bab 5 | Kesimpulan dan saran pengembangan |

---

## 27. Architecture Acceptance Criteria

Arsitektur dianggap sesuai apabila:

```text
[ ] Sistem memiliki gateway sensor atau simulator
[ ] Sistem memiliki Go backend API
[ ] Sistem menggunakan PostgreSQL
[ ] TimescaleDB dapat digunakan jika memungkinkan
[ ] Sistem memiliki Python ML Worker
[ ] Sistem memiliki React + Vite + TypeScript dashboard
[ ] Dashboard menggunakan Tailwind CSS dan shadcn/ui
[ ] Chart utama menggunakan Chart.js
[ ] Backend menyediakan SSE
[ ] Sistem menyimpan data sensor sebagai time-series
[ ] ML Worker memprediksi suhu S2
[ ] Status normal/waspada/anomali dihitung dari prediksi S2
[ ] Telegram alert tersedia
[ ] Sistem tidak mengontrol pendingin otomatis
[ ] Sistem tidak menghitung PUE aktual
[ ] Simulator tersedia untuk development/demo
[ ] Semua modul memiliki konfigurasi environment
[ ] Arsitektur dapat dijelaskan dalam Bab 4
```

---

## 28. Instruksi Khusus untuk AI Agent

Saat mengimplementasikan sistem berdasarkan dokumen ini:

1. Jangan mengubah arsitektur utama.
2. Mulai dari database dan backend API.
3. Buat simulator sensor sejak awal.
4. Pastikan payload simulator sama dengan payload gateway asli.
5. Pastikan backend bisa menerima data sebelum dashboard dibuat.
6. Buat dashboard minimum dengan card dan chart sebelum fitur tambahan.
7. Buat ML Worker setelah data historis tersedia.
8. Buat baseline sebelum LSTM atau bersamaan dengan evaluasi LSTM.
9. Simpan semua hasil prediksi dan evaluasi ke database.
10. Telegram alert dibuat setelah status termal berjalan.
11. Jangan menambahkan PUE atau kontrol pendingin.
12. Jangan membuat sistem terlalu enterprise.
13. Gunakan nama file, folder, dan variabel yang mudah dipahami.
14. Selalu update README jika ada command baru.
15. Pastikan program bisa berjalan di laptop lokal untuk demo.

---

## 29. Ringkasan Final Arsitektur

```text
Hardware:
- Laptop/mini PC sebagai server testbed
- Raspberry Pi sebagai gateway
- 2x XY-MD02 sebagai sensor suhu/kelembaban
- USB RS485 Converter

Backend:
- Go/Golang REST API
- SSE untuk dashboard
- Telegram service

Database:
- PostgreSQL
- TimescaleDB jika memungkinkan
- Time-series table untuk sensor_readings

ML:
- Python
- TensorFlow/Keras
- LSTM sebagai model utama
- Persistence/moving average sebagai baseline

Frontend:
- React
- Vite
- TypeScript
- Tailwind CSS
- shadcn/ui
- Chart.js

Monitoring:
- S1 ambient sebagai referensi
- S2 hotspot sebagai target prediksi
- Status normal, waspada, anomali, trouble
- Telegram sebagai early warning

Deployment:
- Local development
- Simulator mode
- Hardware mode
- Docker Compose opsional
```
