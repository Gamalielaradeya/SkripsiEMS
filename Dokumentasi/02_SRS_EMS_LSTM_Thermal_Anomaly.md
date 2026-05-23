# 02 SRS — EMS LSTM Thermal Anomaly Monitoring System

**Judul Skripsi:** Prediksi Anomali Termal pada Environment Monitoring System Server Menggunakan Algoritma Long Short-Term Memory  
**Jenis Dokumen:** Software Requirements Specification (SRS)  
**Versi:** 1.0  
**Status:** Final untuk dasar implementasi AI Agent  
**Target Pengguna Dokumen:** AI coding agent, developer, mahasiswa, dan reviewer teknis  
**Tanggal:** 2026-05-23  

---

## 1. Tujuan Dokumen

Dokumen Software Requirements Specification (SRS) ini menjelaskan kebutuhan perangkat lunak secara detail untuk pengembangan **EMS LSTM Thermal Anomaly Monitoring System**.

SRS ini menjadi dokumen turunan dari PRD dan digunakan sebagai acuan teknis oleh AI coding agent agar sistem dapat dibangun secara konsisten, terstruktur, dan sesuai dengan scope skripsi.

Dokumen ini menjelaskan:

1. Deskripsi umum sistem.
2. Aktor dan peran pengguna.
3. Kebutuhan fungsional.
4. Kebutuhan non-fungsional.
5. Kebutuhan data.
6. Kebutuhan API.
7. Kebutuhan dashboard.
8. Kebutuhan gateway sensor.
9. Kebutuhan ML worker.
10. Kebutuhan notifikasi.
11. Aturan validasi.
12. Aturan status termal.
13. Error handling.
14. Acceptance criteria.

---

## 2. Gambaran Umum Sistem

Sistem yang dikembangkan adalah **Environment Monitoring System (EMS)** untuk lingkungan server testbed.

Sistem melakukan pembacaan data suhu dan kelembaban dari dua sensor XY-MD02:

1. **S1 Ambient / Reference Sensor**  
   Sensor pembanding yang ditempatkan pada area ambient atau referensi ruangan.

2. **S2 Hotspot / Exhaust Sensor**  
   Sensor utama yang ditempatkan dekat area hotspot atau exhaust laptop/server testbed. Suhu S2 menjadi target utama prediksi LSTM.

Data sensor dibaca oleh Raspberry Pi gateway menggunakan komunikasi Modbus RS485 melalui USB RS485 Converter. Setelah data terbaca, gateway mengirim payload JSON ke backend Go melalui HTTP REST API.

Backend menyimpan data ke PostgreSQL/TimescaleDB, menyediakan API dan SSE untuk dashboard, serta menyediakan data historis untuk modul machine learning. ML worker menggunakan Python untuk melakukan preprocessing, training LSTM, baseline comparison, evaluasi, dan inference prediksi suhu S2.

Dashboard dibuat menggunakan React + Vite + TypeScript + Tailwind CSS + shadcn/ui. Dashboard menampilkan data aktual, grafik, prediksi, status termal, layout sensor, riwayat anomali, riwayat notifikasi, dan metrik evaluasi model.

---

## 3. Scope Sistem

### 3.1 In Scope

| Area | Keterangan |
|---|---|
| Akuisisi sensor | Pembacaan suhu dan kelembaban S1 dan S2 |
| Gateway | Raspberry Pi membaca sensor dan mengirim data ke backend |
| Backend | REST API, validasi data, penyimpanan data, SSE, notifikasi |
| Database | Penyimpanan data time-series, prediksi, anomali, evaluasi, layout |
| ML Worker | Preprocessing, baseline, training LSTM, evaluasi, inference |
| Dashboard | Visualisasi real-time, grafik, layout sensor, status, evaluasi |
| Alert | Telegram alert untuk status waspada/anomali |
| Simulator | Simulasi data sensor untuk development dan demo |
| Testing | Pengujian blackbox, API, sensor, dashboard, ML, integrasi |

### 3.2 Out of Scope

| Area | Keterangan |
|---|---|
| Kontrol pendingin otomatis | Sistem tidak mengontrol kipas/AC/perangkat listrik |
| PUE aktual | Sistem tidak menghitung Power Usage Effectiveness |
| Optimasi energi | Tidak membahas efisiensi daya |
| Training di Raspberry Pi | Raspberry Pi hanya untuk akuisisi data |
| SIEM/enterprise monitoring | Sistem dibatasi untuk server testbed |
| Model utama selain LSTM | Model lain hanya sebagai baseline |
| Mobile app | Dashboard web cukup |
| Multi-role kompleks | Admin/pengguna sederhana cukup |

---

## 4. Definisi Istilah

| Istilah | Definisi |
|---|---|
| EMS | Environment Monitoring System |
| S1 | Sensor ambient/reference |
| S2 | Sensor hotspot/exhaust dan target prediksi |
| Gateway | Raspberry Pi yang membaca sensor dan mengirim data |
| Backend | Service Go yang menerima data, menyimpan data, dan menyediakan API |
| ML Worker | Modul Python untuk preprocessing, training, evaluasi, dan inference |
| LSTM | Long Short-Term Memory |
| Baseline | Metode pembanding sederhana seperti persistence atau moving average |
| SSE | Server-Sent Events untuk pembaruan data satu arah dari server ke browser |
| Threshold | Batas operasional untuk menentukan status termal |
| Normal | Status aman |
| Waspada | Status peringatan |
| Anomali | Status melewati batas operasional |
| Trouble | Status sensor bermasalah, timeout, atau data tidak valid |

