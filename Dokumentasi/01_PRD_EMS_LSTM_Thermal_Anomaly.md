# 01 PRD — EMS LSTM Thermal Anomaly Monitoring System

**Judul Skripsi:** Prediksi Anomali Termal pada Environment Monitoring System Server Menggunakan Algoritma Long Short-Term Memory  
**Jenis Dokumen:** Product Requirements Document (PRD)  
**Versi:** 1.0  
**Status:** Final untuk dasar pengembangan AI Agent  
**Target Pengguna Dokumen:** Mahasiswa, AI coding agent, developer pendamping, dan reviewer teknis  
**Tanggal:** 2026-05-23  

---

## 1. Ringkasan Produk

**EMS LSTM Thermal Anomaly Monitoring System** adalah sistem Environment Monitoring System (EMS) untuk lingkungan server testbed yang berfungsi memantau suhu dan kelembaban, menyimpan data sensor sebagai data time-series, melakukan prediksi suhu menggunakan algoritma Long Short-Term Memory (LSTM), menentukan status termal berdasarkan threshold operasional, serta mengirim notifikasi ketika sistem mendeteksi kondisi waspada atau anomali.

Sistem ini tidak hanya menampilkan kondisi aktual dari sensor, tetapi juga menghasilkan prediksi suhu pada periode waktu mendatang. Prediksi tersebut digunakan sebagai dasar early warning agar pengguna dapat mengetahui potensi kenaikan suhu sebelum kondisi benar-benar melewati batas yang ditentukan.

Sistem dikembangkan dengan pendekatan perekayasaan/prototyping karena mencakup integrasi perangkat keras, gateway sensor, backend API, database time-series, dashboard real-time, modul machine learning, dan notifikasi.

---

## 2. Latar Belakang Produk

Lingkungan server perlu dipantau karena perangkat server atau server testbed dapat menghasilkan panas selama beroperasi. Suhu yang tidak dipantau dapat menyebabkan penurunan performa, gangguan stabilitas, atau potensi kerusakan perangkat keras.

Sistem monitoring konvensional umumnya bersifat reaktif, yaitu hanya memberikan peringatan ketika nilai sensor telah melewati batas tertentu. Penelitian ini mengembangkan sistem yang lebih prediktif dengan memanfaatkan data historis suhu dan kelembaban sebagai data time-series untuk memprediksi suhu mendatang menggunakan LSTM.

Dengan pendekatan tersebut, sistem diharapkan mampu:

1. Memantau suhu dan kelembaban secara periodik.
2. Menyimpan data historis sebagai data time-series.
3. Melakukan prediksi suhu S2 pada periode mendatang.
4. Mengklasifikasikan kondisi menjadi normal, waspada, atau anomali.
5. Menampilkan informasi aktual dan prediktif melalui dashboard.
6. Memberikan notifikasi early warning melalui Telegram.

---

## 3. Tujuan Produk

Tujuan pengembangan produk adalah:

1. Membangun Environment Monitoring System untuk memantau suhu dan kelembaban pada lingkungan server testbed.
2. Mengakuisisi data dari dua sensor XY-MD02 menggunakan Raspberry Pi gateway.
3. Mengirim data sensor dari gateway ke backend menggunakan HTTP REST API.
4. Menyimpan data sensor ke PostgreSQL sebagai data time-series.
5. Menggunakan TimescaleDB apabila memungkinkan untuk pengelolaan data berbasis timestamp.
6. Menampilkan data aktual melalui dashboard real-time atau mendekati real-time.
7. Membangun model LSTM untuk memprediksi suhu S2 pada horizon waktu mendatang.
8. Membandingkan hasil prediksi LSTM dengan baseline sederhana.
9. Mengevaluasi model menggunakan RMSE, MAE, dan MAPE.
10. Menentukan status termal berdasarkan suhu prediksi S2 dan threshold.
11. Mengirim notifikasi Telegram ketika status berubah menjadi waspada atau anomali.
12. Menyediakan dokumentasi lengkap agar sistem dapat dibuat dari awal sampai selesai oleh AI agent.

---

## 4. Scope Produk

### 4.1 In Scope

Fitur dan komponen yang termasuk dalam pengembangan:

