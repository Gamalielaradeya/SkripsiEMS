# 04 Database Design — EMS LSTM Thermal Anomaly Monitoring System

**Judul Skripsi:** Prediksi Anomali Termal pada Environment Monitoring System Server Menggunakan Algoritma Long Short-Term Memory  
**Jenis Dokumen:** Database Design Document  
**Versi:** 1.0  
**Status:** Final untuk dasar implementasi AI Agent  
**Target Pengguna Dokumen:** AI coding agent, developer, mahasiswa, dan reviewer teknis  
**Tanggal:** 2026-05-23  

---

## 1. Tujuan Dokumen

Dokumen ini menjelaskan rancangan database untuk sistem **EMS LSTM Thermal Anomaly Monitoring System**.

Database digunakan untuk menyimpan:

1. Identitas gateway dan sensor.
2. Data suhu dan kelembaban sebagai time-series.
3. Hasil prediksi suhu S2.
4. Status normal, waspada, anomali, dan trouble.
5. Versi model LSTM.
6. Hasil evaluasi RMSE, MAE, MAPE.
7. Hasil baseline sederhana.
8. Layout dashboard dan posisi sensor.
9. Icon status sensor.
10. Riwayat notifikasi Telegram.
11. Pengaturan threshold.
12. Log sistem.

Dokumen ini dibuat agar AI coding agent dapat membuat schema database, migration, query, dan integrasi backend/ML/dashboard secara konsisten.

---

## 2. Database Engine

Database utama:

```text
PostgreSQL
```

Ekstensi time-series:

```text
TimescaleDB apabila memungkinkan
```

Jika TimescaleDB belum tersedia, sistem tetap dapat berjalan menggunakan PostgreSQL biasa dengan index timestamp.

---

## 3. Prinsip Desain Database

Database dirancang berdasarkan prinsip berikut:

1. **Time-series oriented**  
   Data sensor disimpan berdasarkan timestamp karena EMS menghasilkan data periodik.

2. **Traceable ML result**  
   Setiap hasil prediksi dan evaluasi harus dapat ditelusuri ke versi model yang digunakan.

3. **Sensor role clarity**  
   Sensor S1 dan S2 harus dibedakan dengan jelas karena S1 berperan sebagai ambient/reference dan S2 sebagai hotspot/target prediksi.

4. **Dashboard-ready**  
   Struktur data harus mendukung dashboard, grafik, layout sensor, dan riwayat anomali.

5. **Alert history preserved**  
   Setiap notifikasi Telegram harus dicatat, baik berhasil maupun gagal.

6. **Configurable threshold**  
   Threshold status termal harus dapat diubah melalui konfigurasi atau tabel settings.

7. **Development friendly**  
   Schema harus tetap realistis untuk skripsi dan tidak terlalu kompleks.

---

## 4. Ringkasan Entitas Utama

Berdasarkan rancangan skripsi, tabel utama yang wajib tersedia adalah:

| Tabel | Fungsi |
|---|---|
| `sensors` | Menyimpan identitas sensor, tipe sensor, lokasi sensor, dan status sensor |
| `sensor_readings` | Menyimpan data suhu dan kelembaban berdasarkan timestamp |
| `model_versions` | Menyimpan informasi versi model LSTM |
| `predictions` | Menyimpan hasil prediksi suhu S2 |
| `anomaly_events` | Menyimpan status normal, waspada, atau anomali berdasarkan hasil prediksi |
| `model_metrics` | Menyimpan hasil evaluasi RMSE, MAE, MAPE, dan baseline |
| `notification_logs` | Menyimpan riwayat pengiriman notifikasi Telegram |
| `layouts` | Menyimpan gambar layout server testbed atau ruangan |
| `layout_devices` | Menyimpan posisi sensor pada gambar layout |
| `status_icons` | Menyimpan icon/gif untuk status normal, waspada, anomali, dan trouble |

Selain tabel utama, sistem juga membutuhkan tabel pendukung:

| Tabel | Fungsi |
|---|---|
| `gateways` | Menyimpan identitas Raspberry Pi gateway |
| `settings` | Menyimpan konfigurasi threshold dan parameter sistem |
| `api_tokens` | Menyimpan token sederhana untuk autentikasi gateway |
| `system_logs` | Menyimpan log error atau aktivitas sistem |
| `prediction_runs` | Menyimpan riwayat proses inference/prediction |
| `baseline_results` | Menyimpan hasil baseline secara terpisah agar mudah dibandingkan |

---

## 5. Entity Relationship Diagram

### 5.1 ERD Ringkas

```text
gateways 1 ────< sensors
gateways 1 ────< sensor_readings
sensors  1 ────< sensor_readings

model_versions 1 ────< predictions
sensors        1 ────< predictions

predictions 1 ────< anomaly_events
sensors     1 ────< anomaly_events

model_versions 1 ────< model_metrics
model_versions 1 ────< baseline_results

anomaly_events 1 ────< notification_logs

layouts 1 ────< layout_devices
sensors 1 ────< layout_devices
status_icons 1 ────< layout_devices

gateways 1 ────< api_tokens
```

### 5.2 ERD Tekstual

```text
[gateways]
- id PK
- gateway_code

[sensors]
- id PK
- gateway_id FK -> gateways.id
- sensor_code
- sensor_role

[sensor_readings]
- id PK
- gateway_id FK -> gateways.id
- sensor_id FK -> sensors.id
- temperature
- humidity
- recorded_at

[model_versions]
- id PK
- model_name
- version
- window_size
- horizon_minutes

[predictions]
- id PK
- model_version_id FK -> model_versions.id
- target_sensor_id FK -> sensors.id
- predicted_temperature
- predicted_for

[anomaly_events]
- id PK
- prediction_id FK -> predictions.id
- sensor_id FK -> sensors.id
- status
- detected_at

[model_metrics]
- id PK
- model_version_id FK -> model_versions.id
- rmse
- mae
- mape

[baseline_results]
- id PK
- model_version_id FK -> model_versions.id
- baseline_type
- rmse
- mae
- mape

[notification_logs]
- id PK
- anomaly_event_id FK -> anomaly_events.id
- channel
- status
- sent_at

[layouts]
- id PK
- image_path

[layout_devices]
- id PK
- layout_id FK -> layouts.id
- sensor_id FK -> sensors.id
- status_icon_id FK -> status_icons.id

[status_icons]
- id PK
- status
- icon_path
```

---

## 6. Naming Convention

| Item | Convention | Contoh |
|---|---|---|
| Table | snake_case plural | `sensor_readings` |
| Primary key | `id` | `id BIGSERIAL PRIMARY KEY` |
| Foreign key | `<table_singular>_id` | `sensor_id` |
| Timestamp event | `<event>_at` | `recorded_at`, `detected_at` |
| Created time | `created_at` | `created_at TIMESTAMPTZ` |
| Updated time | `updated_at` | `updated_at TIMESTAMPTZ` |
| Status | lowercase string | `normal`, `waspada`, `anomali` |

---

## 7. Enum dan Status

PostgreSQL enum dapat digunakan, tetapi untuk fleksibilitas development, status dapat disimpan sebagai `VARCHAR` dengan CHECK constraint.