---

## 5. Aktor Sistem

## 5.1 Administrator / Pengguna Sistem

Aktor yang menggunakan dashboard untuk memantau kondisi EMS.

Hak akses:

1. Melihat dashboard.
2. Melihat data sensor aktual.
3. Melihat grafik historis.
4. Melihat prediksi suhu S2.
5. Melihat status termal.
6. Melihat riwayat anomali.
7. Melihat riwayat notifikasi.
8. Melihat metrik evaluasi model.
9. Mengatur threshold jika fitur settings diaktifkan.
10. Mengatur posisi icon sensor pada layout jika fitur layout editor diaktifkan.

## 5.2 Raspberry Pi Gateway

Aktor sistem non-manusia yang mengirim data sensor ke backend.

Hak akses:

1. Mengirim payload sensor.
2. Menggunakan token API sederhana.
3. Mengirim data S1 dan S2 secara periodik.

## 5.3 ML Worker

Aktor sistem non-manusia yang membaca data historis dan menulis hasil prediksi/evaluasi ke database.

Hak akses:

1. Membaca data sensor.
2. Menyimpan hasil preprocessing jika diperlukan.
3. Menyimpan hasil prediksi.
4. Menyimpan hasil evaluasi.
5. Menyimpan model version.
6. Menyimpan baseline result.

---

## 6. Kebutuhan Fungsional Utama

## 6.1 Modul Gateway Sensor

### FR-GW-001 — Konfigurasi Gateway

Sistem gateway harus memiliki file konfigurasi untuk mengatur:

1. URL backend.
2. API token.
3. Serial port USB RS485.
4. Baudrate Modbus.
5. ID slave sensor S1.
6. ID slave sensor S2.
7. Interval sampling.
8. Timeout pembacaan.
9. Mode real hardware atau simulator.

**Acceptance Criteria:**

| Kode | Kriteria |
|---|---|
| AC-GW-001-01 | Gateway dapat membaca konfigurasi dari file `.env` atau `config.yaml` |
| AC-GW-001-02 | Gateway dapat berjalan dalam mode simulator |
| AC-GW-001-03 | Gateway dapat berjalan dalam mode hardware apabila sensor tersedia |

---

### FR-GW-002 — Pembacaan Sensor S1 dan S2

Gateway harus membaca suhu dan kelembaban dari sensor S1 dan S2.

**Aturan:**

1. S1 = ambient/reference.
2. S2 = hotspot/exhaust.
3. Data yang dibaca minimal suhu dan kelembaban.
4. Setiap pembacaan harus memiliki timestamp.
5. Pembacaan dilakukan berdasarkan interval sampling awal 1 menit.

**Acceptance Criteria:**

| Kode | Kriteria |
|---|---|
| AC-GW-002-01 | Gateway menghasilkan data S1 |
| AC-GW-002-02 | Gateway menghasilkan data S2 |
| AC-GW-002-03 | Data memiliki timestamp |
| AC-GW-002-04 | Data memiliki nilai suhu dan kelembaban |
| AC-GW-002-05 | Gateway dapat mencatat error jika salah satu sensor gagal terbaca |

---

### FR-GW-003 — Validasi Data di Gateway

Gateway harus melakukan validasi awal sebelum mengirim data ke backend.

**Validasi:**

| Field | Aturan |
|---|---|
| sensor_code | Wajib `S1` atau `S2` |
| temperature | Wajib angka |
| humidity | Wajib angka |
| recorded_at | Wajib timestamp |
| gateway_id | Wajib string |
| sensor_role | Wajib `ambient` atau `hotspot` |

**Nilai wajar awal:**

| Parameter | Rentang |
|---|---|
| temperature | 0°C sampai 80°C |
| humidity | 0% sampai 100% |

**Acceptance Criteria:**

| Kode | Kriteria |
|---|---|
| AC-GW-003-01 | Gateway tidak mengirim data kosong |
| AC-GW-003-02 | Gateway menandai data tidak wajar |
| AC-GW-003-03 | Gateway mencatat log lokal jika data tidak valid |

---

### FR-GW-004 — Pengiriman Payload ke Backend

Gateway harus mengirim data sensor ke backend menggunakan HTTP REST API.

**Endpoint tujuan:**

```text
POST /api/v1/readings
```

**Header wajib:**

```text
Authorization: Bearer <API_TOKEN>
Content-Type: application/json
```

**Contoh Payload:**

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

**Acceptance Criteria:**

| Kode | Kriteria |
|---|---|
| AC-GW-004-01 | Gateway dapat mengirim payload ke backend |
| AC-GW-004-02 | Gateway retry apabila backend belum tersedia |
| AC-GW-004-03 | Gateway mencatat error jika request gagal |
| AC-GW-004-04 | Payload diterima backend dengan status sukses |

---

### FR-GW-005 — Mode Simulator

Gateway harus menyediakan mode simulator agar development dapat dilakukan tanpa hardware.

**Simulator harus mampu:**

1. Menghasilkan data S1 dan S2.
2. Membuat pola suhu normal.
3. Membuat skenario suhu naik.
4. Membuat skenario waspada.
5. Membuat skenario anomali.
6. Membuat skenario sensor trouble.
7. Mengirim payload dengan format yang sama seperti gateway asli.

**Acceptance Criteria:**

