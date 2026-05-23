# 08 UI Wireframe — EMS LSTM Thermal Anomaly Monitoring System

**Judul Skripsi:** Prediksi Anomali Termal pada Environment Monitoring System Server Menggunakan Algoritma Long Short-Term Memory  
**Jenis Dokumen:** UI/UX Wireframe Document  
**Versi:** 1.0  
**Status:** Final untuk dasar implementasi AI Agent  
**Target Pengguna Dokumen:** AI coding agent, frontend developer, mahasiswa, dan reviewer teknis  
**Tanggal:** 2026-05-23  

---

## 1. Tujuan Dokumen

Dokumen ini menjelaskan rancangan antarmuka dashboard untuk sistem **EMS LSTM Thermal Anomaly Monitoring System**.

Dashboard berfungsi untuk menampilkan data suhu dan kelembaban dari sensor S1 dan S2, grafik historis, prediksi suhu S2 hasil model LSTM, status termal, status sensor, layout posisi sensor, riwayat anomali, riwayat notifikasi Telegram, evaluasi model LSTM dan baseline, serta pengaturan threshold dasar.

Dokumen ini dibuat agar AI coding agent dapat membangun frontend secara konsisten, rapi, modern, dan sesuai kebutuhan skripsi.

---

## 2. Stack UI Final

```text
Frontend Framework : React
Build Tool         : Vite
Language           : TypeScript
Styling            : Tailwind CSS
UI Component       : shadcn/ui
Chart              : Chart.js
Realtime           : Server-Sent Events (SSE)
API                : Go Backend REST API
```

Dashboard dibuat custom. shadcn/ui digunakan sebagai library komponen, bukan template mentah.

---

## 3. Prinsip Desain UI

1. **Clean and professional** — tampilan bersih dan cocok untuk presentasi skripsi.
2. **Monitoring-first** — suhu, kelembaban, prediksi, dan status langsung terlihat.
3. **Predictive visibility** — dashboard menampilkan data aktual dan prediksi suhu S2.
4. **Status clarity** — normal, waspada, anomali, dan trouble mudah dibedakan.
5. **Academic explainability** — UI mudah dijelaskan pada Bab 4 implementasi.
6. **Responsive layout** — minimal nyaman digunakan pada layar laptop.
7. **Component consistency** — gunakan shadcn/ui untuk card, badge, table, dialog, select, input, alert, toast, dan tooltip.
8. **No unnecessary scope** — tidak menampilkan PUE, optimasi energi, atau kontrol pendingin otomatis.

---

## 4. Warna dan Status

| Status | Makna | Warna UI | Badge |
|---|---|---|---|
| Normal | Suhu prediksi S2 < 30°C | Hijau | `Normal` |
| Waspada | Suhu prediksi S2 30°C sampai 32°C | Kuning/Oranye | `Waspada` |
| Anomali | Suhu prediksi S2 > 32°C | Merah | `Anomali` |
| Trouble | Sensor error, timeout, atau data invalid | Abu/Merah gelap | `Trouble` |

Rekomendasi Tailwind:

```text
Normal  : bg-green-100 text-green-700 border-green-200
Waspada : bg-amber-100 text-amber-700 border-amber-200
Anomali : bg-red-100 text-red-700 border-red-200
Trouble : bg-slate-100 text-slate-700 border-slate-200
```

Badge status harus selalu menampilkan teks, tidak hanya warna.

---

## 5. Layout Global Dashboard

### 5.1 Struktur Halaman

```text
+--------------------------------------------------------------------------------+
| Topbar                                                                         |
| EMS Thermal Monitoring                          API: Online | Model: Ready     |
+--------------------------+-----------------------------------------------------+
| Sidebar                  | Main Content                                        |
|                          |                                                     |
| Dashboard                | Page Title                                          |
| Sensor Readings          | Breadcrumb / Short Description                     |
| Predictions              |                                                     |
| Anomalies                | Cards / Charts / Tables / Layout                   |
| Model Evaluation         |                                                     |
| Sensor Layout            |                                                     |
| Notifications            |                                                     |
| Settings                 |                                                     |
| System Logs              |                                                     |
+--------------------------+-----------------------------------------------------+
```

### 5.2 Sidebar Menu

```text
Dashboard
Sensor Readings
Predictions
Anomalies
Model Evaluation
Sensor Layout
Notifications
Settings
System Logs
```

### 5.3 Topbar

