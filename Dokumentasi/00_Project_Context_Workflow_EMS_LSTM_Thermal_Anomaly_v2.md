# 00 Project Context & Workflow — EMS LSTM Thermal Anomaly

Dokumen ini merangkum konteks awal pengembangan program skripsi:

**Judul:** Prediksi Anomali Termal pada Environment Monitoring System Server Menggunakan Algoritma Long Short-Term Memory

Dokumen ini dibuat sebagai pegangan awal sebelum membuat dokumen teknis berikutnya seperti PRD, SRS, Database Design, Architecture, API Spec, ML Model Spec, Test Plan, Deployment Guide, Demo Script, dan Initial Agent Prompt.

---

## 1. Fokus Sistem

Sistem yang akan dikembangkan adalah **Environment Monitoring System (EMS)** untuk lingkungan server testbed.

Sistem berfungsi untuk:

1. Membaca data suhu dan kelembaban dari sensor.
2. Mengirim data sensor dari Raspberry Pi gateway ke backend.
3. Menyimpan data sebagai data time-series.
4. Menampilkan data melalui dashboard monitoring.
5. Melakukan prediksi suhu menggunakan algoritma LSTM.
6. Menentukan status termal berdasarkan hasil prediksi dan threshold.
7. Mengirim notifikasi ketika status berubah menjadi waspada atau anomali.
8. Mengevaluasi performa model menggunakan RMSE, MAE, MAPE, serta baseline sederhana.

---

## 2. Scope yang Dikunci dari Skripsi

| Komponen | Keputusan |
|---|---|
| Jenis sistem | Environment Monitoring System server testbed |
| Objek uji | Laptop / mini PC sebagai server testbed |
| Jumlah sensor | 2 sensor |
| Sensor | XY-MD02 suhu dan kelembaban |
| Komunikasi sensor | Modbus RS485 |
| Gateway | Raspberry Pi |
| Converter | USB RS485 Converter |
| Backend | Go/Golang |
| Database | PostgreSQL + TimescaleDB apabila memungkinkan |
| Machine Learning | Python |
| Model utama | LSTM |
| Dashboard | React + Vite + TypeScript + Tailwind CSS + shadcn/ui |
| Grafik | Chart.js atau ECharts; Chart.js dikunci sebagai pilihan utama agar tetap sesuai rancangan awal |
| Real-time update | Server-Sent Events (SSE) |
| Notifikasi | Telegram Bot API |
| Interval sampling awal | 1 menit |
| Window input awal | 30 data terakhir |
| Horizon prediksi | 5 menit ke depan |
| Target prediksi | Suhu S2 |
| Evaluasi model | RMSE, MAE, MAPE |
| Baseline | Persistence model dan/atau moving average |
| Metode pengembangan | Prototyping |

---

## 3. Posisi Sensor

### S1 — Ambient / Referensi Ruangan

S1 ditempatkan pada area ambient atau referensi ruangan. Sensor ini tidak terkena panas langsung dari laptop/server testbed. Data S1 digunakan sebagai pembanding kondisi lingkungan sekitar.

### S2 — Hotspot / Exhaust

S2 ditempatkan dekat area hotspot atau exhaust laptop/server testbed. Sensor ini menjadi sensor utama karena paling dekat dengan sumber panas. Suhu S2 digunakan sebagai target prediksi LSTM dan dasar penentuan status termal.

---

## 4. Alur Sistem Final

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

## 5. Status Termal

| Status | Kriteria Suhu Prediksi S2 |
|---|---|
| Normal | Suhu prediksi S2 < 30°C |
| Waspada | Suhu prediksi S2 30°C sampai 32°C |
| Anomali | Suhu prediksi S2 > 32°C |

Catatan: threshold ini diposisikan sebagai batas operasional penelitian pada lingkungan server testbed, bukan standar universal untuk seluruh server/data center.

---

## 6. Data Model Prediksi

| Komponen | Keterangan |
|---|---|
| Fitur input | Suhu dan kelembaban dari S1 dan S2 |
| Target prediksi | Suhu S2 |
| Interval sampling | 1 menit |
| Window input | 30 data terakhir |
| Horizon prediksi | 5 menit ke depan |
| Output model | Nilai prediksi suhu S2 |
| Output sistem | Status normal, waspada, atau anomali |

---

## 7. Modul Program yang Dibutuhkan

### 7.1 Gateway Sensor

Dibuat dengan Python pada Raspberry Pi.

Fungsi:
1. Membaca sensor XY-MD02 melalui Modbus RS485.
2. Menggunakan USB RS485 Converter.
3. Memberikan timestamp.
4. Membentuk payload JSON.
5. Mengirim data ke backend Go melalui HTTP REST API.
6. Menangani error sensor, timeout, dan data tidak valid.

### 7.2 Backend API

Dibuat dengan Go/Golang.

Fungsi:
1. Menerima data sensor dari Raspberry Pi.
2. Validasi payload.
3. Menyimpan data sensor ke database.
4. Menyediakan API untuk dashboard.
5. Menyediakan SSE untuk pembaruan data real-time.
6. Menyediakan endpoint untuk data historis, prediksi, anomali, evaluasi, dan layout sensor.
7. Memicu notifikasi Telegram jika status waspada atau anomali.