| Kode | Kriteria |
|---|---|
| AC-GW-005-01 | Simulator menghasilkan data S1/S2 |
| AC-GW-005-02 | Simulator dapat memicu status normal |
| AC-GW-005-03 | Simulator dapat memicu status waspada |
| AC-GW-005-04 | Simulator dapat memicu status anomali |
| AC-GW-005-05 | Simulator dapat digunakan untuk demo tanpa sensor |

---

## 6.2 Modul Backend API

### FR-BE-001 — Health Check

Backend harus menyediakan endpoint health check.

```text
GET /api/v1/health
```

**Response:**

```json
{
  "status": "ok",
  "service": "ems-backend",
  "database": "connected",
  "time": "2026-05-23T14:30:00+07:00"
}
```

**Acceptance Criteria:**

| Kode | Kriteria |
|---|---|
| AC-BE-001-01 | Endpoint health mengembalikan status ok |
| AC-BE-001-02 | Endpoint menampilkan status koneksi database |

---

### FR-BE-002 — Autentikasi Gateway

Backend harus melindungi endpoint penerimaan sensor menggunakan token sederhana.

**Aturan:**

1. Token dikirim pada header Authorization.
2. Backend menolak request tanpa token.
3. Backend menolak token tidak valid.
4. Token disimpan di env atau tabel `api_tokens`.

**Acceptance Criteria:**

| Kode | Kriteria |
|---|---|
| AC-BE-002-01 | Request tanpa token ditolak |
| AC-BE-002-02 | Request token salah ditolak |
| AC-BE-002-03 | Request token benar diterima |

---

### FR-BE-003 — Penerimaan Data Sensor

Backend harus menerima payload dari gateway.

**Endpoint:**

```text
POST /api/v1/readings
```

**Response sukses:**

```json
{
  "status": "success",
  "message": "readings stored",
  "stored_count": 2
}
```

**Acceptance Criteria:**

| Kode | Kriteria |
|---|---|
| AC-BE-003-01 | Backend menerima payload valid |
| AC-BE-003-02 | Backend menyimpan dua data sensor |
| AC-BE-003-03 | Backend mengembalikan stored_count |
| AC-BE-003-04 | Backend menolak payload rusak |

---

### FR-BE-004 — Validasi Payload Sensor

Backend harus memvalidasi payload sebelum menyimpan data.

**Validasi payload utama:**

| Field | Required | Aturan |
|---|---|---|
| gateway_id | Ya | String |
| recorded_at | Ya | ISO timestamp |
| readings | Ya | Array minimal 1 |
| readings.sensor_code | Ya | S1/S2 |
| readings.sensor_role | Ya | ambient/hotspot |
| readings.temperature | Ya | Numeric |
| readings.humidity | Ya | Numeric |

**Acceptance Criteria:**

| Kode | Kriteria |
|---|---|
| AC-BE-004-01 | Payload tanpa gateway_id ditolak |
| AC-BE-004-02 | Payload tanpa readings ditolak |
| AC-BE-004-03 | Payload suhu bukan angka ditolak |
| AC-BE-004-04 | Payload kelembaban bukan angka ditolak |
| AC-BE-004-05 | Error validasi dikembalikan secara jelas |

---

### FR-BE-005 — Penyimpanan Data Time-Series

Backend harus menyimpan data sensor ke PostgreSQL.

**Aturan penyimpanan:**

1. Setiap pembacaan disimpan sebagai baris terpisah.
2. Setiap baris memiliki `sensor_id`.
3. Setiap baris memiliki `recorded_at`.
4. Data tersimpan sesuai urutan waktu.
5. Data dapat di-query berdasarkan waktu dan sensor.

**Acceptance Criteria:**

| Kode | Kriteria |
|---|---|
| AC-BE-005-01 | Data S1 tersimpan |
| AC-BE-005-02 | Data S2 tersimpan |
| AC-BE-005-03 | recorded_at tersimpan |
| AC-BE-005-04 | Data dapat diambil berdasarkan rentang waktu |
| AC-BE-005-05 | Data dapat diambil berdasarkan sensor |

---

### FR-BE-006 — Data Terbaru

Backend harus menyediakan endpoint untuk data sensor terbaru.

```text
GET /api/v1/readings/latest
```

**Response:**

```json
{
  "status": "success",
  "data": {
    "S1": {
      "temperature": 27.4,
      "humidity": 63.2,
      "recorded_at": "2026-05-23T14:30:00+07:00",
      "status": "normal"
    },
    "S2": {
      "temperature": 30.8,
      "humidity": 58.5,
      "recorded_at": "2026-05-23T14:30:00+07:00",
      "status": "waspada"
    }
  }
}
```

**Acceptance Criteria:**

| Kode | Kriteria |
|---|---|
| AC-BE-006-01 | Endpoint mengembalikan data terbaru S1 |
| AC-BE-006-02 | Endpoint mengembalikan data terbaru S2 |
| AC-BE-006-03 | Endpoint menampilkan status sensor |

---

### FR-BE-007 — Data Historis

Backend harus menyediakan endpoint data historis.

```text
GET /api/v1/readings/history?sensor_code=S2&from=2026-05-23T00:00:00Z&to=2026-05-23T23:59:59Z
```

**Acceptance Criteria:**

| Kode | Kriteria |
|---|---|
| AC-BE-007-01 | Data dapat difilter berdasarkan sensor |
| AC-BE-007-02 | Data dapat difilter berdasarkan tanggal |
| AC-BE-007-03 | Data diurutkan berdasarkan recorded_at |
| AC-BE-007-04 | Response cocok untuk grafik dashboard |

---

### FR-BE-008 — Dashboard Summary

Backend harus menyediakan ringkasan dashboard.