| Area | Scope |
|---|---|
| Sensor | Dua sensor XY-MD02 untuk suhu dan kelembaban |
| Sensor S1 | Ambient/reference sensor |
| Sensor S2 | Hotspot/exhaust sensor dan target utama prediksi |
| Gateway | Raspberry Pi sebagai pembaca sensor dan pengirim data |
| Komunikasi sensor | Modbus RS485 melalui USB RS485 Converter |
| Backend | Go/Golang REST API |
| Real-time update | Server-Sent Events (SSE) |
| Database | PostgreSQL + TimescaleDB apabila memungkinkan |
| ML Worker | Python untuk preprocessing, training, evaluasi, dan inference |
| Model utama | Long Short-Term Memory |
| Baseline | Persistence model dan/atau moving average |
| Dashboard | React + Vite + TypeScript + Tailwind CSS + shadcn/ui |
| Chart | Chart.js sebagai pilihan utama; ECharts opsional |
| Notifikasi | Telegram Bot API |
| Status termal | Normal, waspada, anomali |
| Status sensor | Normal, waspada, anomali, trouble |
| Layout sensor | Visualisasi posisi sensor pada layout server testbed |
| Pengujian | Sensor, gateway, API, database, dashboard, ML, alert, integrasi |
| Deployment development | Local laptop dengan opsi Docker Compose |
| Simulator | Simulator data sensor untuk development ketika hardware belum tersambung |

### 4.2 Out of Scope

Hal-hal yang tidak termasuk dalam versi penelitian ini:

| Area | Keterangan |
|---|---|
| Kontrol pendingin otomatis | Sistem tidak menghidupkan/mematikan kipas atau AC |
| Optimasi energi | Sistem tidak melakukan optimasi konsumsi daya |
| Pengukuran PUE aktual | Sistem tidak menghitung PUE aktual |
| Prediksi multi-sensor terpisah | Target utama prediksi adalah suhu S2 |
| Model utama selain LSTM | Model lain hanya boleh menjadi baseline/pembanding |
| Training di Raspberry Pi | Raspberry Pi hanya sebagai gateway |
| Sistem enterprise data center | Sistem dibatasi pada server testbed atau ruang server kecil-menengah |
| Mobile app | Dashboard web sudah cukup |
| Multi-user kompleks | Admin sederhana cukup untuk versi skripsi |
| Auto remediation | Sistem hanya monitoring, prediksi, klasifikasi, dan notifikasi |

---

## 5. Target Pengguna

### 5.1 Administrator / Pengguna Sistem

Pengguna utama sistem adalah administrator atau pengguna yang memantau lingkungan server testbed.

Kebutuhan pengguna:

1. Melihat suhu dan kelembaban terbaru.
2. Melihat grafik suhu dan kelembaban historis.
3. Melihat prediksi suhu S2.
4. Mengetahui status normal, waspada, atau anomali.
5. Melihat lokasi sensor pada layout testbed.
6. Melihat riwayat anomali dan notifikasi.
7. Menerima notifikasi Telegram saat ada potensi gangguan termal.
8. Melihat metrik evaluasi model LSTM.

### 5.2 Peneliti / Mahasiswa

Kebutuhan peneliti:

1. Mengumpulkan dataset sensor.
2. Melakukan preprocessing data time-series.
3. Melatih dan mengevaluasi model LSTM.
4. Membandingkan LSTM dengan baseline sederhana.
5. Menggunakan hasil sistem untuk Bab 4 implementasi dan pengujian.
6. Mendokumentasikan arsitektur, pengujian, dan hasil evaluasi sistem.

### 5.3 AI Coding Agent

Kebutuhan AI agent:

1. Memahami scope skripsi.
2. Mengikuti dokumen requirement.
3. Membuat program secara bertahap.
4. Tidak mengubah stack utama tanpa alasan kuat.
5. Menyediakan kode, konfigurasi, dokumentasi, dan instruksi setup.
6. Menjaga agar implementasi tetap realistis untuk skripsi.

---

## 6. Stack Teknologi Final

### 6.1 Hardware

| Komponen | Fungsi |
|---|---|
| Laptop / mini PC | Server testbed / objek uji |
| Raspberry Pi | Gateway pembaca sensor |
| Sensor XY-MD02 S1 | Sensor ambient/reference |
| Sensor XY-MD02 S2 | Sensor hotspot/exhaust |
| USB RS485 Converter | Penghubung sensor RS485 ke Raspberry Pi |
| Kabel RS485 | Jalur komunikasi sensor |
| Jaringan lokal | Komunikasi Raspberry Pi, backend, dan dashboard |
| Laptop pengembangan | Menjalankan backend, database, dashboard, dan ML worker |

### 6.2 Software

| Komponen | Teknologi |
|---|---|
| Gateway sensor | Python |
| Backend API | Go/Golang |
| Database | PostgreSQL |
| Time-series extension | TimescaleDB apabila memungkinkan |
| ML Worker | Python |
| LSTM library | TensorFlow/Keras |
| Data processing | Pandas, NumPy, Scikit-learn |
| Dashboard | React + Vite + TypeScript |
| Styling | Tailwind CSS |
| UI Components | shadcn/ui |
| Chart | Chart.js utama, ECharts opsional |
| Real-time | Server-Sent Events |
| Notification | Telegram Bot API |
| Deployment local | Docker Compose opsional |
| API testing | Postman/Thunder Client/curl |
| Version control | Git |