### 7.1 Sensor Role

| Value | Keterangan |
|---|---|
| `ambient` | Sensor S1 sebagai referensi ruangan |
| `hotspot` | Sensor S2 sebagai area hotspot/exhaust |

### 7.2 Sensor Code

| Value | Keterangan |
|---|---|
| `S1` | Sensor ambient/reference |
| `S2` | Sensor hotspot/exhaust |

### 7.3 Sensor Status

| Value | Keterangan |
|---|---|
| `normal` | Sensor terbaca normal |
| `waspada` | Sensor terkait status waspada |
| `anomali` | Sensor terkait status anomali |
| `trouble` | Sensor timeout, tidak terbaca, atau data tidak valid |
| `inactive` | Sensor tidak digunakan sementara |

### 7.4 Thermal Status

| Value | Keterangan |
|---|---|
| `normal` | Prediksi S2 < 30°C |
| `waspada` | Prediksi S2 30°C sampai 32°C |
| `anomali` | Prediksi S2 > 32°C |

### 7.5 Data Quality Status

| Value | Keterangan |
|---|---|
| `valid` | Data valid |
| `invalid` | Data tidak valid |
| `timeout` | Sensor timeout |
| `simulated` | Data berasal dari simulator |

### 7.6 Notification Status

| Value | Keterangan |
|---|---|
| `pending` | Belum dikirim |
| `sent` | Berhasil dikirim |
| `failed` | Gagal dikirim |
| `skipped` | Tidak dikirim karena cooldown atau konfigurasi |

---

## 8. Rancangan Tabel Detail

## 8.1 Tabel `gateways`

### Fungsi

Menyimpan data Raspberry Pi gateway atau simulator yang mengirimkan data sensor ke backend.

### Struktur

| Kolom | Tipe | Constraint | Keterangan |
|---|---|---|---|
| `id` | BIGSERIAL | PK | ID gateway |
| `gateway_code` | VARCHAR(100) | UNIQUE, NOT NULL | Kode gateway |
| `name` | VARCHAR(150) | NOT NULL | Nama gateway |
| `location` | VARCHAR(255) | NULL | Lokasi gateway |
| `description` | TEXT | NULL | Deskripsi |
| `ip_address` | INET | NULL | IP gateway jika tersedia |
| `status` | VARCHAR(30) | NOT NULL DEFAULT `active` | Status gateway |
| `last_seen_at` | TIMESTAMPTZ | NULL | Terakhir mengirim data |
| `created_at` | TIMESTAMPTZ | NOT NULL DEFAULT now() | Waktu dibuat |
| `updated_at` | TIMESTAMPTZ | NOT NULL DEFAULT now() | Waktu update |

### DDL

```sql
CREATE TABLE gateways (
    id BIGSERIAL PRIMARY KEY,
    gateway_code VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    location VARCHAR(255),
    description TEXT,
    ip_address INET,
    status VARCHAR(30) NOT NULL DEFAULT 'active',
    last_seen_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## 8.2 Tabel `sensors`

### Fungsi

Menyimpan identitas sensor XY-MD02 yang digunakan pada sistem.

### Data Awal

| sensor_code | sensor_role | name | location |
|---|---|---|---|
| S1 | ambient | S1 Ambient Sensor | Area ambient/reference |
| S2 | hotspot | S2 Hotspot Sensor | Area hotspot/exhaust |

### Struktur

| Kolom | Tipe | Constraint | Keterangan |
|---|---|---|---|
| `id` | BIGSERIAL | PK | ID sensor |
| `gateway_id` | BIGINT | FK | Gateway pembaca sensor |
| `sensor_code` | VARCHAR(20) | NOT NULL | S1/S2 |
| `sensor_role` | VARCHAR(30) | NOT NULL | ambient/hotspot |
| `name` | VARCHAR(150) | NOT NULL | Nama sensor |
| `type` | VARCHAR(100) | NOT NULL DEFAULT `XY-MD02` | Tipe sensor |
| `location` | VARCHAR(255) | NULL | Lokasi sensor |
| `modbus_slave_id` | INT | NULL | Slave ID Modbus |
| `status` | VARCHAR(30) | NOT NULL DEFAULT `normal` | Status sensor |
| `last_seen_at` | TIMESTAMPTZ | NULL | Data terakhir masuk |
| `created_at` | TIMESTAMPTZ | NOT NULL DEFAULT now() | Waktu dibuat |
| `updated_at` | TIMESTAMPTZ | NOT NULL DEFAULT now() | Waktu update |

### DDL

```sql
CREATE TABLE sensors (
    id BIGSERIAL PRIMARY KEY,
    gateway_id BIGINT REFERENCES gateways(id) ON DELETE SET NULL,
    sensor_code VARCHAR(20) NOT NULL,
    sensor_role VARCHAR(30) NOT NULL,
    name VARCHAR(150) NOT NULL,
    type VARCHAR(100) NOT NULL DEFAULT 'XY-MD02',
    location VARCHAR(255),
    modbus_slave_id INT,
    status VARCHAR(30) NOT NULL DEFAULT 'normal',
    last_seen_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_sensor_code CHECK (sensor_code IN ('S1', 'S2')),
    CONSTRAINT chk_sensor_role CHECK (sensor_role IN ('ambient', 'hotspot')),
    CONSTRAINT chk_sensor_status CHECK (status IN ('normal', 'waspada', 'anomali', 'trouble', 'inactive')),
    CONSTRAINT uq_gateway_sensor_code UNIQUE (gateway_id, sensor_code)
);
```

---

## 8.3 Tabel `sensor_readings`

### Fungsi

Menyimpan data suhu dan kelembaban dari sensor sebagai time-series.

Tabel ini adalah tabel paling penting untuk:

1. Monitoring dashboard.
2. Grafik suhu dan kelembaban.
3. Preprocessing LSTM.
4. Training model.
5. Testing model.
6. Evaluasi prediksi.

### Struktur

| Kolom | Tipe | Constraint | Keterangan |
|---|---|---|---|
| `id` | BIGSERIAL | PK | ID reading |
| `gateway_id` | BIGINT | FK, NOT NULL | Gateway pengirim data |
| `sensor_id` | BIGINT | FK, NOT NULL | Sensor sumber data |
| `temperature` | NUMERIC(6,2) | NOT NULL | Suhu |
| `humidity` | NUMERIC(6,2) | NOT NULL | Kelembaban |
| `recorded_at` | TIMESTAMPTZ | NOT NULL | Waktu pembacaan |
| `quality_status` | VARCHAR(30) | NOT NULL DEFAULT `valid` | Status kualitas data |
| `raw_payload` | JSONB | NULL | Payload asli |
| `created_at` | TIMESTAMPTZ | NOT NULL DEFAULT now() | Waktu tersimpan |

### DDL

```sql
CREATE TABLE sensor_readings (
    id BIGSERIAL PRIMARY KEY,
    gateway_id BIGINT NOT NULL REFERENCES gateways(id) ON DELETE CASCADE,
    sensor_id BIGINT NOT NULL REFERENCES sensors(id) ON DELETE CASCADE,
    temperature NUMERIC(6,2) NOT NULL,
    humidity NUMERIC(6,2) NOT NULL,
    recorded_at TIMESTAMPTZ NOT NULL,
    quality_status VARCHAR(30) NOT NULL DEFAULT 'valid',
    raw_payload JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_temperature_range CHECK (temperature >= 0 AND temperature <= 80),
    CONSTRAINT chk_humidity_range CHECK (humidity >= 0 AND humidity <= 100),
    CONSTRAINT chk_quality_status CHECK (quality_status IN ('valid', 'invalid', 'timeout', 'simulated'))
);
```

### Index

```sql
CREATE INDEX idx_sensor_readings_recorded_at
ON sensor_readings (recorded_at DESC);