Topbar menampilkan:

```text
EMS Thermal Monitoring | API Online | SSE Connected | Model Ready | Last Update: 14:30
```

Elemen topbar:

1. Nama sistem.
2. Status koneksi API.
3. Status SSE.
4. Status model.
5. Timestamp data terakhir.
6. Tombol refresh.
7. Toggle theme opsional.

---

## 6. Komponen shadcn/ui yang Digunakan

| Komponen | Penggunaan |
|---|---|
| `Card` | Ringkasan suhu, kelembaban, prediksi, status, metrik |
| `Badge` | Status normal/waspada/anomali/trouble |
| `Button` | Refresh, save, test Telegram, export |
| `Table` | Data sensor, prediksi, anomali, notifikasi |
| `Tabs` | Memisahkan chart aktual, prediksi, evaluasi |
| `Dialog` | Detail sensor, detail prediksi, detail anomali |
| `Select` | Filter sensor, status, rentang waktu |
| `Input` | Pencarian, filter tanggal, setting |
| `Alert` | Error API, model belum siap, sensor trouble |
| `Tooltip` | Penjelasan metrik RMSE/MAE/MAPE |
| `Toast` | Feedback aksi seperti save/test notification |
| `Sheet` | Sidebar mobile |
| `Skeleton` | Loading state |

---

## 7. Struktur Folder Frontend

```text
frontend-dashboard/
├── src/
│   ├── app/
│   │   └── App.tsx
│   ├── components/
│   │   ├── ui/
│   │   ├── layout/
│   │   │   ├── AppLayout.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Topbar.tsx
│   │   │   └── PageHeader.tsx
│   │   ├── dashboard/
│   │   │   ├── SensorStatusCard.tsx
│   │   │   ├── PredictionCard.tsx
│   │   │   ├── ThermalStatusCard.tsx
│   │   │   ├── MetricCard.tsx
│   │   │   └── RecentAnomalyTable.tsx
│   │   ├── charts/
│   │   │   ├── TemperatureChart.tsx
│   │   │   ├── HumidityChart.tsx
│   │   │   ├── ActualVsPredictionChart.tsx
│   │   │   └── ModelComparisonChart.tsx
│   │   ├── sensor-layout/
│   │   │   ├── SensorLayoutMap.tsx
│   │   │   ├── SensorMarker.tsx
│   │   │   └── LayoutEditor.tsx
│   │   └── status/
│   │       ├── StatusBadge.tsx
│   │       └── ConnectionStatus.tsx
│   ├── pages/
│   │   ├── DashboardPage.tsx
│   │   ├── SensorReadingsPage.tsx
│   │   ├── PredictionsPage.tsx
│   │   ├── AnomaliesPage.tsx
│   │   ├── ModelEvaluationPage.tsx
│   │   ├── SensorLayoutPage.tsx
│   │   ├── NotificationsPage.tsx
│   │   ├── SettingsPage.tsx
│   │   └── SystemLogsPage.tsx
│   ├── hooks/
│   ├── lib/
│   │   ├── api.ts
│   │   ├── sse.ts
│   │   ├── chart.ts
│   │   ├── status.ts
│   │   └── utils.ts
│   ├── types/
│   └── main.tsx
├── package.json
├── vite.config.ts
├── tailwind.config.js
├── components.json
├── .env.example
└── README.md
```

---

# 8. Halaman 1 — Dashboard Utama

## 8.1 Tujuan Halaman

Dashboard utama adalah halaman pertama yang dilihat pengguna. Halaman ini menampilkan kondisi sistem secara ringkas dan cepat.

Informasi utama:

1. S1 temperature.
2. S1 humidity.
3. S2 temperature.
4. S2 humidity.
5. Prediksi suhu S2.
6. Status termal.
7. Grafik suhu.
8. Grafik kelembaban.
9. Grafik aktual vs prediksi.
10. Layout sensor.
11. Riwayat anomali terbaru.
12. Metrik model terbaru.

## 8.2 Wireframe Desktop