---

## 7. Arsitektur Produk

### 7.1 Arsitektur Umum

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

### 7.2 Alur Data

```text
Sensor membaca suhu dan kelembaban
        ↓
Raspberry Pi membaca sensor via Modbus RS485
        ↓
Raspberry Pi membentuk payload JSON
        ↓
Gateway mengirim data ke Go backend
        ↓
Backend melakukan validasi data
        ↓
Data disimpan ke PostgreSQL/TimescaleDB
        ↓
Dashboard menerima data terbaru melalui SSE/API
        ↓
ML Worker mengambil data historis
        ↓
ML Worker melakukan preprocessing dan prediksi LSTM
        ↓
Hasil prediksi disimpan ke database
        ↓
Sistem menentukan status normal/waspada/anomali
        ↓
Dashboard menampilkan status dan grafik
        ↓
Telegram dikirim jika status waspada/anomali
```

---

## 8. Modul Produk

## 8.1 Modul Gateway Sensor

### Deskripsi

Modul gateway berjalan di Raspberry Pi. Modul ini membaca data dari dua sensor XY-MD02 melalui USB RS485 Converter menggunakan protokol Modbus RTU. Setelah data terbaca, gateway membentuk payload JSON dan mengirimkannya ke backend.

### Fitur

1. Membaca sensor S1.
2. Membaca sensor S2.
3. Memberikan timestamp.
4. Membentuk payload JSON.
5. Mengirim data ke REST API backend.
6. Menangani sensor timeout.
7. Menangani data tidak valid.
8. Menyimpan log lokal apabila backend tidak tersedia.
9. Menyediakan mode simulator jika hardware belum tersambung.

### Contoh Payload

```json
{
  "gateway_id": "raspi-gateway-01",
  "recorded_at": "2026-05-23T14:30:00+07:00",
  "readings": [
    {
      "sensor_code": "S1",
      "sensor_role": "ambient",
      "temperature": 27.4,
      "humidity": 63.2
    },
    {
      "sensor_code": "S2",
      "sensor_role": "hotspot",
      "temperature": 30.8,
      "humidity": 58.5
    }
  ]
}
```

### Acceptance Criteria

| Kode | Kriteria |
|---|---|
| AC-GW-001 | Gateway dapat membaca dua sensor |
| AC-GW-002 | Gateway dapat mengirim payload JSON ke backend |
| AC-GW-003 | Gateway mencatat error jika sensor timeout |
| AC-GW-004 | Gateway tidak mengirim data kosong/tidak valid sebagai data utama |
| AC-GW-005 | Gateway memiliki mode simulator untuk development |

---

## 8.2 Modul Backend API

### Deskripsi

Backend dibuat menggunakan Go/Golang. Backend menerima data dari Raspberry Pi, melakukan validasi, menyimpan data ke database, menyediakan API untuk dashboard, menyediakan SSE, serta memicu notifikasi.

### Fitur

1. REST API penerimaan data sensor.
2. Validasi payload sensor.
3. Penyimpanan data time-series.
4. API data terbaru.
5. API data historis.
6. API hasil prediksi.
7. API anomali.
8. API evaluasi model.
9. API layout sensor.
10. SSE untuk update dashboard.
11. Endpoint health check.
12. API token sederhana untuk gateway.
13. Trigger notifikasi Telegram.

### Endpoint Awal

```text
POST   /api/v1/readings
GET    /api/v1/readings/latest
GET    /api/v1/readings/history?sensor_code=&from=&to=
GET    /api/v1/dashboard/summary
GET    /api/v1/predictions/latest
GET    /api/v1/predictions/history?from=&to=
GET    /api/v1/anomalies
GET    /api/v1/model-metrics/latest
GET    /api/v1/baselines/latest
GET    /api/v1/layout
PUT    /api/v1/layout/sensors/:id/position
GET    /api/v1/events
GET    /api/v1/health
```

### Acceptance Criteria

| Kode | Kriteria |
|---|---|
| AC-BE-001 | Backend menerima payload sensor dari gateway |
| AC-BE-002 | Backend menolak payload tidak valid |
| AC-BE-003 | Backend menyimpan data valid ke database |
| AC-BE-004 | Backend menyediakan data terbaru untuk dashboard |
| AC-BE-005 | Backend menyediakan SSE untuk data real-time |
| AC-BE-006 | Backend menggunakan token sederhana untuk endpoint gateway |
| AC-BE-007 | Backend tetap berjalan meskipun Telegram gagal |

---

## 8.3 Modul Database

### Deskripsi

Database menggunakan PostgreSQL sebagai penyimpanan utama. TimescaleDB digunakan apabila memungkinkan untuk optimasi data time-series.

### Data yang Disimpan