```text
GET /api/v1/dashboard/summary
```

Ringkasan harus mencakup:

1. Suhu S1 terbaru.
2. Kelembaban S1 terbaru.
3. Suhu S2 terbaru.
4. Kelembaban S2 terbaru.
5. Prediksi suhu S2 terbaru.
6. Status termal terbaru.
7. Total data hari ini.
8. Total anomali hari ini.
9. Status sensor trouble jika ada.
10. Metrik model terbaru.

**Acceptance Criteria:**

| Kode | Kriteria |
|---|---|
| AC-BE-008-01 | Summary menampilkan S1 dan S2 |
| AC-BE-008-02 | Summary menampilkan prediksi terbaru |
| AC-BE-008-03 | Summary menampilkan status termal |
| AC-BE-008-04 | Summary menampilkan metrik terbaru |

---

### FR-BE-009 — Server-Sent Events

Backend harus menyediakan endpoint SSE untuk update dashboard.

```text
GET /api/v1/events
```

Jenis event:

| Event | Isi |
|---|---|
| reading.latest | Data sensor terbaru |
| prediction.latest | Prediksi terbaru |
| anomaly.created | Anomali baru |
| notification.sent | Notifikasi terkirim |
| sensor.trouble | Sensor bermasalah |

**Acceptance Criteria:**

| Kode | Kriteria |
|---|---|
| AC-BE-009-01 | Browser dapat membuka koneksi SSE |
| AC-BE-009-02 | Event data sensor terbaru terkirim |
| AC-BE-009-03 | Event prediksi terbaru terkirim |
| AC-BE-009-04 | Dashboard tetap dapat fallback ke polling jika SSE gagal |

---

## 6.3 Modul Database

### FR-DB-001 — Tabel Gateway

Database harus menyimpan informasi gateway.

Field minimal:

```text
id
gateway_code
name
location
description
last_seen_at
status
created_at
updated_at
```

---

### FR-DB-002 — Tabel Sensor

Database harus menyimpan informasi sensor.

Field minimal:

```text
id
gateway_id
sensor_code
sensor_role
name
location
modbus_slave_id
status
last_seen_at
created_at
updated_at
```

Data awal:

| sensor_code | sensor_role | Keterangan |
|---|---|---|
| S1 | ambient | Sensor referensi |
| S2 | hotspot | Sensor utama prediksi |

---

### FR-DB-003 — Tabel Sensor Readings

Database harus menyimpan data pembacaan sensor.

Field minimal:

```text
id
sensor_id
gateway_id
temperature
humidity
recorded_at
quality_status
raw_payload
created_at
```

Index wajib:

```text
(sensor_id, recorded_at)
(recorded_at)
```

Jika TimescaleDB tersedia, tabel ini dapat dijadikan hypertable berdasarkan `recorded_at`.

---

### FR-DB-004 — Tabel Predictions

Database harus menyimpan hasil prediksi.

Field minimal:

```text
id
model_version_id
target_sensor_id
predicted_temperature
prediction_horizon_minutes
input_window_size
predicted_for
status
created_at
```

---

### FR-DB-005 — Tabel Anomalies

Database harus menyimpan status anomali.

Field minimal:

```text
id
prediction_id
target_sensor_id
status
predicted_temperature
actual_temperature
threshold_warning
threshold_anomaly
description
detected_at
created_at
```

---

### FR-DB-006 — Tabel Model Versions

Database harus menyimpan versi model.

Field minimal:

```text
id
model_name
model_type
version
feature_columns
target_column
window_size
horizon_minutes
model_path
scaler_path
trained_at
created_at
```

---

### FR-DB-007 — Tabel Model Metrics

Database harus menyimpan evaluasi model.

Field minimal:

```text
id
model_version_id
dataset_start
dataset_end
train_size
test_size
rmse
mae
mape
created_at
```

---

### FR-DB-008 — Tabel Baseline Results

Database harus menyimpan hasil baseline.

Field minimal:

```text
id
baseline_type
dataset_start
dataset_end
rmse
mae
mape
parameters
created_at
```

---

### FR-DB-009 — Tabel Dashboard Layout

Database harus menyimpan gambar layout dan posisi sensor.

Tabel `dashboard_layouts`:

```text
id
name
image_path
is_active
created_at
updated_at
```

Tabel `sensor_positions`:

```text
id
layout_id
sensor_id
x_position
y_position
icon_status
created_at
updated_at
```

---

### FR-DB-010 — Tabel Notifications

Database harus menyimpan riwayat notifikasi.

Field minimal:

```text
id
anomaly_id
channel
recipient
message
status
sent_at
error_message
created_at
```

---

## 6.4 Modul ML Worker

### FR-ML-001 — Dataset Loader

ML Worker harus mengambil data historis dari database.

**Aturan:**

1. Mengambil data S1 dan S2.
2. Menggabungkan data berdasarkan timestamp.
3. Menghasilkan dataset dengan kolom:
   - timestamp
   - temperature_s1
   - humidity_s1
   - temperature_s2
   - humidity_s2
4. Data diurutkan secara kronologis.

**Acceptance Criteria:**

| Kode | Kriteria |
|---|---|
| AC-ML-001-01 | Worker dapat membaca data dari database |
| AC-ML-001-02 | Worker menghasilkan dataset gabungan S1/S2 |
| AC-ML-001-03 | Dataset diurutkan berdasarkan timestamp |

---

### FR-ML-002 — Preprocessing

ML Worker harus melakukan preprocessing.

Tahapan:

1. Validasi timestamp.
2. Resampling jika diperlukan.
3. Penanganan missing value.
4. Penanganan outlier sederhana.
5. Normalisasi fitur.
6. Pembentukan window input.

**Acceptance Criteria:**

| Kode | Kriteria |
|---|---|
| AC-ML-002-01 | Missing value tertangani |
| AC-ML-002-02 | Nilai tidak wajar tertandai |
| AC-ML-002-03 | Data dinormalisasi |
| AC-ML-002-04 | Data siap menjadi input model |

---

### FR-ML-003 — Window Builder

ML Worker harus membentuk window input.

Parameter awal:

| Parameter | Nilai |
|---|---|
| Window input | 30 data terakhir |
| Sampling interval | 1 menit |
| Representasi window | 30 menit data historis |
| Horizon | 5 menit ke depan |
| Target | Suhu S2 |

**Acceptance Criteria:**

| Kode | Kriteria |
|---|---|
| AC-ML-003-01 | Window input berbentuk 3D array untuk LSTM |
| AC-ML-003-02 | Target output adalah suhu S2 pada horizon |
| AC-ML-003-03 | Window tidak mengacak urutan waktu |

---

### FR-ML-004 — Training LSTM

ML Worker harus melatih model LSTM.

Input feature:

```text
temperature_s1
humidity_s1
temperature_s2
humidity_s2
```

Target:

```text
temperature_s2_future
```

**Acceptance Criteria:**

| Kode | Kriteria |
|---|---|
| AC-ML-004-01 | Training dapat dijalankan |
| AC-ML-004-02 | Model tersimpan ke folder models |
| AC-ML-004-03 | Versi model tersimpan ke database |
| AC-ML-004-04 | Training tidak menggunakan split acak |

---

### FR-ML-005 — Evaluasi Model

ML Worker harus menghitung:

1. RMSE.
2. MAE.
3. MAPE.

**Acceptance Criteria:**

| Kode | Kriteria |
|---|---|
| AC-ML-005-01 | RMSE dihitung |
| AC-ML-005-02 | MAE dihitung |
| AC-ML-005-03 | MAPE dihitung |
| AC-ML-005-04 | Metrik disimpan ke database |
| AC-ML-005-05 | Hasil aktual vs prediksi dapat diekspor/ditampilkan |

---

### FR-ML-006 — Baseline Comparison

ML Worker harus menyediakan baseline sederhana.

Baseline minimal:

1. Persistence model.
2. Moving average.

**Acceptance Criteria:**

| Kode | Kriteria |
|---|---|
| AC-ML-006-01 | Persistence baseline tersedia |
| AC-ML-006-02 | Moving average baseline tersedia |
| AC-ML-006-03 | RMSE/MAE/MAPE baseline dihitung |
| AC-ML-006-04 | Hasil baseline tersimpan |
| AC-ML-006-05 | Dashboard dapat menampilkan perbandingan LSTM vs baseline |

---

### FR-ML-007 — Inference Prediksi

ML Worker harus melakukan prediksi suhu S2 menggunakan model tersimpan.

**Input:**

30 data terakhir dari S1 dan S2.

**Output:**

Prediksi suhu S2 5 menit ke depan.

**Acceptance Criteria:**

| Kode | Kriteria |
|---|---|
| AC-ML-007-01 | Worker membaca model tersimpan |
| AC-ML-007-02 | Worker mengambil 30 data terakhir |
| AC-ML-007-03 | Worker menghasilkan prediksi suhu S2 |
| AC-ML-007-04 | Prediksi tersimpan ke database |
| AC-ML-007-05 | Prediksi dapat ditampilkan di dashboard |

---

### FR-ML-008 — Klasifikasi Status Termal

ML Worker atau backend harus menentukan status berdasarkan prediksi suhu S2.

Aturan threshold:

| Status | Kriteria |
|---|---|
| Normal | predicted_s2 < 30°C |
| Waspada | predicted_s2 >= 30°C dan <= 32°C |
| Anomali | predicted_s2 > 32°C |

**Acceptance Criteria:**

| Kode | Kriteria |
|---|---|
| AC-ML-008-01 | Prediksi < 30°C menghasilkan normal |
| AC-ML-008-02 | Prediksi 30–32°C menghasilkan waspada |
| AC-ML-008-03 | Prediksi > 32°C menghasilkan anomali |
| AC-ML-008-04 | Status tersimpan ke database |
| AC-ML-008-05 | Status tampil di dashboard |

---

## 6.5 Modul Dashboard

### FR-UI-001 — Setup Dashboard

Dashboard harus menggunakan:

```text
React
Vite
TypeScript
Tailwind CSS
shadcn/ui
Chart.js
```

**Acceptance Criteria:**

| Kode | Kriteria |
|---|---|
| AC-UI-001-01 | Dashboard dapat dijalankan dengan `npm run dev` |
| AC-UI-001-02 | Tailwind CSS aktif |
| AC-UI-001-03 | shadcn/ui dapat digunakan |
| AC-UI-001-04 | Chart.js dapat menampilkan grafik |

---

### FR-UI-002 — Layout Utama

Dashboard harus memiliki layout utama:

1. Sidebar.
2. Topbar.
3. Content area.
4. Responsive card grid.
5. Chart section.
6. Table section.

**Menu sidebar:**

```text
Dashboard
Sensor Readings
Predictions
Anomalies
Model Evaluation
Sensor Layout
Notifications
Settings
```

**Acceptance Criteria:**