```text
+--------------------------------------------------------------------------------+
| Topbar: EMS Thermal Monitoring | API Online | SSE Connected | Last: 14:30       |
+----------------------+---------------------------------------------------------+
| Sidebar              | Dashboard                                               |
|                      | Monitoring suhu dan kelembaban server testbed           |
| Dashboard            |                                                         |
| Sensor Readings      | +-------------+ +-------------+ +-------------+          |
| Predictions          | | S1 Temp     | | S1 Humidity | | S2 Temp     |          |
| Anomalies            | | 27.4°C      | | 63.2%       | | 30.8°C      |          |
| Model Evaluation     | | Normal      | | Normal      | | Waspada     |          |
| Sensor Layout        | +-------------+ +-------------+ +-------------+          |
| Notifications        |                                                         |
| Settings             | +-------------+ +-------------+ +-------------+          |
| System Logs          | | S2 Humidity | | Prediksi S2 | | Status      |          |
|                      | | 58.5%       | | 31.4°C      | | WASPADA     |          |
|                      | +-------------+ +-------------+ +-------------+          |
|                      |                                                         |
|                      | +-------------------------+ +-------------------------+ |
|                      | | Grafik Suhu S1/S2       | | Grafik Kelembaban      | |
|                      | +-------------------------+ +-------------------------+ |
|                      |                                                         |
|                      | +-----------------------------------------------------+ |
|                      | | Grafik Aktual S2 vs Prediksi S2                    | |
|                      | +-----------------------------------------------------+ |
|                      |                                                         |
|                      | +-------------------------+ +-------------------------+ |
|                      | | Layout Sensor           | | Anomali Terbaru        | |
|                      | +-------------------------+ +-------------------------+ |
+----------------------+---------------------------------------------------------+
```

## 8.3 Dashboard Cards

### Card 1 — S1 Temperature

```text
Title       : S1 Ambient Temperature
Value       : 27.4°C
Subtitle    : Area ambient/reference
Status      : Normal
Last update : 14:30
```

### Card 2 — S1 Humidity

```text
Title       : S1 Ambient Humidity
Value       : 63.2%
Status      : Normal
```

### Card 3 — S2 Temperature

```text
Title       : S2 Hotspot Temperature
Value       : 30.8°C
Subtitle    : Hotspot / exhaust area
Status      : Waspada
```

### Card 4 — S2 Humidity

```text
Title       : S2 Hotspot Humidity
Value       : 58.5%
Status      : Normal
```

### Card 5 — Predicted S2 Temperature

```text
Title       : Predicted S2 Temperature
Value       : 31.4°C
Subtitle    : 5 minutes ahead
Model       : LSTM v1.0.0
```

### Card 6 — Thermal Status

```text
Title       : Thermal Status
Value       : WASPADA
Description : Predicted S2 temperature is in warning range
```

### Card 7 — RMSE / MAE / MAPE

Bisa dibuat 3 card kecil atau satu card gabungan.

```text
RMSE : 0.84°C
MAE  : 0.62°C
MAPE : 2.15%
```

## 8.4 Chart Dashboard

### Temperature Chart

Menampilkan:

1. Suhu S1.
2. Suhu S2.
3. Rentang waktu 1 jam/6 jam/24 jam.

### Humidity Chart

Menampilkan:

1. Kelembaban S1.
2. Kelembaban S2.

### Actual vs Prediction Chart

Menampilkan:

1. Suhu aktual S2.
2. Suhu prediksi S2.
3. Threshold normal 30°C.
4. Threshold anomali 32°C.

Catatan: garis threshold boleh ditampilkan jika mudah diimplementasikan.

## 8.5 Recent Anomaly Table

Kolom:

```text
Time
Sensor
Status
Predicted Temp
Actual Temp
Description
Notification
Action
```

Contoh:

| Time | Sensor | Status | Predicted | Notification |
|---|---|---|---:|---|
| 14:30 | S2 | Waspada | 31.4°C | Sent |

---

# 9. Halaman 2 — Sensor Readings

## 9.1 Tujuan Halaman

Menampilkan data sensor historis dari S1 dan S2.

## 9.2 Wireframe

```text
+--------------------------------------------------------------+
| Sensor Readings                                              |
| Data historis suhu dan kelembaban dari S1 dan S2              |
+--------------------------------------------------------------+
| Filter: [Sensor Select] [Date From] [Date To] [Quality] [Go] |
+--------------------------------------------------------------+
| Temperature History Chart                                    |
+--------------------------------------------------------------+
| Humidity History Chart                                       |
+--------------------------------------------------------------+
| Table                                                        |
| Time | Sensor | Role | Temperature | Humidity | Quality      |
+--------------------------------------------------------------+
```

## 9.3 Filter