1. Gateway.
2. Sensor.
3. Data sensor.
4. Hasil prediksi.
5. Status termal.
6. Anomali.
7. Model version.
8. Metrik evaluasi.
9. Baseline result.
10. Layout dashboard.
11. Posisi sensor.
12. Notifikasi.
13. Log sistem.

### Tabel Awal

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
```

### Acceptance Criteria

| Kode | Kriteria |
|---|---|
| AC-DB-001 | Data sensor tersimpan dengan timestamp |
| AC-DB-002 | Data memiliki relasi ke sensor S1/S2 |
| AC-DB-003 | Data prediksi tersimpan |
| AC-DB-004 | Data anomali tersimpan |
| AC-DB-005 | Metrik evaluasi model tersimpan |
| AC-DB-006 | Layout sensor dapat disimpan dan diambil ulang |
| AC-DB-007 | Database memiliki index timestamp untuk query time-series |

---

## 8.4 Modul ML Worker

### Deskripsi

ML Worker dibuat menggunakan Python. Modul ini bertugas melakukan preprocessing, training LSTM, baseline comparison, evaluasi model, dan inference.

### Fitur

1. Mengambil data sensor dari database.
2. Validasi timestamp.
3. Penanganan missing value.
4. Penanganan nilai tidak wajar.
5. Normalisasi data.
6. Pembentukan window data.
7. Split data kronologis.
8. Training model LSTM.
9. Evaluasi RMSE, MAE, MAPE.
10. Baseline persistence model.
11. Baseline moving average.
12. Simpan model.
13. Inference prediksi suhu S2.
14. Simpan prediksi ke database.
15. Simpan status termal.
16. Simpan hasil evaluasi.
17. Menyediakan script replay dataset untuk demo.

### Parameter Awal

| Parameter | Nilai Awal |
|---|---|
| Input feature | temperature_s1, humidity_s1, temperature_s2, humidity_s2 |
| Target | temperature_s2 future |
| Sampling interval | 1 menit |
| Window input | 30 data terakhir |
| Horizon prediksi | 5 menit ke depan |
| Split data | Kronologis |
| Metric | RMSE, MAE, MAPE |
| Baseline | Persistence, moving average |

### Acceptance Criteria

| Kode | Kriteria |
|---|---|
| AC-ML-001 | Worker dapat mengambil dataset dari database |
| AC-ML-002 | Worker dapat melakukan preprocessing |
| AC-ML-003 | Worker dapat membentuk window input |
| AC-ML-004 | Worker dapat melatih LSTM |
| AC-ML-005 | Worker menyimpan model |
| AC-ML-006 | Worker menghasilkan prediksi suhu S2 |
| AC-ML-007 | Worker menghitung RMSE, MAE, MAPE |
| AC-ML-008 | Worker membandingkan LSTM dengan baseline |
| AC-ML-009 | Worker menyimpan prediksi dan metrik ke database |

---

## 8.5 Modul Dashboard

### Deskripsi

Dashboard dibuat menggunakan React + Vite + TypeScript + Tailwind CSS + shadcn/ui. Dashboard menampilkan informasi aktual, historis, prediksi, status termal, anomali, layout sensor, dan evaluasi model.

### Prinsip UI

1. Clean.
2. Modern.
3. Responsif.
4. Mudah dijelaskan.
5. Tidak menggunakan template mentah.
6. Menggunakan shadcn/ui untuk komponen konsisten.
7. Menggunakan Tailwind CSS untuk styling.
8. Menggunakan Chart.js untuk grafik utama.

### Halaman Dashboard

1. Login page sederhana atau akses dashboard lokal.
2. Main dashboard.
3. Sensor readings.
4. Historical chart.
5. Prediction page.
6. Anomaly history.
7. Model evaluation.
8. Sensor layout editor.
9. Notification history.
10. Settings.

### Komponen UI shadcn/ui

| Komponen | Penggunaan |
|---|---|
| Card | Ringkasan suhu, kelembaban, status |
| Badge | Status normal/waspada/anomali/trouble |
| Table | Data sensor, prediksi, anomali |
| Button | Aksi refresh, simpan layout, test Telegram |
| Tabs | Pemisahan grafik aktual, prediksi, evaluasi |
| Dialog | Detail sensor atau detail anomali |
| Select | Filter sensor/status |
| Input | Filter tanggal/keyword |
| Toast | Notifikasi UI |
| Tooltip | Keterangan metrik dan status |
| Sheet | Sidebar mobile |
| Alert | Pesan sistem/error |

### Dashboard Utama

Dashboard utama harus menampilkan:

1. Card suhu S1.
2. Card kelembaban S1.
3. Card suhu S2.
4. Card kelembaban S2.
5. Card prediksi suhu S2.
6. Card status termal.
7. Grafik suhu S1 dan S2.
8. Grafik kelembaban S1 dan S2.
9. Grafik aktual vs prediksi S2.
10. Layout sensor.
11. Tabel anomali terbaru.
12. Riwayat notifikasi terbaru.
13. Metrik evaluasi model terbaru.

### Acceptance Criteria

| Kode | Kriteria |
|---|---|
| AC-UI-001 | Dashboard tampil dengan React + Tailwind + shadcn/ui |
| AC-UI-002 | Dashboard menampilkan suhu/kelembaban S1 dan S2 |
| AC-UI-003 | Dashboard menampilkan prediksi suhu S2 |
| AC-UI-004 | Dashboard menampilkan status normal/waspada/anomali |
| AC-UI-005 | Dashboard menampilkan layout sensor |
| AC-UI-006 | Dashboard menampilkan grafik aktual vs prediksi |
| AC-UI-007 | Dashboard menampilkan riwayat anomali |
| AC-UI-008 | Dashboard menampilkan metrik evaluasi |
| AC-UI-009 | Dashboard menerima update melalui SSE/API |

---

## 8.6 Modul Status Termal dan Anomali

### Deskripsi

Modul ini menentukan status termal berdasarkan suhu prediksi S2 dan threshold operasional penelitian.

### Threshold Awal

| Status | Kriteria Suhu Prediksi S2 |
|---|---|
| Normal | suhu_prediksi_s2 < 30°C |
| Waspada | suhu_prediksi_s2 >= 30°C dan <= 32°C |
| Anomali | suhu_prediksi_s2 > 32°C |

### Status Sensor

| Status | Keterangan |
|---|---|
| Normal | Sensor terbaca dan kondisi aman |
| Waspada | Suhu prediksi mendekati batas |
| Anomali | Suhu prediksi melewati threshold anomali |
| Trouble | Sensor timeout, tidak terbaca, atau data tidak valid |

### Acceptance Criteria

| Kode | Kriteria |
|---|---|
| AC-STAT-001 | Sistem dapat menentukan status normal |
| AC-STAT-002 | Sistem dapat menentukan status waspada |
| AC-STAT-003 | Sistem dapat menentukan status anomali |
| AC-STAT-004 | Sistem dapat menentukan sensor trouble |
| AC-STAT-005 | Status tampil di dashboard |
| AC-STAT-006 | Status tersimpan sebagai riwayat anomali/status |

---

## 8.7 Modul Telegram Notification

### Deskripsi

Telegram digunakan untuk mengirim notifikasi ketika status berubah menjadi waspada atau anomali.

### Trigger

1. Status termal berubah dari normal ke waspada.
2. Status termal berubah dari waspada ke anomali.
3. Sensor trouble dalam durasi tertentu.
4. Prediksi suhu S2 melewati threshold anomali.
5. Error sistem penting, apabila diperlukan.

### Format Pesan

```text
[EMS THERMAL ALERT]