CREATE INDEX idx_sensor_readings_sensor_recorded
ON sensor_readings (sensor_id, recorded_at DESC);

CREATE INDEX idx_sensor_readings_gateway_recorded
ON sensor_readings (gateway_id, recorded_at DESC);

CREATE INDEX idx_sensor_readings_quality
ON sensor_readings (quality_status);
```

### TimescaleDB Hypertable

Jika TimescaleDB tersedia:

```sql
CREATE EXTENSION IF NOT EXISTS timescaledb;

SELECT create_hypertable(
    'sensor_readings',
    'recorded_at',
    if_not_exists => TRUE
);
```

---

## 8.4 Tabel `model_versions`

### Fungsi

Menyimpan informasi model LSTM yang digunakan untuk training, evaluasi, dan prediksi.

### Struktur

| Kolom | Tipe | Constraint | Keterangan |
|---|---|---|---|
| `id` | BIGSERIAL | PK | ID model |
| `model_name` | VARCHAR(150) | NOT NULL | Nama model |
| `model_type` | VARCHAR(50) | NOT NULL | LSTM |
| `version` | VARCHAR(50) | NOT NULL | Versi model |
| `algorithm` | VARCHAR(100) | NOT NULL | Long Short-Term Memory |
| `feature_columns` | JSONB | NOT NULL | Daftar fitur input |
| `target_column` | VARCHAR(100) | NOT NULL | Target prediksi |
| `window_size` | INT | NOT NULL | Window input |
| `horizon_minutes` | INT | NOT NULL | Horizon prediksi |
| `sampling_interval_seconds` | INT | NOT NULL | Interval sampling |
| `model_path` | TEXT | NULL | Path file model |
| `scaler_path` | TEXT | NULL | Path scaler |
| `parameters` | JSONB | NULL | Parameter model |
| `trained_at` | TIMESTAMPTZ | NULL | Waktu training |
| `created_at` | TIMESTAMPTZ | NOT NULL DEFAULT now() | Waktu dibuat |

### DDL

```sql
CREATE TABLE model_versions (
    id BIGSERIAL PRIMARY KEY,
    model_name VARCHAR(150) NOT NULL,
    model_type VARCHAR(50) NOT NULL DEFAULT 'LSTM',
    version VARCHAR(50) NOT NULL,
    algorithm VARCHAR(100) NOT NULL DEFAULT 'Long Short-Term Memory',
    feature_columns JSONB NOT NULL,
    target_column VARCHAR(100) NOT NULL DEFAULT 'temperature_s2',
    window_size INT NOT NULL DEFAULT 30,
    horizon_minutes INT NOT NULL DEFAULT 5,
    sampling_interval_seconds INT NOT NULL DEFAULT 60,
    model_path TEXT,
    scaler_path TEXT,
    parameters JSONB,
    trained_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_model_version UNIQUE (model_name, version)
);
```

---

## 8.5 Tabel `prediction_runs`

### Fungsi

Menyimpan riwayat proses inferensi atau batch prediction.

Tabel ini membantu debugging ketika ML worker dijalankan berkali-kali.

### Struktur

| Kolom | Tipe | Constraint | Keterangan |
|---|---|---|---|
| `id` | BIGSERIAL | PK | ID run |
| `model_version_id` | BIGINT | FK | Versi model |
| `run_type` | VARCHAR(30) | NOT NULL | training/inference/batch |
| `started_at` | TIMESTAMPTZ | NOT NULL | Mulai |
| `finished_at` | TIMESTAMPTZ | NULL | Selesai |
| `status` | VARCHAR(30) | NOT NULL | running/success/failed |
| `message` | TEXT | NULL | Pesan |
| `metadata` | JSONB | NULL | Metadata tambahan |

### DDL

```sql
CREATE TABLE prediction_runs (
    id BIGSERIAL PRIMARY KEY,
    model_version_id BIGINT REFERENCES model_versions(id) ON DELETE SET NULL,
    run_type VARCHAR(30) NOT NULL,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    finished_at TIMESTAMPTZ,
    status VARCHAR(30) NOT NULL DEFAULT 'running',
    message TEXT,
    metadata JSONB,

    CONSTRAINT chk_prediction_run_type CHECK (run_type IN ('training', 'inference', 'batch')),
    CONSTRAINT chk_prediction_run_status CHECK (status IN ('running', 'success', 'failed'))
);
```

---

## 8.6 Tabel `predictions`

### Fungsi

Menyimpan hasil prediksi suhu S2 yang dihasilkan oleh model LSTM.

### Struktur

| Kolom | Tipe | Constraint | Keterangan |
|---|---|---|---|
| `id` | BIGSERIAL | PK | ID prediksi |
| `prediction_run_id` | BIGINT | FK | Run inference |
| `model_version_id` | BIGINT | FK, NOT NULL | Versi model |
| `target_sensor_id` | BIGINT | FK, NOT NULL | Sensor target, yaitu S2 |
| `predicted_temperature` | NUMERIC(6,2) | NOT NULL | Suhu prediksi S2 |
| `prediction_horizon_minutes` | INT | NOT NULL | Horizon prediksi |
| `input_window_size` | INT | NOT NULL | Window input |
| `input_start_at` | TIMESTAMPTZ | NULL | Awal window input |
| `input_end_at` | TIMESTAMPTZ | NULL | Akhir window input |
| `predicted_for` | TIMESTAMPTZ | NOT NULL | Waktu target prediksi |
| `created_at` | TIMESTAMPTZ | NOT NULL DEFAULT now() | Waktu prediksi dibuat |
| `metadata` | JSONB | NULL | Data tambahan |

### DDL

```sql
CREATE TABLE predictions (
    id BIGSERIAL PRIMARY KEY,
    prediction_run_id BIGINT REFERENCES prediction_runs(id) ON DELETE SET NULL,
    model_version_id BIGINT NOT NULL REFERENCES model_versions(id) ON DELETE RESTRICT,
    target_sensor_id BIGINT NOT NULL REFERENCES sensors(id) ON DELETE RESTRICT,
    predicted_temperature NUMERIC(6,2) NOT NULL,
    prediction_horizon_minutes INT NOT NULL DEFAULT 5,
    input_window_size INT NOT NULL DEFAULT 30,
    input_start_at TIMESTAMPTZ,
    input_end_at TIMESTAMPTZ,
    predicted_for TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    metadata JSONB
);
```

### Index

```sql
CREATE INDEX idx_predictions_predicted_for
ON predictions (predicted_for DESC);