| Filter | Tipe Komponen |
|---|---|
| Sensor | `Select` S1/S2/All |
| Date from | `Input type=date/time` |
| Date to | `Input type=date/time` |
| Quality status | `Select` valid/simulated/timeout/invalid |
| Search | Input opsional |

## 9.4 Table Columns

```text
Recorded At
Sensor Code
Sensor Role
Temperature
Humidity
Quality Status
Source
Action
```

## 9.5 Detail Dialog

Ketika klik detail:

```text
Sensor Reading Detail
- Sensor code
- Sensor role
- Temperature
- Humidity
- Recorded at
- Quality status
- Raw payload if available
```

---

# 10. Halaman 3 — Predictions

## 10.1 Tujuan Halaman

Menampilkan riwayat prediksi suhu S2.

## 10.2 Wireframe

```text
+--------------------------------------------------------------+
| Predictions                                                  |
| Hasil prediksi suhu S2 menggunakan model LSTM                 |
+--------------------------------------------------------------+
| [Latest Prediction Card] [Model Version Card] [Horizon Card] |
+--------------------------------------------------------------+
| Actual S2 vs Predicted S2 Chart                              |
+--------------------------------------------------------------+
| Filter: [Date From] [Date To] [Status] [Go]                  |
+--------------------------------------------------------------+
| Table                                                        |
| Created | Predicted For | Predicted Temp | Status | Model     |
+--------------------------------------------------------------+
```

## 10.3 Prediction Table Columns

```text
Created At
Predicted For
Target Sensor
Predicted Temperature
Input Window
Horizon
Status
Model Version
Action
```

## 10.4 Prediction Detail Dialog

Isi:

1. Prediction ID.
2. Model version.
3. Target sensor.
4. Input start.
5. Input end.
6. Input window size.
7. Horizon.
8. Predicted for.
9. Predicted temperature.
10. Status.
11. Related anomaly event.

---

# 11. Halaman 4 — Anomalies

## 11.1 Tujuan Halaman

Menampilkan riwayat status waspada dan anomali.

## 11.2 Wireframe

```text
+--------------------------------------------------------------+
| Anomaly History                                              |
| Riwayat status waspada dan anomali berdasarkan prediksi S2    |
+--------------------------------------------------------------+
| Summary: [Waspada Today] [Anomali Today] [Trouble Today]     |
+--------------------------------------------------------------+
| Filter: [Status] [Date From] [Date To] [Notification] [Go]   |
+--------------------------------------------------------------+
| Table                                                        |
| Time | Sensor | Status | Predicted | Actual | Notification   |
+--------------------------------------------------------------+
```

## 11.3 Summary Cards

1. Waspada Today.
2. Anomali Today.
3. Sensor Trouble Today.
4. Last Alert Time.

## 11.4 Table Columns

```text
Detected At
Sensor
Status
Predicted Temperature
Actual Temperature
Threshold
Description
Notification Status
Action
```

## 11.5 Detail Anomaly Dialog

```text
Anomaly Detail
- Status
- Sensor
- Predicted temperature
- Actual temperature
- Threshold normal
- Threshold anomaly
- Prediction time
- Detected time
- Description
- Telegram notification status
```

---

# 12. Halaman 5 — Model Evaluation

## 12.1 Tujuan Halaman

Menampilkan evaluasi LSTM dan perbandingan dengan baseline sederhana.

## 12.2 Wireframe

```text
+--------------------------------------------------------------+
| Model Evaluation                                             |
| Evaluasi performa LSTM dan baseline sederhana                 |
+--------------------------------------------------------------+
| [RMSE Card] [MAE Card] [MAPE Card] [Model Version Card]      |
+--------------------------------------------------------------+
| LSTM vs Baseline Comparison Table                            |
+--------------------------------------------------------------+
| Actual vs Predicted Chart                                    |
+--------------------------------------------------------------+
| Training History / Error Chart optional                      |
+--------------------------------------------------------------+
```

## 12.3 Metric Cards

```text
RMSE : 0.84°C  — Lower is better
MAE  : 0.62°C  — Average absolute error
MAPE : 2.15%   — Percentage error
```

## 12.4 Baseline Comparison Table

Kolom:

```text
Method
RMSE
MAE
MAPE
Notes
```

Rows:

```text
LSTM
Persistence
Moving Average
```

Tooltip:

1. RMSE memberi penalti lebih besar pada error besar.
2. MAE menunjukkan rata-rata kesalahan absolut dalam °C.
3. MAPE menunjukkan error dalam persentase.