### 7.3 Database

Menggunakan PostgreSQL + TimescaleDB apabila memungkinkan.

Menyimpan data sensor, hasil prediksi, anomali, versi model, metrik evaluasi, baseline result, layout dashboard, icon status sensor, riwayat notifikasi, dan log kesalahan.

### 7.4 ML Worker

Dibuat dengan Python.

Fungsi:
1. Mengambil data historis dari database.
2. Melakukan preprocessing.
3. Membentuk window input.
4. Melatih model LSTM.
5. Mengevaluasi model dengan RMSE, MAE, dan MAPE.
6. Membandingkan LSTM dengan baseline.
7. Menyimpan model.
8. Menjalankan inferensi prediksi.
9. Menyimpan hasil prediksi dan status anomali ke database.

### 7.5 Dashboard

Dibuat dengan React + Vite + TypeScript + Tailwind CSS + shadcn/ui.

Fungsi:
1. Menampilkan suhu dan kelembaban S1 dan S2.
2. Menampilkan grafik suhu aktual.
3. Menampilkan grafik kelembaban.
4. Menampilkan grafik aktual vs prediksi S2.
5. Menampilkan status termal.
6. Menampilkan metrik evaluasi model.
7. Menampilkan riwayat anomali.
8. Menampilkan layout posisi sensor.
9. Menampilkan icon sensor berdasarkan status normal, waspada, anomali, atau trouble.
10. Menampilkan riwayat notifikasi.

Catatan UI:
- shadcn/ui digunakan sebagai komponen UI utama karena cocok dengan React dan Tailwind CSS.
- shadcn/ui dipakai untuk komponen seperti Card, Button, Badge, Table, Dialog, Tabs, Select, Input, Toast, Tooltip, dan Sheet.
- Dashboard tetap bersifat custom, bukan template siap pakai.
- Chart utama tetap menggunakan Chart.js agar sesuai dengan rancangan awal skripsi. ECharts dapat menjadi alternatif apabila dibutuhkan.
- Recharts tidak dikunci sebagai stack utama agar tidak mengubah rancangan awal yang menyebut Chart.js atau ECharts.

### 7.6 Telegram Notification

Fungsi:
1. Mengirim pesan ketika status berubah menjadi waspada atau anomali.
2. Menampilkan waktu kejadian, sensor acuan, prediksi suhu, horizon prediksi, dan status.
3. Menggunakan cooldown untuk mencegah spam notifikasi.

---

## 8. Dokumen yang Akan Dibuat

```text
01_PRD_EMS_LSTM_Thermal_Anomaly.md
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

## 9. Urutan Pengerjaan Program

```text
Fase 1  : Kunci requirement dan stack
Fase 2  : Setup repository dan struktur folder
Fase 3  : Setup database PostgreSQL + TimescaleDB
Fase 4  : Buat backend Go API
Fase 5  : Buat gateway sensor Raspberry Pi
Fase 6  : Buat simulator data sensor untuk development
Fase 7  : Buat dashboard React + Tailwind
Fase 8  : Implementasi SSE real-time
Fase 9  : Pengumpulan dataset
Fase 10 : Preprocessing data
Fase 11 : Baseline model
Fase 12 : Training LSTM
Fase 13 : Integrasi inference LSTM ke database/backend
Fase 14 : Deteksi status normal/waspada/anomali
Fase 15 : Telegram alert
Fase 16 : Pengujian blackbox dan integrasi
Fase 17 : Dokumentasi deployment
Fase 18 : Demo script
```

---

## 10. Keputusan Awal untuk AI Agent

1. Jangan mengubah scope menjadi PUE atau optimasi energi.
2. Jangan membuat sistem kontrol pendingin otomatis.
3. Jangan mengganti LSTM dengan model lain sebagai model utama.
4. Baseline hanya digunakan sebagai pembanding, bukan pengganti LSTM.
5. Raspberry Pi hanya digunakan sebagai gateway, bukan tempat training LSTM.
6. Target prediksi utama adalah suhu S2.
7. Dashboard harus menampilkan data aktual, prediksi, status, metrik evaluasi, layout sensor, dan riwayat anomali menggunakan React + Vite + TypeScript + Tailwind CSS + shadcn/ui.
8. Sistem harus tetap bisa dijalankan walaupun hardware belum tersambung dengan menggunakan simulator data sensor.
9. Semua dokumen dan kode harus dibuat agar mudah dijelaskan untuk kebutuhan skripsi dan demo.

---

## 11. Catatan Penting

Program harus dibuat realistis untuk skripsi, bukan terlalu enterprise. Fokus utamanya adalah membuktikan bahwa EMS dapat mengumpulkan data sensor, mengelola data time-series, memprediksi suhu S2 menggunakan LSTM, menentukan status termal berdasarkan threshold, menampilkan informasi pada dashboard, dan mengirim notifikasi sebagai early warning.