CREATE INDEX idx_predictions_target_sensor
ON predictions (target_sensor_id, predicted_for DESC);

CREATE INDEX idx_predictions_model_version
ON predictions (model_version_id);
```

---

## 8.7 Tabel `anomaly_events`

### Fungsi

Menyimpan hasil klasifikasi status termal berdasarkan prediksi suhu S2.

Status:

1. `normal`
2. `waspada`
3. `anomali`

### Struktur

| Kolom | Tipe | Constraint | Keterangan |
|---|---|---|---|
| `id` | BIGSERIAL | PK | ID anomali/status |
| `prediction_id` | BIGINT | FK, NOT NULL | Prediksi sumber |
| `sensor_id` | BIGINT | FK, NOT NULL | Sensor target |
| `status` | VARCHAR(30) | NOT NULL | normal/waspada/anomali |
| `predicted_temperature` | NUMERIC(6,2) | NOT NULL | Suhu prediksi |
| `actual_temperature` | NUMERIC(6,2) | NULL | Suhu aktual jika tersedia |
| `threshold_normal_max` | NUMERIC(6,2) | NOT NULL DEFAULT 30 | Batas normal |
| `threshold_anomaly_min` | NUMERIC(6,2) | NOT NULL DEFAULT 32 | Batas anomali |
| `description` | TEXT | NULL | Deskripsi |
| `detected_at` | TIMESTAMPTZ | NOT NULL | Waktu deteksi |
| `created_at` | TIMESTAMPTZ | NOT NULL DEFAULT now() | Waktu tersimpan |

### DDL

```sql
CREATE TABLE anomaly_events (
    id BIGSERIAL PRIMARY KEY,
    prediction_id BIGINT NOT NULL REFERENCES predictions(id) ON DELETE CASCADE,
    sensor_id BIGINT NOT NULL REFERENCES sensors(id) ON DELETE RESTRICT,
    status VARCHAR(30) NOT NULL,
    predicted_temperature NUMERIC(6,2) NOT NULL,
    actual_temperature NUMERIC(6,2),
    threshold_normal_max NUMERIC(6,2) NOT NULL DEFAULT 30.00,
    threshold_anomaly_min NUMERIC(6,2) NOT NULL DEFAULT 32.00,
    description TEXT,
    detected_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_anomaly_status CHECK (status IN ('normal', 'waspada', 'anomali'))
);
```

### Index

```sql
CREATE INDEX idx_anomaly_events_detected_at
ON anomaly_events (detected_at DESC);

CREATE INDEX idx_anomaly_events_status
ON anomaly_events (status);