---

# 13. Halaman 6 — Sensor Layout

## 13.1 Tujuan Halaman

Menampilkan posisi sensor pada gambar layout server testbed. Fitur ini mendukung visualisasi posisi sensor S1 dan S2, sehingga pengguna dapat memahami lokasi sensor yang sedang normal, waspada, anomali, atau trouble.

## 13.2 Wireframe

```text
+--------------------------------------------------------------+
| Sensor Layout                                                |
| Visualisasi posisi sensor pada server testbed                 |
+--------------------------------------------------------------+
| [Upload Layout Button] [Save Position Button]                |
+--------------------------------------------------------------+
|                                                              |
|  +--------------------------------------------------------+  |
|  |                                                        |  |
|  |       [S1 Normal Marker]                               |  |
|  |                                                        |  |
|  |                         [Laptop / Server Testbed]      |  |
|  |                                  [S2 Waspada Marker]   |  |
|  |                                                        |  |
|  +--------------------------------------------------------+  |
|                                                              |
+--------------------------------------------------------------+
| Sensor Legend: Normal | Waspada | Anomali | Trouble          |
+--------------------------------------------------------------+
```

## 13.3 Marker Sensor

Setiap marker menampilkan:

1. Sensor code: S1/S2.
2. Role: ambient/hotspot.
3. Status.
4. Suhu terakhir.
5. Kelembaban terakhir.
6. Tooltip detail.

Contoh marker:

```text
S2
31.4°C
Waspada
```

## 13.4 Layout Editor

Fitur:

1. Upload gambar layout.
2. Drag marker S1.
3. Drag marker S2.
4. Save posisi marker.
5. Reset posisi.
6. Preview status.

Jika drag-and-drop terlalu lama, buat layout sensor statis terlebih dahulu dengan posisi dari database atau input X/Y.

---

# 14. Halaman 7 — Notifications

## 14.1 Tujuan Halaman

Menampilkan riwayat notifikasi Telegram.

## 14.2 Wireframe

```text
+--------------------------------------------------------------+
| Notifications                                                |
| Riwayat pengiriman notifikasi Telegram                       |
+--------------------------------------------------------------+
| [Test Telegram Button] [Filter Status] [Date From] [Date To] |
+--------------------------------------------------------------+
| Table                                                        |
| Time | Channel | Status | Message | Error | Action            |
+--------------------------------------------------------------+
```

## 14.3 Notification Table Columns

```text
Created At
Channel
Recipient
Status
Message Preview
Sent At
Error Message
Action
```

Status:

```text
pending
sent
failed
skipped
```

## 14.4 Test Telegram Dialog

```text
Test Telegram Notification
Message:
[Input message]

[Cancel] [Send Test]
```

Setelah berhasil:

```text
Toast: Telegram test notification sent.
```

Jika gagal:

```text
Alert: Telegram notification failed. Check bot token and chat ID.
```

---

# 15. Halaman 8 — Settings

## 15.1 Tujuan Halaman

Mengatur threshold dan konfigurasi dasar sistem.

## 15.2 Wireframe

```text
+--------------------------------------------------------------+
| Settings                                                     |
| Konfigurasi threshold dan notifikasi                         |
+--------------------------------------------------------------+
| Thermal Threshold                                            |
| Normal Max Temperature     [30]                              |
| Anomaly Min Temperature    [32]                              |
+--------------------------------------------------------------+
| Prediction Setting                                           |
| Window Size                [30]                              |
| Prediction Horizon         [5]                               |
| Sampling Interval          [60]                              |
+--------------------------------------------------------------+
| Notification Setting                                         |
| Telegram Enabled           [toggle]                          |
| Cooldown Minutes           [5]                               |
| [Test Telegram] [Save]                                       |
+--------------------------------------------------------------+
```

## 15.3 Settings Fields

| Field | Default | Keterangan |
|---|---:|---|
| normal_max_temperature | 30 | Batas maksimum normal |
| anomaly_min_temperature | 32 | Batas minimum anomali |
| window_size | 30 | Jumlah data historis |
| prediction_horizon_minutes | 5 | Horizon prediksi |
| sampling_interval_seconds | 60 | Interval sampling |
| telegram_enabled | true | Status Telegram |
| notification_cooldown_minutes | 5 | Cooldown notifikasi |

## 15.4 Validation UI

Aturan validasi:

1. `anomaly_min_temperature` harus lebih besar dari `normal_max_temperature`.
2. `window_size` harus lebih dari 0.
3. `prediction_horizon_minutes` harus lebih dari 0.
4. `sampling_interval_seconds` harus lebih dari 0.
5. Cooldown harus lebih dari 0.

Jika invalid:

```text
Alert: Anomaly threshold must be greater than normal threshold.
```

---

# 16. Halaman 9 — System Logs

## 16.1 Tujuan Halaman

Menampilkan log sistem dari gateway, backend, ML worker, atau frontend.

## 16.2 Wireframe

```text
+--------------------------------------------------------------+
| System Logs                                                  |
| Catatan error dan aktivitas sistem                           |
+--------------------------------------------------------------+
| Filter: [Source] [Level] [Date From] [Date To] [Go]          |
+--------------------------------------------------------------+
| Table                                                        |
| Time | Source | Level | Message | Context                    |
+--------------------------------------------------------------+
```

## 16.3 Table Columns

```text
Created At
Source
Level
Message
Context
```

Source:

```text
gateway
backend
ml-worker
frontend
```

Level:

```text
info
warning
error
```

---

# 17. Loading, Empty, and Error State

## 17.1 Loading State

Gunakan Skeleton dari shadcn/ui.

Contoh:

```text
Loading dashboard data...
```

## 17.2 Empty State

Sensor data kosong:

```text
No sensor data available.
Start the Raspberry Pi gateway or run simulator mode.
```

Prediksi kosong:

```text
No prediction available.
Collect enough sensor data and run ML Worker inference.
```

Evaluasi kosong:

```text
No model evaluation available.
Run ML Worker training and evaluation first.
```

Anomali kosong:

```text
No anomaly detected.
Thermal condition is currently normal or no prediction has been made.
```

## 17.3 Error State

API error:

```text
Unable to connect to backend API.
Check whether Go backend is running on port 8080.
```

SSE disconnected:

```text
Realtime connection disconnected.
Dashboard will fallback to polling.
```

Model not ready:

```text
LSTM model is not ready.
Please collect enough data and run model training.
```

Sensor trouble:

```text
Sensor trouble detected.
Check sensor wiring, RS485 connection, or gateway logs.
```

---

# 18. Responsive Behavior

## 18.1 Desktop

```text
Sidebar fixed left
Topbar top
Content grid 3 or 4 columns
Charts two columns
Tables full width
```

## 18.2 Tablet

```text
Sidebar collapsible
Cards two columns
Charts one column or two columns
```

## 18.3 Mobile

Mobile bukan target utama, tetapi dashboard harus tetap terbaca.

```text
Sidebar as Sheet
Cards one column
Charts one column
Tables horizontally scrollable
```

---

# 19. API Mapping per Halaman

| Halaman | Endpoint Utama |
|---|---|
| Dashboard | `GET /api/v1/dashboard/summary`, `GET /api/v1/events` |
| Sensor Readings | `GET /api/v1/readings/history`, `GET /api/v1/sensors` |
| Predictions | `GET /api/v1/predictions/latest`, `GET /api/v1/predictions/history` |
| Anomalies | `GET /api/v1/anomalies`, `GET /api/v1/anomalies/:id` |
| Model Evaluation | `GET /api/v1/model-metrics/latest`, `GET /api/v1/model-comparison/latest` |
| Sensor Layout | `GET /api/v1/layout`, `PUT /api/v1/layout/sensors/:id/position` |
| Notifications | `GET /api/v1/notifications`, `POST /api/v1/notifications/test` |
| Settings | `GET /api/v1/settings`, `PUT /api/v1/settings/:key` |
| System Logs | `GET /api/v1/system-logs` |

---

# 20. TypeScript Types

## 20.1 Sensor Reading

```ts
export type SensorCode = "S1" | "S2";
export type SensorRole = "ambient" | "hotspot";
export type QualityStatus = "valid" | "invalid" | "timeout" | "simulated";

export type SensorReading = {
  sensor_id?: number;
  sensor_code: SensorCode;
  sensor_role: SensorRole;
  temperature: number;
  humidity: number;
  quality_status: QualityStatus;
  recorded_at: string;
};
```

## 20.2 Thermal Status

```ts
export type ThermalStatus = "normal" | "waspada" | "anomali" | "trouble";
```

## 20.3 Prediction