| Kode | Kriteria |
|---|---|
| AC-UI-002-01 | Sidebar tampil |
| AC-UI-002-02 | Topbar tampil |
| AC-UI-002-03 | Layout responsif |
| AC-UI-002-04 | Menu navigasi berfungsi |

---

### FR-UI-003 — Main Dashboard

Dashboard utama harus menampilkan:

1. Card suhu S1.
2. Card kelembaban S1.
3. Card suhu S2.
4. Card kelembaban S2.
5. Card prediksi suhu S2.
6. Card status termal.
7. Grafik suhu.
8. Grafik kelembaban.
9. Grafik aktual vs prediksi.
10. Layout sensor.
11. Tabel anomali terbaru.
12. Riwayat notifikasi.
13. Metrik RMSE/MAE/MAPE terbaru.

**Acceptance Criteria:**

| Kode | Kriteria |
|---|---|
| AC-UI-003-01 | Card S1 tampil |
| AC-UI-003-02 | Card S2 tampil |
| AC-UI-003-03 | Prediksi S2 tampil |
| AC-UI-003-04 | Status termal tampil |
| AC-UI-003-05 | Grafik tampil |
| AC-UI-003-06 | Data berubah saat ada update API/SSE |

---

### FR-UI-004 — Sensor Readings Page

Halaman ini menampilkan data sensor historis.

Fitur:

1. Filter sensor S1/S2.
2. Filter tanggal.
3. Tabel data.
4. Grafik historis.
5. Export CSV jika waktu memungkinkan.

**Acceptance Criteria:**

| Kode | Kriteria |
|---|---|
| AC-UI-004-01 | Tabel data sensor tampil |
| AC-UI-004-02 | Filter sensor berjalan |
| AC-UI-004-03 | Filter tanggal berjalan |
| AC-UI-004-04 | Grafik mengikuti hasil filter |

---

### FR-UI-005 — Prediction Page

Halaman ini menampilkan hasil prediksi.

Fitur:

1. Grafik aktual suhu S2 vs prediksi suhu S2.
2. Tabel prediksi.
3. Horizon prediksi.
4. Status hasil prediksi.
5. Model version yang digunakan.

**Acceptance Criteria:**

| Kode | Kriteria |
|---|---|
| AC-UI-005-01 | Grafik aktual vs prediksi tampil |
| AC-UI-005-02 | Tabel prediksi tampil |
| AC-UI-005-03 | Status prediksi tampil |
| AC-UI-005-04 | Model version tampil |

---

### FR-UI-006 — Anomaly Page

Halaman ini menampilkan riwayat status waspada/anomali.

Fitur:

1. Tabel anomali.
2. Filter status.
3. Filter tanggal.
4. Detail anomali.
5. Status notifikasi.

**Acceptance Criteria:**

| Kode | Kriteria |
|---|---|
| AC-UI-006-01 | Tabel anomali tampil |
| AC-UI-006-02 | Filter status berjalan |
| AC-UI-006-03 | Detail anomali dapat dibuka |
| AC-UI-006-04 | Status notifikasi tampil |

---

### FR-UI-007 — Model Evaluation Page

Halaman ini menampilkan evaluasi model.

Fitur:

1. RMSE LSTM.
2. MAE LSTM.
3. MAPE LSTM.
4. RMSE baseline.
5. MAE baseline.
6. MAPE baseline.
7. Tabel perbandingan LSTM vs baseline.
8. Grafik error atau aktual vs prediksi.

**Acceptance Criteria:**

| Kode | Kriteria |
|---|---|
| AC-UI-007-01 | RMSE/MAE/MAPE tampil |
| AC-UI-007-02 | Baseline result tampil |
| AC-UI-007-03 | Perbandingan LSTM vs baseline tampil |
| AC-UI-007-04 | Grafik evaluasi tampil |

---

### FR-UI-008 — Sensor Layout Page

Halaman ini menampilkan posisi sensor pada layout server testbed.

Fitur:

1. Upload gambar layout.
2. Menampilkan icon S1.
3. Menampilkan icon S2.
4. Menyimpan posisi icon.
5. Menampilkan warna icon berdasarkan status:
   - normal
   - waspada
   - anomali
   - trouble

**Acceptance Criteria:**

| Kode | Kriteria |
|---|---|
| AC-UI-008-01 | Gambar layout tampil |
| AC-UI-008-02 | Icon S1 tampil |
| AC-UI-008-03 | Icon S2 tampil |
| AC-UI-008-04 | Posisi icon dapat disimpan |
| AC-UI-008-05 | Warna/status icon sesuai status sensor |

---

### FR-UI-009 — Settings Page

Halaman settings digunakan untuk threshold dan konfigurasi dasar.

Setting awal:

| Setting | Default |
|---|---|
| normal_max_temperature | 30 |
| anomaly_min_temperature | 32 |
| telegram_enabled | true |
| notification_cooldown_minutes | 5 |
| sampling_interval_seconds | 60 |
| prediction_horizon_minutes | 5 |
| window_size | 30 |

**Acceptance Criteria:**

| Kode | Kriteria |
|---|---|
| AC-UI-009-01 | Settings tampil |
| AC-UI-009-02 | Threshold dapat diubah |
| AC-UI-009-03 | Cooldown dapat diubah |
| AC-UI-009-04 | Perubahan tersimpan ke backend |

---

## 6.6 Modul Telegram Notification

### FR-TG-001 — Konfigurasi Telegram

Sistem harus membaca konfigurasi Telegram dari environment.

```env
TELEGRAM_ENABLED=true
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
TELEGRAM_COOLDOWN_MINUTES=5
```