CREATE INDEX idx_anomaly_events_sensor_detected
ON anomaly_events (sensor_id, detected_at DESC);
```

---

## 8.8 Tabel `model_metrics`

### Fungsi

Menyimpan hasil evaluasi model LSTM menggunakan RMSE, MAE, dan MAPE.

### Struktur

| Kolom | Tipe | Constraint | Keterangan |
|---|---|---|---|
| `id` | BIGSERIAL | PK | ID metric |
| `model_version_id` | BIGINT | FK, NOT NULL | Versi model |
| `dataset_start_at` | TIMESTAMPTZ | NULL | Awal dataset |
| `dataset_end_at` | TIMESTAMPTZ | NULL | Akhir dataset |
| `train_size` | INT | NULL | Jumlah data train |
| `test_size` | INT | NULL | Jumlah data test |
| `rmse` | NUMERIC(10,4) | NOT NULL | Root Mean Square Error |
| `mae` | NUMERIC(10,4) | NOT NULL | Mean Absolute Error |
| `mape` | NUMERIC(10,4) | NOT NULL | Mean Absolute Percentage Error |
| `metadata` | JSONB | NULL | Detail tambahan |
| `created_at` | TIMESTAMPTZ | NOT NULL DEFAULT now() | Waktu tersimpan |

### DDL

```sql
CREATE TABLE model_metrics (
    id BIGSERIAL PRIMARY KEY,
    model_version_id BIGINT NOT NULL REFERENCES model_versions(id) ON DELETE CASCADE,
    dataset_start_at TIMESTAMPTZ,
    dataset_end_at TIMESTAMPTZ,
    train_size INT,
    test_size INT,
    rmse NUMERIC(10,4) NOT NULL,
    mae NUMERIC(10,4) NOT NULL,
    mape NUMERIC(10,4) NOT NULL,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## 8.9 Tabel `baseline_results`

### Fungsi

Menyimpan hasil baseline sederhana seperti persistence model dan moving average.

Tabel ini dibuat terpisah dari `model_metrics` agar perbandingan LSTM vs baseline lebih mudah ditampilkan di dashboard.

### Struktur

| Kolom | Tipe | Constraint | Keterangan |
|---|---|---|---|
| `id` | BIGSERIAL | PK | ID baseline |
| `model_version_id` | BIGINT | FK | Versi LSTM pembanding |
| `baseline_type` | VARCHAR(50) | NOT NULL | persistence/moving_average |
| `dataset_start_at` | TIMESTAMPTZ | NULL | Awal dataset |
| `dataset_end_at` | TIMESTAMPTZ | NULL | Akhir dataset |
| `rmse` | NUMERIC(10,4) | NOT NULL | RMSE |
| `mae` | NUMERIC(10,4) | NOT NULL | MAE |
| `mape` | NUMERIC(10,4) | NOT NULL | MAPE |
| `parameters` | JSONB | NULL | Parameter baseline |
| `created_at` | TIMESTAMPTZ | NOT NULL DEFAULT now() | Waktu tersimpan |

### DDL

```sql
CREATE TABLE baseline_results (
    id BIGSERIAL PRIMARY KEY,
    model_version_id BIGINT REFERENCES model_versions(id) ON DELETE SET NULL,
    baseline_type VARCHAR(50) NOT NULL,
    dataset_start_at TIMESTAMPTZ,
    dataset_end_at TIMESTAMPTZ,
    rmse NUMERIC(10,4) NOT NULL,
    mae NUMERIC(10,4) NOT NULL,
    mape NUMERIC(10,4) NOT NULL,
    parameters JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_baseline_type CHECK (baseline_type IN ('persistence', 'moving_average'))
);
```

---

## 8.10 Tabel `notification_logs`

### Fungsi

Menyimpan riwayat notifikasi Telegram.

### Struktur

| Kolom | Tipe | Constraint | Keterangan |
|---|---|---|---|
| `id` | BIGSERIAL | PK | ID notifikasi |
| `anomaly_event_id` | BIGINT | FK | Event pemicu |
| `channel` | VARCHAR(30) | NOT NULL | telegram |
| `recipient` | VARCHAR(255) | NULL | Chat ID |
| `message` | TEXT | NOT NULL | Isi pesan |
| `status` | VARCHAR(30) | NOT NULL | pending/sent/failed/skipped |
| `sent_at` | TIMESTAMPTZ | NULL | Waktu terkirim |
| `error_message` | TEXT | NULL | Error jika gagal |
| `created_at` | TIMESTAMPTZ | NOT NULL DEFAULT now() | Waktu dibuat |

### DDL

```sql
CREATE TABLE notification_logs (
    id BIGSERIAL PRIMARY KEY,
    anomaly_event_id BIGINT REFERENCES anomaly_events(id) ON DELETE SET NULL,
    channel VARCHAR(30) NOT NULL DEFAULT 'telegram',
    recipient VARCHAR(255),
    message TEXT NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'pending',
    sent_at TIMESTAMPTZ,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_notification_channel CHECK (channel IN ('telegram')),
    CONSTRAINT chk_notification_status CHECK (status IN ('pending', 'sent', 'failed', 'skipped'))
);
```

---

## 8.11 Tabel `layouts`

### Fungsi

Menyimpan gambar layout server testbed atau ruangan.

### Struktur

| Kolom | Tipe | Constraint | Keterangan |
|---|---|---|---|
| `id` | BIGSERIAL | PK | ID layout |
| `name` | VARCHAR(150) | NOT NULL | Nama layout |
| `image_path` | TEXT | NOT NULL | Path gambar layout |
| `description` | TEXT | NULL | Deskripsi |
| `is_active` | BOOLEAN | NOT NULL DEFAULT false | Layout aktif |
| `created_at` | TIMESTAMPTZ | NOT NULL DEFAULT now() | Waktu dibuat |
| `updated_at` | TIMESTAMPTZ | NOT NULL DEFAULT now() | Waktu update |

### DDL

```sql
CREATE TABLE layouts (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    image_path TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## 8.12 Tabel `status_icons`

### Fungsi

Menyimpan icon atau gif yang digunakan pada dashboard untuk status sensor.

### Struktur

| Kolom | Tipe | Constraint | Keterangan |
|---|---|---|---|
| `id` | BIGSERIAL | PK | ID icon |
| `status` | VARCHAR(30) | NOT NULL UNIQUE | normal/waspada/anomali/trouble |
| `label` | VARCHAR(100) | NOT NULL | Label status |
| `icon_path` | TEXT | NULL | Path icon |
| `color_hex` | VARCHAR(20) | NULL | Warna status |
| `created_at` | TIMESTAMPTZ | NOT NULL DEFAULT now() | Waktu dibuat |
| `updated_at` | TIMESTAMPTZ | NOT NULL DEFAULT now() | Waktu update |

### DDL

```sql
CREATE TABLE status_icons (
    id BIGSERIAL PRIMARY KEY,
    status VARCHAR(30) NOT NULL UNIQUE,
    label VARCHAR(100) NOT NULL,
    icon_path TEXT,
    color_hex VARCHAR(20),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_status_icon_status CHECK (status IN ('normal', 'waspada', 'anomali', 'trouble'))
);
```

---

## 8.13 Tabel `layout_devices`

### Fungsi

Menyimpan posisi sensor pada gambar layout dashboard.

### Struktur

| Kolom | Tipe | Constraint | Keterangan |
|---|---|---|---|
| `id` | BIGSERIAL | PK | ID device layout |
| `layout_id` | BIGINT | FK, NOT NULL | Layout |
| `sensor_id` | BIGINT | FK, NOT NULL | Sensor |
| `status_icon_id` | BIGINT | FK | Icon status |
| `x_position` | NUMERIC(7,4) | NOT NULL | Posisi X, persen/pixel |
| `y_position` | NUMERIC(7,4) | NOT NULL | Posisi Y, persen/pixel |
| `label` | VARCHAR(150) | NULL | Label tampilan |
| `created_at` | TIMESTAMPTZ | NOT NULL DEFAULT now() | Waktu dibuat |
| `updated_at` | TIMESTAMPTZ | NOT NULL DEFAULT now() | Waktu update |

### DDL

```sql
CREATE TABLE layout_devices (
    id BIGSERIAL PRIMARY KEY,
    layout_id BIGINT NOT NULL REFERENCES layouts(id) ON DELETE CASCADE,
    sensor_id BIGINT NOT NULL REFERENCES sensors(id) ON DELETE CASCADE,
    status_icon_id BIGINT REFERENCES status_icons(id) ON DELETE SET NULL,
    x_position NUMERIC(7,4) NOT NULL,
    y_position NUMERIC(7,4) NOT NULL,
    label VARCHAR(150),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_layout_sensor UNIQUE (layout_id, sensor_id)
);
```

---

## 8.14 Tabel `settings`

### Fungsi

Menyimpan konfigurasi sistem seperti threshold dan cooldown notifikasi.

### Data Awal

| key | value |
|---|---|
| `normal_max_temperature` | `30` |
| `anomaly_min_temperature` | `32` |
| `notification_cooldown_minutes` | `5` |
| `sampling_interval_seconds` | `60` |
| `window_size` | `30` |
| `prediction_horizon_minutes` | `5` |
| `telegram_enabled` | `true` |

### Struktur

| Kolom | Tipe | Constraint | Keterangan |
|---|---|---|---|
| `id` | BIGSERIAL | PK | ID setting |
| `key` | VARCHAR(100) | UNIQUE, NOT NULL | Nama setting |
| `value` | TEXT | NOT NULL | Nilai |
| `value_type` | VARCHAR(30) | NOT NULL | number/string/boolean |
| `description` | TEXT | NULL | Deskripsi |
| `created_at` | TIMESTAMPTZ | NOT NULL DEFAULT now() | Waktu dibuat |
| `updated_at` | TIMESTAMPTZ | NOT NULL DEFAULT now() | Waktu update |

### DDL

```sql
CREATE TABLE settings (
    id BIGSERIAL PRIMARY KEY,
    key VARCHAR(100) NOT NULL UNIQUE,
    value TEXT NOT NULL,
    value_type VARCHAR(30) NOT NULL DEFAULT 'string',
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_setting_value_type CHECK (value_type IN ('string', 'number', 'boolean', 'json'))
);
```

---

## 8.15 Tabel `api_tokens`

### Fungsi

Menyimpan token sederhana untuk autentikasi Raspberry Pi gateway.

### Struktur

| Kolom | Tipe | Constraint | Keterangan |
|---|---|---|---|
| `id` | BIGSERIAL | PK | ID token |
| `gateway_id` | BIGINT | FK | Gateway |
| `token_hash` | TEXT | NOT NULL | Hash token |
| `name` | VARCHAR(150) | NOT NULL | Nama token |
| `is_active` | BOOLEAN | NOT NULL DEFAULT true | Aktif/tidak |
| `last_used_at` | TIMESTAMPTZ | NULL | Terakhir digunakan |
| `created_at` | TIMESTAMPTZ | NOT NULL DEFAULT now() | Waktu dibuat |

### DDL

```sql
CREATE TABLE api_tokens (
    id BIGSERIAL PRIMARY KEY,
    gateway_id BIGINT REFERENCES gateways(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL,
    name VARCHAR(150) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## 8.16 Tabel `system_logs`

### Fungsi

Menyimpan log kesalahan atau aktivitas penting dari gateway/backend/ML worker.

### Struktur

| Kolom | Tipe | Constraint | Keterangan |
|---|---|---|---|
| `id` | BIGSERIAL | PK | ID log |
| `source` | VARCHAR(50) | NOT NULL | gateway/backend/ml-worker/frontend |
| `level` | VARCHAR(30) | NOT NULL | info/warning/error |
| `message` | TEXT | NOT NULL | Pesan |
| `context` | JSONB | NULL | Data tambahan |
| `created_at` | TIMESTAMPTZ | NOT NULL DEFAULT now() | Waktu dibuat |

### DDL

```sql
CREATE TABLE system_logs (
    id BIGSERIAL PRIMARY KEY,
    source VARCHAR(50) NOT NULL,
    level VARCHAR(30) NOT NULL,
    message TEXT NOT NULL,
    context JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_system_log_source CHECK (source IN ('gateway', 'backend', 'ml-worker', 'frontend')),
    CONSTRAINT chk_system_log_level CHECK (level IN ('info', 'warning', 'error'))
);
```

---

## 9. Seed Data

## 9.1 Gateway Seed

```sql
INSERT INTO gateways (gateway_code, name, location, description, status)
VALUES
('raspi-gateway-01', 'Raspberry Pi Gateway 01', 'Server Testbed Area', 'Gateway pembaca sensor XY-MD02', 'active');
```

## 9.2 Sensor Seed

```sql
INSERT INTO sensors (gateway_id, sensor_code, sensor_role, name, type, location, modbus_slave_id, status)
VALUES
(1, 'S1', 'ambient', 'S1 Ambient Sensor', 'XY-MD02', 'Area ambient / referensi ruangan', 1, 'normal'),
(1, 'S2', 'hotspot', 'S2 Hotspot Sensor', 'XY-MD02', 'Area hotspot / exhaust server testbed', 2, 'normal');
```

## 9.3 Status Icon Seed

```sql
INSERT INTO status_icons (status, label, icon_path, color_hex)
VALUES
('normal', 'Normal', '/icons/normal.svg', '#22c55e'),
('waspada', 'Waspada', '/icons/waspada.svg', '#f59e0b'),
('anomali', 'Anomali', '/icons/anomali.svg', '#ef4444'),
('trouble', 'Trouble', '/icons/trouble.svg', '#64748b');
```

## 9.4 Settings Seed

```sql
INSERT INTO settings (key, value, value_type, description)
VALUES
('normal_max_temperature', '30', 'number', 'Batas maksimum status normal'),
('anomaly_min_temperature', '32', 'number', 'Batas minimum status anomali'),
('notification_cooldown_minutes', '5', 'number', 'Cooldown notifikasi Telegram'),
('sampling_interval_seconds', '60', 'number', 'Interval sampling gateway'),
('window_size', '30', 'number', 'Jumlah data historis untuk input LSTM'),
('prediction_horizon_minutes', '5', 'number', 'Horizon prediksi suhu S2'),
('telegram_enabled', 'true', 'boolean', 'Status aktif notifikasi Telegram');
```

## 9.5 Model Version Seed

```sql
INSERT INTO model_versions (
    model_name,
    model_type,
    version,
    algorithm,
    feature_columns,
    target_column,
    window_size,
    horizon_minutes,
    sampling_interval_seconds,
    parameters
)
VALUES (
    'ems_lstm_s2_temperature',
    'LSTM',
    'v1.0.0',
    'Long Short-Term Memory',
    '["temperature_s1", "humidity_s1", "temperature_s2", "humidity_s2"]'::jsonb,
    'temperature_s2',
    30,
    5,
    60,
    '{"notes": "Initial model version for thesis prototype"}'::jsonb
);
```

---

## 10. Query Penting

## 10.1 Ambil Data Sensor Terbaru S1 dan S2

```sql
SELECT DISTINCT ON (s.sensor_code)
    s.sensor_code,
    s.sensor_role,
    sr.temperature,
    sr.humidity,
    sr.quality_status,
    sr.recorded_at
FROM sensor_readings sr
JOIN sensors s ON s.id = sr.sensor_id
ORDER BY s.sensor_code, sr.recorded_at DESC;
```

---

## 10.2 Ambil Data Historis untuk Grafik

```sql
SELECT
    s.sensor_code,
    s.sensor_role,
    sr.temperature,
    sr.humidity,
    sr.recorded_at
FROM sensor_readings sr
JOIN sensors s ON s.id = sr.sensor_id
WHERE sr.recorded_at BETWEEN $1 AND $2
ORDER BY sr.recorded_at ASC, s.sensor_code ASC;
```

---

## 10.3 Dataset Gabungan S1 dan S2 untuk ML Worker

```sql
SELECT
    s1.recorded_at AS timestamp,
    s1.temperature AS temperature_s1,
    s1.humidity AS humidity_s1,
    s2.temperature AS temperature_s2,
    s2.humidity AS humidity_s2
FROM
    sensor_readings s1
JOIN sensors sensor1 ON sensor1.id = s1.sensor_id AND sensor1.sensor_code = 'S1'
JOIN sensor_readings s2
    ON s2.recorded_at = s1.recorded_at
JOIN sensors sensor2 ON sensor2.id = s2.sensor_id AND sensor2.sensor_code = 'S2'
WHERE
    s1.recorded_at BETWEEN $1 AND $2
ORDER BY
    s1.recorded_at ASC;
```

Catatan: jika timestamp S1 dan S2 tidak selalu sama persis, ML Worker dapat melakukan resampling atau nearest timestamp matching di Python.

---

## 10.4 Prediksi Terbaru

```sql
SELECT
    p.id,
    p.predicted_temperature,
    p.predicted_for,
    p.created_at,
    mv.model_name,
    mv.version,
    ae.status
FROM predictions p
JOIN model_versions mv ON mv.id = p.model_version_id
LEFT JOIN anomaly_events ae ON ae.prediction_id = p.id
ORDER BY p.created_at DESC
LIMIT 1;
```

---

## 10.5 Riwayat Anomali

```sql
SELECT
    ae.id,
    s.sensor_code,
    ae.status,
    ae.predicted_temperature,
    ae.actual_temperature,
    ae.description,
    ae.detected_at
FROM anomaly_events ae
JOIN sensors s ON s.id = ae.sensor_id
ORDER BY ae.detected_at DESC
LIMIT 100;
```

---

## 10.6 Metrik Model Terbaru

```sql
SELECT
    mv.model_name,
    mv.version,
    mm.rmse,
    mm.mae,
    mm.mape,
    mm.created_at
FROM model_metrics mm
JOIN model_versions mv ON mv.id = mm.model_version_id
ORDER BY mm.created_at DESC
LIMIT 1;
```

---

## 10.7 Perbandingan LSTM vs Baseline

```sql
SELECT
    mv.model_name,
    mv.version,
    mm.rmse AS lstm_rmse,
    mm.mae AS lstm_mae,
    mm.mape AS lstm_mape,
    br.baseline_type,
    br.rmse AS baseline_rmse,
    br.mae AS baseline_mae,
    br.mape AS baseline_mape
FROM model_metrics mm
JOIN model_versions mv ON mv.id = mm.model_version_id
LEFT JOIN baseline_results br ON br.model_version_id = mv.id
WHERE mv.id = $1
ORDER BY br.created_at DESC;
```

---

## 10.8 Layout Aktif dan Posisi Sensor

```sql
SELECT
    l.id AS layout_id,
    l.name AS layout_name,
    l.image_path,
    ld.id AS layout_device_id,
    s.sensor_code,
    s.sensor_role,
    s.name AS sensor_name,
    ld.x_position,
    ld.y_position,
    si.status,
    si.icon_path,
    si.color_hex
FROM layouts l
JOIN layout_devices ld ON ld.layout_id = l.id
JOIN sensors s ON s.id = ld.sensor_id
LEFT JOIN status_icons si ON si.id = ld.status_icon_id
WHERE l.is_active = TRUE
ORDER BY s.sensor_code ASC;
```

---

## 10.9 Notifikasi Terbaru

```sql
SELECT
    nl.id,
    nl.channel,
    nl.recipient,
    nl.message,
    nl.status,
    nl.sent_at,
    nl.error_message,
    nl.created_at,
    ae.status AS anomaly_status
FROM notification_logs nl
LEFT JOIN anomaly_events ae ON ae.id = nl.anomaly_event_id
ORDER BY nl.created_at DESC
LIMIT 50;
```

---

## 11. Materialized View Opsional

Untuk dashboard, query summary dapat dipercepat dengan view.

### 11.1 Latest Readings View

```sql
CREATE VIEW latest_sensor_readings AS
SELECT DISTINCT ON (s.sensor_code)
    s.id AS sensor_id,
    s.sensor_code,
    s.sensor_role,
    sr.temperature,
    sr.humidity,
    sr.quality_status,
    sr.recorded_at
FROM sensor_readings sr
JOIN sensors s ON s.id = sr.sensor_id
ORDER BY s.sensor_code, sr.recorded_at DESC;
```

### 11.2 Latest Prediction View

```sql
CREATE VIEW latest_prediction AS
SELECT
    p.id AS prediction_id,
    p.predicted_temperature,
    p.predicted_for,
    p.created_at,
    mv.model_name,
    mv.version,
    ae.status
FROM predictions p
JOIN model_versions mv ON mv.id = p.model_version_id
LEFT JOIN anomaly_events ae ON ae.prediction_id = p.id
ORDER BY p.created_at DESC
LIMIT 1;
```

---

## 12. Data Retention

Untuk kebutuhan skripsi, data tidak harus dihapus otomatis. Namun, jika data terlalu banyak, retention policy dapat dibuat.

### TimescaleDB Retention Optional

```sql
SELECT add_retention_policy('sensor_readings', INTERVAL '90 days');
```

Catatan: retention policy sebaiknya tidak diaktifkan saat pengumpulan dataset skripsi kecuali benar-benar diperlukan.

---

## 13. Backup dan Export

Fitur backup minimal:

1. Export `sensor_readings` ke CSV.
2. Export `predictions` ke CSV.
3. Export `model_metrics` ke CSV.
4. Backup database menggunakan `pg_dump`.

### Contoh pg_dump

```bash
pg_dump -U ems_user -d ems_db > backup_ems_db.sql
```

### Contoh Export CSV Sensor

```sql
COPY (
    SELECT
        s.sensor_code,
        s.sensor_role,
        sr.temperature,
        sr.humidity,
        sr.recorded_at,
        sr.quality_status
    FROM sensor_readings sr
    JOIN sensors s ON s.id = sr.sensor_id
    ORDER BY sr.recorded_at ASC
) TO '/tmp/sensor_readings_export.csv' WITH CSV HEADER;
```

---

## 14. Data Flow Berdasarkan Database

## 14.1 Sensor Data Flow

```text
gateway → sensors/gateways lookup → sensor_readings → dashboard/history/ML
```

## 14.2 ML Data Flow

```text
sensor_readings → ML preprocessing → model_versions → predictions → anomaly_events → notification_logs
```

## 14.3 Dashboard Data Flow

```text
sensor_readings → charts/cards
predictions → prediction chart/card
anomaly_events → anomaly table/status
model_metrics + baseline_results → evaluation page
layouts + layout_devices + status_icons → sensor layout page
notification_logs → notification history
```

---

## 15. Migration Order

AI agent harus membuat migration dalam urutan berikut:

```text
001_create_gateways_table.sql
002_create_sensors_table.sql
003_create_sensor_readings_table.sql
004_create_model_versions_table.sql
005_create_prediction_runs_table.sql
006_create_predictions_table.sql
007_create_anomaly_events_table.sql
008_create_model_metrics_table.sql
009_create_baseline_results_table.sql
010_create_notification_logs_table.sql
011_create_layouts_table.sql
012_create_status_icons_table.sql
013_create_layout_devices_table.sql
014_create_settings_table.sql
015_create_api_tokens_table.sql
016_create_system_logs_table.sql
017_create_views.sql
018_create_timescaledb_hypertables.sql
```

Catatan: jika menggunakan Go migration tool seperti `golang-migrate`, penamaan file dapat mengikuti format timestamp.

---

## 16. Struktur Folder Database

```text
database/
├── migrations/
│   ├── 001_create_gateways_table.up.sql
│   ├── 001_create_gateways_table.down.sql
│   ├── 002_create_sensors_table.up.sql
│   ├── 002_create_sensors_table.down.sql
│   └── ...
│
├── seed/
│   ├── 001_seed_gateways.sql
│   ├── 002_seed_sensors.sql
│   ├── 003_seed_status_icons.sql
│   ├── 004_seed_settings.sql
│   └── 005_seed_model_version.sql
│
├── views/
│   ├── latest_sensor_readings.sql
│   └── latest_prediction.sql
│
└── README.md
```

---

## 17. Backend Repository Mapping

| Repository | Tabel |
|---|---|
| `GatewayRepository` | `gateways`, `api_tokens` |
| `SensorRepository` | `sensors` |
| `ReadingRepository` | `sensor_readings` |
| `PredictionRepository` | `predictions`, `prediction_runs` |
| `AnomalyRepository` | `anomaly_events` |
| `MetricRepository` | `model_versions`, `model_metrics`, `baseline_results` |
| `LayoutRepository` | `layouts`, `layout_devices`, `status_icons` |
| `NotificationRepository` | `notification_logs` |
| `SettingRepository` | `settings` |
| `SystemLogRepository` | `system_logs` |

---

## 18. ML Worker Database Mapping

| ML Worker Module | Tabel Dibaca | Tabel Ditulis |
|---|---|---|
| Dataset Loader | `sensor_readings`, `sensors` | - |
| Preprocessing | `sensor_readings` | optional `system_logs` |
| Baseline | `sensor_readings` | `baseline_results` |
| Train LSTM | `sensor_readings` | `model_versions`, `model_metrics` |
| Inference | `sensor_readings`, `model_versions` | `prediction_runs`, `predictions`, `anomaly_events` |
| Evaluator | `predictions`, `sensor_readings` | `model_metrics` |
| Notification trigger | `anomaly_events` | optional via backend |

---

## 19. Dashboard Database Mapping via API

Dashboard tidak mengakses database langsung. Dashboard mengakses backend API.

| Dashboard Page | Data Source |
|---|---|
| Main Dashboard | `sensor_readings`, `predictions`, `anomaly_events`, `model_metrics` |
| Sensor Readings | `sensor_readings` |
| Predictions | `predictions`, `model_versions` |
| Anomalies | `anomaly_events` |
| Model Evaluation | `model_metrics`, `baseline_results` |
| Sensor Layout | `layouts`, `layout_devices`, `status_icons`, `sensors` |
| Notifications | `notification_logs` |
| Settings | `settings` |

---

## 20. Validation Rules

## 20.1 Sensor Reading Validation

| Field | Rule |
|---|---|
| `sensor_id` | Wajib valid |
| `gateway_id` | Wajib valid |
| `temperature` | 0 sampai 80 |
| `humidity` | 0 sampai 100 |
| `recorded_at` | Wajib, timestamp valid |
| `quality_status` | valid/invalid/timeout/simulated |

## 20.2 Prediction Validation

| Field | Rule |
|---|---|
| `model_version_id` | Wajib valid |
| `target_sensor_id` | Wajib sensor S2 |
| `predicted_temperature` | Numeric |
| `predicted_for` | Wajib timestamp |
| `input_window_size` | Default 30 |
| `prediction_horizon_minutes` | Default 5 |

## 20.3 Anomaly Validation

| Field | Rule |
|---|---|
| `prediction_id` | Wajib valid |
| `status` | normal/waspada/anomali |
| `threshold_normal_max` | Default 30 |
| `threshold_anomaly_min` | Default 32 |
| `detected_at` | Wajib timestamp |

---

## 21. Dashboard Summary Query Strategy

Backend dapat membangun dashboard summary dari:

1. Latest sensor readings.
2. Latest prediction.
3. Latest anomaly event.
4. Latest model metrics.
5. Count anomaly today.
6. Notification latest.
7. Layout active.

Pseudo query service:

```text
summary = {
  latest_readings: query latest_sensor_readings,
  latest_prediction: query latest_prediction,
  thermal_status: query latest anomaly event,
  anomaly_today_count: count anomaly_events where detected_at today and status != normal,
  latest_metric: query latest model_metrics,
  latest_notifications: query latest notification_logs,
  active_layout: query layout active
}
```

---

## 22. Minimum Data Requirement for ML

Agar ML Worker dapat training, data minimal harus lebih besar dari window size.

Aturan minimal:

```text
minimal_rows_per_sensor > window_size + horizon
```

Dengan default:

```text
minimal_rows_per_sensor > 30 + 5
```

Untuk training yang lebih layak:

```text
minimal_rows_per_sensor >= beberapa ratus baris
```

Namun untuk development, simulator dapat menghasilkan dataset awal.

---

## 23. Example Data Lifecycle

### 23.1 Data Masuk

```text
S1 = 27.5°C, 63%
S2 = 30.1°C, 58%
recorded_at = 2026-05-23 14:30:00
```

Data disimpan ke `sensor_readings` sebagai dua baris:

```text
row 1: sensor S1, temperature 27.5, humidity 63
row 2: sensor S2, temperature 30.1, humidity 58
```

### 23.2 Prediksi

ML Worker membaca 30 data terakhir, lalu memprediksi:

```text
predicted_temperature S2 = 31.4°C
predicted_for = 2026-05-23 14:35:00
```

Data disimpan ke `predictions`.

### 23.3 Status

Karena 31.4°C berada pada rentang 30–32°C, status:

```text
waspada
```

Data disimpan ke `anomaly_events`.

### 23.4 Notifikasi

Telegram dikirim dan hasilnya disimpan ke `notification_logs`.

---

## 24. Acceptance Criteria Database

Database dianggap selesai apabila:

```text
[ ] PostgreSQL dapat berjalan
[ ] TimescaleDB dapat diaktifkan jika memungkinkan
[ ] Tabel gateways tersedia
[ ] Tabel sensors tersedia
[ ] Tabel sensor_readings tersedia
[ ] sensor_readings memiliki index timestamp
[ ] sensor_readings dapat dijadikan hypertable jika TimescaleDB tersedia
[ ] Tabel model_versions tersedia
[ ] Tabel prediction_runs tersedia
[ ] Tabel predictions tersedia
[ ] Tabel anomaly_events tersedia
[ ] Tabel model_metrics tersedia
[ ] Tabel baseline_results tersedia
[ ] Tabel notification_logs tersedia
[ ] Tabel layouts tersedia
[ ] Tabel layout_devices tersedia
[ ] Tabel status_icons tersedia
[ ] Tabel settings tersedia
[ ] Tabel api_tokens tersedia
[ ] Tabel system_logs tersedia
[ ] Seed S1 dan S2 tersedia
[ ] Seed threshold tersedia
[ ] Query latest readings berjalan
[ ] Query history readings berjalan
[ ] Query dataset ML berjalan
[ ] Query prediction terbaru berjalan
[ ] Query anomaly history berjalan
[ ] Query model metrics berjalan
[ ] Query layout aktif berjalan
```

---

## 25. Instruksi Implementasi untuk AI Agent

AI agent harus mengikuti instruksi ini ketika membuat database:

1. Gunakan PostgreSQL sebagai database utama.
2. Gunakan TimescaleDB hanya jika setup memungkinkan.
3. Jangan membuat database terlalu kompleks di luar kebutuhan skripsi.
4. Buat migration secara bertahap.
5. Buat seed untuk gateway, sensor S1, sensor S2, status icons, settings, dan model version awal.
6. Buat index pada kolom timestamp.
7. Pastikan `sensor_readings` bisa digunakan untuk dashboard dan ML worker.
8. Pastikan `predictions` selalu terkait dengan `model_versions`.
9. Pastikan `anomaly_events` selalu terkait dengan `predictions`.
10. Pastikan riwayat Telegram disimpan walaupun gagal.
11. Pastikan layout sensor bisa menyimpan posisi S1 dan S2.
12. Gunakan snake_case untuk nama tabel dan kolom.
13. Simpan semua tanggal sebagai `TIMESTAMPTZ`.
14. Buat README database yang menjelaskan cara migrate dan seed.
15. Pastikan schema bisa dijalankan ulang dari nol untuk demo.

---

## 26. Ringkasan Final Database

```text
Database utama      : PostgreSQL
Time-series support : TimescaleDB apabila memungkinkan
Tabel time-series   : sensor_readings
Target ML           : predictions untuk suhu S2
Status anomali      : anomaly_events
Evaluasi model      : model_metrics dan baseline_results
Dashboard layout    : layouts, layout_devices, status_icons
Notification        : notification_logs
Configuration       : settings
Auth gateway        : api_tokens
System log          : system_logs
```

Database ini mendukung seluruh alur sistem:

```text
Sensor → Gateway → Backend → Database → Dashboard
                              ↓
                         ML Worker
                              ↓
                 Prediction + Anomaly + Notification
```