```ts
export type Prediction = {
  id: number;
  target_sensor: "S2";
  predicted_temperature: number;
  prediction_horizon_minutes: number;
  input_window_size: number;
  predicted_for: string;
  status: ThermalStatus;
  model_version: string;
  created_at: string;
};
```

## 20.4 Anomaly

```ts
export type AnomalyEvent = {
  id: number;
  sensor_code: "S2";
  status: ThermalStatus;
  predicted_temperature: number;
  actual_temperature?: number;
  threshold_normal_max?: number;
  threshold_anomaly_min?: number;
  description?: string;
  detected_at: string;
  notification_status?: "pending" | "sent" | "failed" | "skipped";
};
```

## 20.5 Model Metrics

```ts
export type ModelMetrics = {
  model_version: string;
  rmse: number;
  mae: number;
  mape: number;
  dataset_start_at?: string;
  dataset_end_at?: string;
  train_size?: number;
  test_size?: number;
  created_at: string;
};
```

---

# 21. Chart Requirements

## 21.1 General Chart Rule

1. Chart harus memiliki title.
2. Chart harus memiliki axis label.
3. Chart harus memiliki tooltip.
4. Chart harus memiliki legend.
5. Chart harus menangani empty data.
6. Chart tidak boleh terlalu ramai.

## 21.2 Temperature Chart

Data:

```text
timestamp
temperature_s1
temperature_s2
```

Legend:

```text
S1 Ambient
S2 Hotspot
```

## 21.3 Humidity Chart

Data:

```text
timestamp
humidity_s1
humidity_s2
```

Legend:

```text
S1 Humidity
S2 Humidity
```

## 21.4 Actual vs Prediction Chart

Data:

```text
timestamp
actual_temperature_s2
predicted_temperature_s2
normal_threshold
anomaly_threshold
```

Legend:

```text
Actual S2
Predicted S2
Normal Threshold
Anomaly Threshold
```

## 21.5 Model Comparison Chart

Data:

```text
method
rmse
mae
mape
```

Methods:

```text
LSTM
Persistence
Moving Average
```

---

# 22. UX Copywriting

Gunakan bahasa Inggris untuk label teknis dashboard agar selaras dengan nama variabel dan API. Penjelasan skripsi tetap menggunakan bahasa Indonesia.

| Indonesia | Label UI |
|---|---|
| Suhu S1 | S1 Temperature |
| Kelembaban S1 | S1 Humidity |
| Suhu S2 | S2 Temperature |
| Kelembaban S2 | S2 Humidity |
| Prediksi Suhu S2 | Predicted S2 Temperature |
| Status Termal | Thermal Status |
| Riwayat Anomali | Anomaly History |
| Evaluasi Model | Model Evaluation |
| Layout Sensor | Sensor Layout |
| Notifikasi | Notifications |

---

# 23. Accessibility

Kebutuhan minimal:

1. Kontras warna cukup.
2. Badge status tidak hanya mengandalkan warna, tetapi juga teks.
3. Button memiliki label jelas.
4. Table memiliki header.
5. Form input memiliki label.
6. Dialog dapat ditutup.
7. Loading dan error state jelas.

---

# 24. Frontend Environment

## 24.1 `.env.example`

```env
VITE_API_BASE_URL=http://localhost:8080/api/v1
VITE_SSE_URL=http://localhost:8080/api/v1/events
VITE_APP_NAME=EMS Thermal Monitoring
```

## 24.2 Package Recommendation

```json
{
  "dependencies": {
    "@vitejs/plugin-react": "latest",
    "vite": "latest",
    "react": "latest",
    "react-dom": "latest",
    "typescript": "latest",
    "tailwindcss": "latest",
    "chart.js": "latest",
    "react-chartjs-2": "latest",
    "lucide-react": "latest",
    "class-variance-authority": "latest",
    "clsx": "latest",
    "tailwind-merge": "latest"
  }
}
```

Catatan: shadcn/ui komponen biasanya ditambahkan melalui CLI dan menghasilkan file komponen lokal.

---

# 25. Command Setup Frontend

Contoh setup:

```bash
npm create vite@latest frontend-dashboard -- --template react-ts
cd frontend-dashboard
npm install
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
npx shadcn@latest init
npm install chart.js react-chartjs-2 lucide-react
npm run dev
```

Catatan: command shadcn/ui bisa berubah sesuai versi CLI. AI agent harus mengikuti dokumentasi shadcn/ui terbaru saat implementasi, tetapi tetap menjaga stack React + Vite + Tailwind.