**Acceptance Criteria:**

| Kode | Kriteria |
|---|---|
| AC-TG-001-01 | Sistem membaca env Telegram |
| AC-TG-001-02 | Telegram bisa dinonaktifkan |
| AC-TG-001-03 | Token tidak hardcoded di kode |

---

### FR-TG-002 — Kirim Notifikasi Status Waspada

Sistem harus mengirim Telegram ketika status berubah menjadi waspada.

**Acceptance Criteria:**

| Kode | Kriteria |
|---|---|
| AC-TG-002-01 | Status waspada membuat notifikasi |
| AC-TG-002-02 | Pesan berisi suhu prediksi |
| AC-TG-002-03 | Pesan berisi waktu dan status |
| AC-TG-002-04 | Riwayat notifikasi tersimpan |

---

### FR-TG-003 — Kirim Notifikasi Status Anomali

Sistem harus mengirim Telegram ketika status berubah menjadi anomali.

**Acceptance Criteria:**

| Kode | Kriteria |
|---|---|
| AC-TG-003-01 | Status anomali membuat notifikasi |
| AC-TG-003-02 | Pesan berisi suhu prediksi |
| AC-TG-003-03 | Pesan berisi status anomali |
| AC-TG-003-04 | Riwayat notifikasi tersimpan |

---

### FR-TG-004 — Cooldown Notifikasi

Sistem harus mencegah spam notifikasi.

Aturan:

1. Status sama tidak dikirim ulang selama cooldown.
2. Jika status naik dari waspada ke anomali, notifikasi tetap dikirim.
3. Jika status kembali normal, sistem boleh mencatat recovery.
4. Error Telegram tidak boleh membuat backend/worker crash.

**Acceptance Criteria:**

| Kode | Kriteria |
|---|---|
| AC-TG-004-01 | Notifikasi tidak dikirim berulang dalam cooldown |
| AC-TG-004-02 | Eskalasi status tetap dikirim |
| AC-TG-004-03 | Error Telegram tersimpan |
| AC-TG-004-04 | Sistem tetap berjalan saat Telegram gagal |

---

## 7. Kebutuhan Non-Fungsional Detail

## 7.1 Performance

| Kode | Requirement |
|---|---|
| NFR-PERF-001 | Backend mampu menerima data sensor minimal setiap 1 menit |
| NFR-PERF-002 | Dashboard menampilkan update terbaru maksimal beberapa detik setelah data masuk |
| NFR-PERF-003 | Query historis 24 jam harus cukup cepat untuk grafik |
| NFR-PERF-004 | Inference LSTM tidak boleh mengganggu penerimaan data sensor |
| NFR-PERF-005 | Worker dapat dijalankan terpisah dari backend |

## 7.2 Reliability

| Kode | Requirement |
|---|---|
| NFR-REL-001 | Data invalid tidak masuk sebagai data valid |
| NFR-REL-002 | Sensor timeout dicatat sebagai trouble |
| NFR-REL-003 | Backend tetap berjalan meskipun Telegram gagal |
| NFR-REL-004 | ML Worker mencatat error training/inference |
| NFR-REL-005 | Simulator tersedia untuk fallback demo |

## 7.3 Security

| Kode | Requirement |
|---|---|
| NFR-SEC-001 | Endpoint gateway menggunakan token |
| NFR-SEC-002 | Token disimpan di `.env` |
| NFR-SEC-003 | Telegram token tidak ditulis hardcoded |
| NFR-SEC-004 | CORS dashboard diatur sesuai kebutuhan |
| NFR-SEC-005 | Input API divalidasi sebelum disimpan |

## 7.4 Maintainability

| Kode | Requirement |
|---|---|
| NFR-MAIN-001 | Struktur folder modular |
| NFR-MAIN-002 | Backend dipisah antara handler, service, repository |
| NFR-MAIN-003 | ML Worker dipisah antara preprocessing, training, evaluation, inference |
| NFR-MAIN-004 | Frontend menggunakan komponen reusable |
| NFR-MAIN-005 | README dan `.env.example` wajib tersedia |

## 7.5 Usability

| Kode | Requirement |
|---|---|
| NFR-USE-001 | Dashboard mudah dipahami |
| NFR-USE-002 | Status warna jelas |
| NFR-USE-003 | Grafik memiliki label |
| NFR-USE-004 | Tabel memiliki filter dasar |
| NFR-USE-005 | Layout sensor membantu memahami posisi S1/S2 |

---

## 8. Aturan Status dan Warna

## 8.1 Status Termal

| Status | Kriteria | Warna UI |
|---|---|---|
| Normal | Prediksi S2 < 30°C | Hijau |
| Waspada | Prediksi S2 30°C sampai 32°C | Kuning/Oranye |
| Anomali | Prediksi S2 > 32°C | Merah |
| Trouble | Sensor timeout/data invalid | Abu/Merah gelap |

## 8.2 Status Sensor

| Status | Kondisi |
|---|---|
| Normal | Sensor terbaca dan data valid |
| Trouble | Sensor timeout, data kosong, atau data tidak logis |
| Waspada | Status termal waspada terkait S2 |
| Anomali | Status termal anomali terkait S2 |

---

## 9. Error Handling

## 9.1 Gateway Error

| Error | Handling |
|---|---|
| Sensor timeout | Catat log lokal, kirim status trouble jika perlu |
| Serial port tidak ditemukan | Tampilkan error dan hentikan mode hardware |
| Backend down | Retry, simpan buffer lokal sederhana |
| Payload invalid | Jangan kirim sebagai data valid |