Status       : WASPADA
Sensor Acuan : S2 - Hotspot/Exhaust
Prediksi S2  : 31.2°C
Horizon      : 5 menit ke depan
Waktu        : 2026-05-23 14:30:00

Sistem memprediksi suhu mendekati batas operasional.
Silakan cek dashboard EMS untuk monitoring lebih lanjut.
```

### Anti-Spam / Cooldown

1. Notifikasi status yang sama tidak dikirim terus-menerus.
2. Cooldown awal: 5 menit.
3. Jika status naik level dari waspada ke anomali, notifikasi tetap dikirim.
4. Jika status kembali normal, sistem dapat mencatat recovery notification.

### Acceptance Criteria

| Kode | Kriteria |
|---|---|
| AC-TG-001 | Sistem dapat mengirim pesan Telegram |
| AC-TG-002 | Telegram terkirim saat status waspada |
| AC-TG-003 | Telegram terkirim saat status anomali |
| AC-TG-004 | Telegram tidak spam karena cooldown |
| AC-TG-005 | Kegagalan Telegram tidak menghentikan sistem |
| AC-TG-006 | Riwayat notifikasi tersimpan di database |

---

## 9. Kebutuhan Fungsional

| Kode | Kebutuhan |
|---|---|
| FR-001 | Sistem membaca suhu dan kelembaban dari sensor S1 dan S2 |
| FR-002 | Sistem mengirim data sensor dari Raspberry Pi ke backend |
| FR-003 | Backend memvalidasi payload data sensor |
| FR-004 | Backend menyimpan data sensor ke database |
| FR-005 | Sistem menyediakan data terbaru untuk dashboard |
| FR-006 | Sistem menyediakan data historis untuk grafik |
| FR-007 | Sistem menyediakan update real-time menggunakan SSE |
| FR-008 | Sistem menampilkan dashboard monitoring |
| FR-009 | Sistem menampilkan layout posisi sensor |
| FR-010 | Sistem dapat mengubah posisi icon sensor pada layout |
| FR-011 | Sistem melakukan preprocessing data time-series |
| FR-012 | Sistem membentuk window input untuk LSTM |
| FR-013 | Sistem melatih model LSTM |
| FR-014 | Sistem mengevaluasi model dengan RMSE, MAE, MAPE |
| FR-015 | Sistem membuat baseline persistence/moving average |
| FR-016 | Sistem membandingkan performa LSTM dengan baseline |
| FR-017 | Sistem melakukan prediksi suhu S2 |
| FR-018 | Sistem menentukan status normal/waspada/anomali |
| FR-019 | Sistem mencatat riwayat anomali |
| FR-020 | Sistem mengirim Telegram alert |
| FR-021 | Sistem mencatat riwayat notifikasi |
| FR-022 | Sistem menyediakan mode simulator data sensor |
| FR-023 | Sistem menyediakan health check |
| FR-024 | Sistem menyediakan pengaturan threshold dasar |
| FR-025 | Sistem mencatat error sensor/backend/worker |

---

## 10. Kebutuhan Non-Fungsional

| Kode | Kebutuhan |
|---|---|
| NFR-001 | Sistem berjalan pada lingkungan lokal/laptop pengembangan |
| NFR-002 | Interval sampling awal adalah 1 menit |
| NFR-003 | Dashboard menampilkan data real-time atau mendekati real-time |
| NFR-004 | Data time-series harus memiliki timestamp yang valid |
| NFR-005 | Pembagian data training/testing dilakukan kronologis |
| NFR-006 | API gateway menggunakan token sederhana |
| NFR-007 | Sistem tetap berjalan jika Telegram gagal |
| NFR-008 | Sistem menyediakan simulator saat hardware belum tersedia |
| NFR-009 | UI responsif untuk layar laptop |
| NFR-010 | Implementasi harus mudah dijelaskan untuk skripsi |
| NFR-011 | Kode dipisahkan berdasarkan modul |
| NFR-012 | Dokumentasi setup harus tersedia |
| NFR-013 | ML Worker tidak dijalankan di Raspberry Pi |
| NFR-014 | Database memiliki index timestamp |
| NFR-015 | Tidak ada auto-control pendingin |
| NFR-016 | Tidak ada pengukuran PUE aktual |

---

## 11. Data Requirement

### 11.1 Data Sensor

| Field | Keterangan |
|---|---|
| sensor_code | S1 atau S2 |
| sensor_role | ambient atau hotspot |
| temperature | Nilai suhu |
| humidity | Nilai kelembaban |
| recorded_at | Timestamp pembacaan |
| gateway_id | Identitas gateway |
| status | valid, invalid, timeout |

### 11.2 Data Prediksi

| Field | Keterangan |
|---|---|
| model_version_id | Versi model |
| target_sensor | S2 |
| predicted_temperature | Prediksi suhu S2 |
| prediction_horizon_minutes | Horizon prediksi |
| input_window_size | Jumlah data historis |
| predicted_for | Waktu target prediksi |
| created_at | Waktu prediksi dibuat |

### 11.3 Data Anomali

| Field | Keterangan |
|---|---|
| status | normal, waspada, anomali |
| predicted_temperature | Suhu prediksi S2 |
| threshold_normal | Batas normal |
| threshold_warning | Batas waspada |
| description | Keterangan |
| detected_at | Waktu deteksi |
| notification_sent | Status notifikasi |

### 11.4 Data Evaluasi

| Field | Keterangan |
|---|---|
| model_name | Nama model |
| model_version | Versi |
| rmse | Root Mean Square Error |
| mae | Mean Absolute Error |
| mape | Mean Absolute Percentage Error |
| baseline_type | persistence/moving_average |
| evaluation_start | Awal data evaluasi |
| evaluation_end | Akhir data evaluasi |

---

## 12. User Stories

### US-001 — Melihat Kondisi Sensor

Sebagai pengguna, saya ingin melihat suhu dan kelembaban S1 dan S2 agar saya dapat mengetahui kondisi lingkungan server testbed saat ini.

### US-002 — Melihat Prediksi Suhu

Sebagai pengguna, saya ingin melihat prediksi suhu S2 agar saya dapat mengetahui potensi kenaikan suhu pada periode mendatang.

### US-003 — Melihat Status Termal

Sebagai pengguna, saya ingin melihat status normal, waspada, atau anomali agar saya dapat mengambil tindakan pemantauan lebih cepat.

### US-004 — Menerima Notifikasi

Sebagai pengguna, saya ingin menerima Telegram alert ketika status waspada atau anomali agar saya tidak perlu terus membuka dashboard.

### US-005 — Melihat Evaluasi Model

Sebagai peneliti, saya ingin melihat nilai RMSE, MAE, dan MAPE agar saya dapat mengevaluasi performa LSTM.

### US-006 — Membandingkan dengan Baseline

Sebagai peneliti, saya ingin membandingkan LSTM dengan baseline agar saya dapat membuktikan kontribusi model LSTM.

### US-007 — Menggunakan Simulator

Sebagai developer, saya ingin menggunakan simulator data sensor agar sistem dapat dikembangkan walaupun hardware belum tersambung.

### US-008 — Melihat Layout Sensor

Sebagai pengguna, saya ingin melihat posisi sensor pada layout server testbed agar saya dapat memahami lokasi sensor yang mengalami masalah.

---

## 13. Prioritas Fitur

### 13.1 Must Have

1. Gateway membaca/mengirim data sensor.
2. Backend menerima dan menyimpan data.
3. Database time-series.
4. Dashboard suhu dan kelembaban.
5. Grafik suhu/kelembaban.
6. ML Worker training LSTM.
7. Prediksi suhu S2.
8. Status normal/waspada/anomali.
9. Evaluasi RMSE, MAE, MAPE.
10. Baseline sederhana.
11. Telegram alert.
12. Simulator data sensor.
13. Dokumentasi setup.

### 13.2 Should Have

1. SSE real-time.
2. Layout sensor dengan icon status.
3. Riwayat notifikasi.
4. Settings threshold.
5. Replay dataset demo.
6. Export CSV data sensor.
7. Detail anomali.

### 13.3 Could Have

1. Multi-user login.
2. Dark mode dashboard.
3. Export grafik ke gambar.
4. Export laporan PDF.
5. Pengaturan model dari UI.
6. Email notification.
7. Docker production profile.

### 13.4 Won't Have

1. Kontrol kipas otomatis.
2. Kontrol AC otomatis.
3. Perhitungan PUE aktual.
4. Optimasi energi.
5. SIEM.
6. Model selain LSTM sebagai model utama.

---

## 14. Development Milestone

### Milestone 1 — Project Setup

Output:

```text
backend-go/
frontend-dashboard/
gateway/
ml-worker/
database/
docs/
docker-compose.yml
README.md
.env.example
```

### Milestone 2 — Database

Output:

1. PostgreSQL berjalan.
2. TimescaleDB siap jika digunakan.
3. Tabel awal dibuat.
4. Seeder sensor S1/S2 dibuat.
5. Seeder threshold dibuat.

### Milestone 3 — Backend API

Output:

1. API readings.
2. API latest.
3. API history.
4. API dashboard summary.
5. API health.
6. SSE endpoint.

### Milestone 4 — Gateway Sensor

Output:

1. Script baca sensor.
2. Script kirim data.
3. Config Modbus.
4. Mode simulator.
5. Log error gateway.

### Milestone 5 — Dashboard

Output:

1. React Vite TypeScript setup.
2. Tailwind setup.
3. shadcn/ui setup.
4. Layout dashboard.
5. Card sensor.
6. Grafik Chart.js.
7. Tabel anomali.
8. Layout sensor.

### Milestone 6 — ML Worker

Output:

1. Dataset loader.
2. Preprocessing.
3. Window builder.
4. Baseline model.
5. LSTM training.
6. Evaluation.
7. Model saving.
8. Inference script.

### Milestone 7 — Prediction Integration

Output:

1. Prediksi disimpan ke database.
2. Status termal dihitung.
3. Dashboard menampilkan prediksi.
4. Riwayat anomali tampil.
5. Telegram alert terkirim.

### Milestone 8 — Testing & Demo

Output:

1. Test plan.
2. Blackbox testing.
3. Integration testing.
4. ML evaluation result.
5. Demo script.
6. Deployment guide.

---

## 15. Acceptance Criteria Final

Sistem dianggap selesai apabila:

```text
[ ] Gateway dapat membaca atau mensimulasikan data S1 dan S2
[ ] Gateway dapat mengirim data ke backend
[ ] Backend dapat menerima dan memvalidasi data
[ ] Data sensor tersimpan di PostgreSQL
[ ] Dashboard menampilkan data S1 dan S2
[ ] Dashboard menampilkan grafik suhu dan kelembaban
[ ] Dashboard menampilkan prediksi suhu S2
[ ] Dashboard menampilkan status normal/waspada/anomali
[ ] Layout sensor tampil dengan icon status
[ ] ML Worker dapat melakukan preprocessing
[ ] ML Worker dapat melatih LSTM
[ ] ML Worker menghasilkan RMSE, MAE, MAPE
[ ] Baseline persistence/moving average tersedia
[ ] Hasil LSTM dibandingkan dengan baseline
[ ] Prediksi dan status anomali tersimpan di database
[ ] Telegram alert terkirim saat waspada/anomali
[ ] Sistem memiliki simulator data sensor
[ ] Sistem memiliki README dan deployment guide
[ ] Sistem dapat didemokan secara lokal
```

---

## 16. Risiko dan Mitigasi

| Risiko | Dampak | Mitigasi |
|---|---|---|
| Sensor belum tersedia | Development terhambat | Buat simulator data sensor |
| Data real sedikit | LSTM kurang akurat | Gunakan data bertahap dan baseline sebagai pembanding |
| Sensor timeout | Data hilang | Catat status trouble dan jangan pakai data invalid |
| Telegram gagal | Alert tidak sampai | Simpan error, dashboard alert tetap tampil |
| TimescaleDB sulit setup | Database terhambat | Gunakan PostgreSQL biasa dengan index timestamp |
| LSTM lebih buruk dari baseline | Hasil akademik lemah | Evaluasi window, preprocessing, jumlah data, dan jelaskan keterbatasan |
| Dashboard terlalu kompleks | Waktu habis | Prioritaskan card, chart, status, dan tabel |
| Hardware tidak stabil saat demo | Demo gagal | Siapkan demo replay/simulator |
| Threshold kurang cocok | Status tidak representatif | Jadikan threshold dapat dikonfigurasi |
| SSE bermasalah | Dashboard tidak real-time | Sediakan fallback polling API |

---

## 17. Instruksi untuk AI Agent

AI agent yang membangun sistem ini harus mengikuti aturan berikut:

1. Baca seluruh dokumen di folder `docs/` sebelum coding.
2. Jangan mengubah judul, scope, atau fokus penelitian.
3. Jangan menambahkan PUE, optimasi energi, atau kontrol pendingin otomatis.
4. Gunakan LSTM sebagai model utama.
5. Gunakan baseline hanya sebagai pembanding.
6. Gunakan S2 sebagai target utama prediksi.
7. Gunakan S1 sebagai sensor referensi.
8. Gunakan Go untuk backend.
9. Gunakan Python untuk gateway dan ML worker.
10. Gunakan PostgreSQL dan TimescaleDB jika memungkinkan.
11. Gunakan React + Vite + TypeScript untuk dashboard.
12. Gunakan Tailwind CSS dan shadcn/ui untuk UI.
13. Gunakan Chart.js sebagai grafik utama.
14. Gunakan SSE untuk update real-time.
15. Gunakan Telegram untuk notifikasi.
16. Sediakan simulator data sensor.
17. Pisahkan kode menjadi modul yang jelas.
18. Buat `.env.example`.
19. Buat README setup.
20. Pastikan sistem bisa dijelaskan untuk Bab 4 implementasi dan pengujian.

---

## 18. Dokumen Lanjutan

Setelah PRD ini, dokumen berikutnya adalah:

```text
02_SRS_EMS_LSTM_Thermal_Anomaly.md
03_System_Architecture_EMS_LSTM_Thermal_Anomaly.md
04_Database_Design_EMS_LSTM_Thermal_Anomaly.md
05_API_Specification_EMS_LSTM_Thermal_Anomaly.md
06_Gateway_Sensor_Spec_EMS_LSTM_Thermal_Anomaly.md
07_ML_Model_Spec_EMS_LSTM_Thermal_Anomaly.md
08_UI_Wireframe_EMS_LSTM_Thermal_Anomaly.md
09_Alert_Rules_EMS_LSTM_Thermal_Anomaly.md
10_Test_Plan_EMS_LSTM_Thermal_Anomaly.md
11_Deployment_Guide_EMS_LSTM_Thermal_Anomaly.md
12_Demo_Script_EMS_LSTM_Thermal_Anomaly.md
13_Initial_Agent_Prompt_EMS_LSTM_Thermal_Anomaly.md
```

---

## 19. Ringkasan Keputusan Final PRD

```text
Nama sistem       : EMS LSTM Thermal Anomaly Monitoring System
Objek             : Server testbed / laptop / mini PC
Sensor            : 2x XY-MD02
Gateway           : Raspberry Pi
Komunikasi sensor : Modbus RS485 via USB RS485 Converter
Backend           : Go/Golang
Database          : PostgreSQL + TimescaleDB
ML                : Python + TensorFlow/Keras
Dashboard         : React + Vite + TypeScript + Tailwind + shadcn/ui
Chart             : Chart.js
Real-time         : SSE
Notifikasi        : Telegram Bot API
Target prediksi   : Suhu S2
Window input      : 30 data terakhir
Horizon prediksi  : 5 menit ke depan
Sampling          : 1 menit
Status            : Normal, Waspada, Anomali, Trouble
Evaluasi          : RMSE, MAE, MAPE, baseline comparison
Metode            : Prototyping
```