---

# 26. MVP UI Scope

## 26.1 MVP Must Have

1. Main Dashboard.
2. Sensor Readings.
3. Predictions.
4. Anomalies.
5. Model Evaluation.
6. Settings minimal.
7. Notifications minimal.

## 26.2 MVP Components

1. Sensor cards.
2. Prediction card.
3. Thermal status card.
4. Temperature chart.
5. Actual vs prediction chart.
6. Recent anomaly table.
7. Model metrics card.
8. Telegram notification table.

## 26.3 Nice to Have

1. Drag-and-drop sensor layout.
2. Dark mode.
3. Export CSV.
4. Advanced filters.
5. Upload layout image.

Jika drag-and-drop terlalu lama, buat layout sensor statis terlebih dahulu dengan posisi dari database.

---

# 27. UI Acceptance Criteria

UI dianggap selesai apabila:

```text
[ ] Frontend menggunakan React + Vite + TypeScript
[ ] Tailwind CSS aktif
[ ] shadcn/ui terpasang dan digunakan
[ ] Chart.js menampilkan grafik
[ ] Dashboard utama tampil
[ ] Sidebar dan topbar tampil
[ ] Card S1 temperature tampil
[ ] Card S1 humidity tampil
[ ] Card S2 temperature tampil
[ ] Card S2 humidity tampil
[ ] Card predicted S2 temperature tampil
[ ] Card thermal status tampil
[ ] Grafik suhu tampil
[ ] Grafik kelembaban tampil
[ ] Grafik actual vs prediction tampil
[ ] Tabel anomaly terbaru tampil
[ ] Model evaluation menampilkan RMSE/MAE/MAPE
[ ] Baseline comparison tampil
[ ] Sensor layout menampilkan S1 dan S2
[ ] Status marker normal/waspada/anomali/trouble tampil
[ ] Notifications page menampilkan riwayat Telegram
[ ] Settings page menampilkan threshold
[ ] UI menangani loading state
[ ] UI menangani empty state
[ ] UI menangani API error
[ ] UI dapat menerima update SSE atau fallback polling
[ ] UI responsif untuk layar laptop
```

---

# 28. Instruksi Implementasi untuk AI Agent

AI agent harus mengikuti instruksi berikut:

1. Gunakan React + Vite + TypeScript.
2. Gunakan Tailwind CSS.
3. Gunakan shadcn/ui untuk komponen UI utama.
4. Gunakan Chart.js untuk grafik.
5. Buat layout custom, bukan template mentah.
6. Buat API client terpusat.
7. Buat TypeScript types untuk response API.
8. Buat reusable components untuk card, chart, table, badge, dan layout.
9. Buat loading state, empty state, dan error state.
10. Buat SSE client.
11. Jika SSE gagal, gunakan fallback polling.
12. Prioritaskan dashboard, readings, predictions, anomalies, evaluation.
13. Buat README frontend.
14. Pastikan dashboard bisa menjelaskan alur skripsi: sensor → data → prediksi → status → alert.
15. Jangan menambahkan PUE.
16. Jangan menambahkan kontrol pendingin.
17. Jangan mengubah target prediksi dari S2.

---

# 29. README Frontend Minimum

File `frontend-dashboard/README.md` minimal berisi:

1. Deskripsi dashboard.
2. Stack frontend.
3. Cara install dependency.
4. Cara setup `.env`.
5. Cara menjalankan dashboard.
6. Daftar halaman.
7. API yang digunakan.
8. Cara test SSE.
9. Troubleshooting umum.
10. Catatan bahwa dashboard tidak melakukan prediksi langsung, hanya menampilkan data dari backend/database.

---

## 30. Ringkasan Final UI

```text
Frontend       : React + Vite + TypeScript
Styling        : Tailwind CSS
UI Component   : shadcn/ui
Chart          : Chart.js
Realtime       : SSE
Main Page      : Dashboard
Core Data      : S1, S2, prediction S2, anomaly status, metrics
Status         : normal, waspada, anomali, trouble
Visual Feature : sensor layout map
Important Pages:
- Dashboard
- Sensor Readings
- Predictions
- Anomalies
- Model Evaluation
- Sensor Layout
- Notifications
- Settings
- System Logs
Batasan:
- tidak PUE
- tidak kontrol pendingin
- tidak mengubah target prediksi S2
```