## 9.2 Backend Error

| Error | Handling |
|---|---|
| Token invalid | Return 401 |
| Payload invalid | Return 400 |
| Database error | Return 500 dan catat system log |
| SSE disconnect | Client reconnect |
| Telegram error | Simpan error, jangan crash |

## 9.3 ML Worker Error

| Error | Handling |
|---|---|
| Data kurang | Jangan training, tampilkan pesan data belum cukup |
| Missing value banyak | Catat warning |
| Model file tidak ditemukan | Jalankan training atau tampilkan error |
| Inference gagal | Catat system log |
| MAPE bermasalah karena nilai terlalu kecil | Catat dan hindari pembagian nol |

## 9.4 Frontend Error

| Error | Handling |
|---|---|
| API gagal | Tampilkan alert/toast |
| SSE putus | Reconnect atau fallback polling |
| Data kosong | Tampilkan empty state |
| Grafik tidak punya data | Tampilkan pesan data belum tersedia |

---

## 10. Kebutuhan Testing

Dokumen test plan terpisah akan dibuat, tetapi SRS menetapkan area testing wajib berikut:

| Area | Jenis Testing |
|---|---|
| Gateway | Unit/integration test pembacaan dan pengiriman payload |
| Backend API | API testing |
| Database | Migration dan query testing |
| Dashboard | UI/blackbox testing |
| SSE | Integration testing |
| ML Worker | Training/evaluation/inference testing |
| Alert | Telegram testing |
| End-to-End | Sensor/simulator sampai dashboard dan alert |

---

## 11. Acceptance Criteria Sistem Lengkap

Sistem dinyatakan memenuhi SRS apabila:

```text
[ ] Gateway dapat membaca atau mensimulasikan data S1 dan S2
[ ] Gateway mengirim payload JSON ke backend
[ ] Backend menolak request tanpa token
[ ] Backend menerima payload valid
[ ] Backend menyimpan data sensor ke PostgreSQL
[ ] Data historis dapat diambil berdasarkan sensor dan waktu
[ ] Dashboard menampilkan data terbaru S1 dan S2
[ ] Dashboard menampilkan grafik suhu dan kelembaban
[ ] Dashboard menampilkan prediksi suhu S2
[ ] Dashboard menampilkan status normal/waspada/anomali
[ ] Dashboard menampilkan layout sensor
[ ] ML Worker dapat melakukan preprocessing
[ ] ML Worker dapat melatih model LSTM
[ ] ML Worker dapat menghitung RMSE, MAE, dan MAPE
[ ] Baseline persistence atau moving average tersedia
[ ] Hasil LSTM dapat dibandingkan dengan baseline
[ ] Prediksi suhu S2 tersimpan ke database
[ ] Status termal tersimpan ke database
[ ] Telegram terkirim saat waspada/anomali
[ ] Cooldown Telegram berjalan
[ ] Error Telegram tidak membuat sistem crash
[ ] Simulator dapat digunakan untuk demo
[ ] README dan .env.example tersedia
```

---

## 12. Struktur Folder yang Direkomendasikan

```text
ems-lstm-thermal-anomaly/
├── backend-go/
│   ├── cmd/
│   ├── internal/
│   │   ├── config/
│   │   ├── handler/
│   │   ├── service/
│   │   ├── repository/
│   │   ├── model/
│   │   ├── sse/
│   │   └── telegram/
│   ├── migrations/
│   ├── go.mod
│   └── README.md
│
├── frontend-dashboard/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── lib/
│   │   ├── hooks/
│   │   └── types/
│   ├── package.json
│   └── README.md
│
├── gateway/
│   ├── src/
│   │   ├── main.py
│   │   ├── modbus_reader.py
│   │   ├── simulator.py
│   │   └── sender.py
│   ├── config.example.yaml
│   └── requirements.txt
│
├── ml-worker/
│   ├── src/
│   │   ├── load_dataset.py
│   │   ├── preprocess.py
│   │   ├── windowing.py
│   │   ├── train_lstm.py
│   │   ├── baseline.py
│   │   ├── evaluate.py
│   │   └── inference.py
│   ├── models/
│   ├── notebooks/
│   └── requirements.txt
│
├── database/
│   ├── schema.sql
│   └── seed.sql
│
├── docs/
│   ├── 01_PRD_EMS_LSTM_Thermal_Anomaly.md
│   └── 02_SRS_EMS_LSTM_Thermal_Anomaly.md
│
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## 13. Instruksi Implementasi untuk AI Agent

AI agent harus mengikuti instruksi ini:

1. Baca PRD dan SRS sebelum menulis kode.
2. Jangan membuat fitur di luar scope.
3. Jangan membuat kontrol pendingin otomatis.
4. Jangan membuat PUE aktual.
5. Jangan mengganti LSTM sebagai model utama.
6. Implementasikan simulator sensor sejak awal.
7. Implementasikan backend API sebelum dashboard penuh.
8. Implementasikan database schema sebelum ML integration.
9. Gunakan TypeScript pada frontend.
10. Gunakan shadcn/ui untuk komponen UI.
11. Gunakan Chart.js untuk grafik utama.
12. Gunakan SSE untuk update dashboard.
13. Simpan semua secret di `.env`.
14. Buat `.env.example`.
15. Buat README setup.
16. Pastikan sistem bisa dijalankan lokal dan didemokan.

---

## 14. Dokumen Lanjutan

Setelah SRS ini, dokumen berikutnya adalah:

```text
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
