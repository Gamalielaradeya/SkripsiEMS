# 05 API Specification — EMS LSTM Thermal Anomaly Monitoring System

> **Catatan implementasi terbaru:** gunakan `15_Implementation_Runbook_Final.md` untuk endpoint yang benar-benar tersedia. Tambahan final: `POST /api/v1/ml/inference-events`, `GET /api/v1/layout`, `PUT /api/v1/layout/devices/{sensorCode}`, dan `DELETE /api/v1/layout/devices/{sensorCode}`. Contoh endpoint lama yang tidak ada di router Go bersifat rancangan historis.

**Judul Skripsi:** Prediksi Anomali Termal pada Environment Monitoring System Server Menggunakan Algoritma Long Short-Term Memory  
**Jenis Dokumen:** API Specification Document  
**Versi:** 1.0  
**Status:** Final untuk dasar implementasi AI Agent  
**Target Pengguna Dokumen:** AI coding agent, backend developer, frontend developer, ML worker developer, dan reviewer teknis  
**Tanggal:** 2026-05-23  

---

## 1. Tujuan Dokumen

Dokumen ini menjelaskan rancangan API untuk sistem **EMS LSTM Thermal Anomaly Monitoring System**.

API digunakan untuk menghubungkan beberapa komponen utama:

1. Raspberry Pi gateway ke Go backend.
2. React dashboard ke Go backend.
3. Backend ke database PostgreSQL/TimescaleDB.
4. Backend ke dashboard melalui REST API dan Server-Sent Events (SSE).
5. Backend dengan Telegram notification service.
6. ML worker dengan backend apabila diperlukan untuk trigger event atau sinkronisasi.

Dokumen ini menjadi pedoman bagi AI coding agent agar endpoint, request, response, status code, validasi, dan error handling dibuat secara konsisten.

---

## 2. Ringkasan API

### 2.1 Base URL Development

```text
http://localhost:8080/api/v1
```

### 2.2 Protocol

```text
HTTP REST JSON
Server-Sent Events untuk real-time update
```

### 2.3 Default Content Type

```text
Content-Type: application/json
Accept: application/json
```

### 2.4 API Version

Versi API menggunakan prefix:

```text
/api/v1
```

### 2.5 Authentication

Endpoint gateway menggunakan bearer token sederhana.

```text
Authorization: Bearer <GATEWAY_API_TOKEN>
```

Dashboard development boleh menggunakan API tanpa login pada versi awal, tetapi dapat ditambahkan login sederhana jika waktu memungkinkan.

---

## 3. Prinsip Desain API

API dirancang berdasarkan prinsip berikut:

1. **Simple and thesis-friendly**  
   Endpoint dibuat jelas dan mudah dijelaskan untuk Bab 4.

2. **RESTful enough**  
   Menggunakan method HTTP standar seperti GET, POST, PUT, DELETE apabila diperlukan.

3. **Consistent response**  
   Semua response menggunakan format konsisten.

4. **Validation first**  
   Semua request dari gateway dan dashboard harus divalidasi.

5. **Time-series ready**  
   Endpoint historis harus mendukung filter waktu.

6. **Dashboard-ready**  
   Endpoint summary harus memudahkan frontend menampilkan card, chart, tabel, dan layout.

7. **ML-ready**  
   Endpoint dan data harus mendukung prediksi suhu S2 dan evaluasi model.

8. **Safe failure**  
   Error Telegram, SSE disconnect, atau data kosong tidak boleh membuat sistem utama crash.

---

## 4. Format Response Standar

### 4.1 Response Sukses

```json
{
  "status": "success",
  "message": "Request processed successfully",
  "data": {}
}
```

### 4.2 Response List

```json
{
  "status": "success",
  "message": "Data retrieved successfully",
  "data": [],
  "meta": {
    "page": 1,
    "per_page": 20,
    "total": 100
  }
}
```

### 4.3 Response Error

```json
{
  "status": "error",
  "message": "Validation failed",
  "errors": {
    "temperature": ["temperature must be numeric"]
  }
}
```

### 4.4 Response Empty State

```json
{
  "status": "success",
  "message": "No data available",
  "data": [],
  "meta": {
    "total": 0
  }
}
```

---

## 5. HTTP Status Code

| Status Code | Penggunaan |
|---|---|
| 200 | Request sukses |
| 201 | Data berhasil dibuat |
| 400 | Request tidak valid |
| 401 | Token tidak valid atau tidak ada |
| 403 | Akses ditolak |
| 404 | Data tidak ditemukan |
| 409 | Konflik data |
| 422 | Validasi gagal |
| 500 | Error server |
| 503 | Service tidak tersedia, misalnya database down |

---

## 6. Time Format

Semua timestamp menggunakan ISO 8601.

Contoh:

```text
2026-05-23T14:30:00+07:00
2026-05-23T07:30:00Z
```

Backend harus dapat menerima timestamp dengan timezone.

Database menyimpan timestamp menggunakan:

```text
TIMESTAMPTZ
```

---

## 7. Endpoint Overview

## 7.1 System

| Method | Endpoint | Fungsi |
|---|---|---|
| GET | `/health` | Mengecek status backend dan database |

## 7.2 Gateway Sensor

| Method | Endpoint | Fungsi |
|---|---|---|
| POST | `/readings` | Menerima data sensor dari Raspberry Pi |
| POST | `/readings/batch` | Menerima batch data sensor, opsional |
| POST | `/gateway/status` | Menerima status gateway/sensor trouble |

## 7.3 Dashboard

| Method | Endpoint | Fungsi |
|---|---|---|
| GET | `/dashboard/summary` | Ringkasan dashboard |
| GET | `/events` | SSE real-time update |

## 7.4 Sensor Readings

| Method | Endpoint | Fungsi |
|---|---|---|
| GET | `/readings/latest` | Data sensor terbaru |
| GET | `/readings/history` | Data sensor historis |
| GET | `/readings/export` | Export CSV, opsional |
| GET | `/sensors` | Daftar sensor |
| GET | `/sensors/:id` | Detail sensor |

## 7.5 Predictions

| Method | Endpoint | Fungsi |
|---|---|---|
| GET | `/predictions/latest` | Prediksi terbaru |
| GET | `/predictions/history` | Riwayat prediksi |
| POST | `/predictions` | Simpan prediksi dari ML worker, opsional |
| GET | `/predictions/:id` | Detail prediksi |

## 7.6 Anomalies

| Method | Endpoint | Fungsi |
|---|---|---|
| GET | `/anomalies` | Riwayat anomali |
| GET | `/anomalies/latest` | Status/anomali terbaru |
| GET | `/anomalies/:id` | Detail anomali |

## 7.7 Model Evaluation

| Method | Endpoint | Fungsi |
|---|---|---|
| GET | `/model-versions` | Daftar versi model |
| GET | `/model-metrics/latest` | Metrik terbaru |
| GET | `/model-metrics/history` | Riwayat metrik |
| GET | `/baselines/latest` | Baseline terbaru |
| GET | `/baselines/history` | Riwayat baseline |
| GET | `/model-comparison/latest` | Perbandingan LSTM vs baseline |

## 7.8 Layout Sensor

| Method | Endpoint | Fungsi |
|---|---|---|
| GET | `/layout` | Layout aktif dan posisi sensor |
| POST | `/layout` | Upload/tambah layout |
| PUT | `/layout/:id` | Update layout |
| PUT | `/layout/sensors/:id/position` | Update posisi sensor |
| GET | `/status-icons` | Daftar icon status |

## 7.9 Notifications

| Method | Endpoint | Fungsi |
|---|---|---|
| GET | `/notifications` | Riwayat notifikasi |
| POST | `/notifications/test` | Test Telegram |
| POST | `/notifications/trigger` | Trigger notifikasi manual/ML worker, opsional |

## 7.10 Settings

| Method | Endpoint | Fungsi |
|---|---|---|
| GET | `/settings` | Ambil semua setting |
| PUT | `/settings/:key` | Update satu setting |

## 7.11 System Logs

| Method | Endpoint | Fungsi |
|---|---|---|
| GET | `/system-logs` | Melihat log sistem |
| POST | `/system-logs` | Menyimpan log dari komponen internal, opsional |

---

# 8. Detail Endpoint

---

## 8.1 Health Check

### Endpoint

```http
GET /api/v1/health
```

### Fungsi

Mengecek apakah backend dan database berjalan.

### Authentication

Tidak wajib.

### Response 200

```json
{
  "status": "success",
  "message": "Service is healthy",
  "data": {
    "service": "ems-backend",
    "environment": "development",
    "database": "connected",
    "time": "2026-05-23T14:30:00+07:00"
  }
}
```

### Response 503

```json
{
  "status": "error",
  "message": "Database disconnected",
  "data": {
    "service": "ems-backend",
    "database": "disconnected"
  }
}
```

### Acceptance Criteria

```text
[ ] Endpoint dapat diakses tanpa token
[ ] Endpoint mengembalikan status backend
[ ] Endpoint mengembalikan status database
[ ] Endpoint mengembalikan timestamp server
```

---

## 8.2 POST Readings

### Endpoint

```http
POST /api/v1/readings
```

### Fungsi

Menerima data sensor dari Raspberry Pi gateway atau simulator.

### Authentication

Wajib.

```text
Authorization: Bearer <GATEWAY_API_TOKEN>
```

### Request Body

```json
{
  "gateway_id": "raspi-gateway-01",
  "recorded_at": "2026-05-23T14:30:00+07:00",
  "source": "hardware",
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

### Field Request

| Field | Type | Required | Keterangan |
|---|---|---|---|
| `gateway_id` | string | Ya | Kode gateway |
| `recorded_at` | string datetime | Ya | Timestamp pembacaan |
| `source` | string | Tidak | `hardware` atau `simulator` |
| `readings` | array | Ya | Daftar pembacaan sensor |
| `readings.sensor_code` | string | Ya | S1 atau S2 |
| `readings.sensor_role` | string | Ya | ambient atau hotspot |
| `readings.temperature` | number | Ya | Suhu |
| `readings.humidity` | number | Ya | Kelembaban |

### Validasi

| Field | Rule |
|---|---|
| `gateway_id` | tidak boleh kosong |
| `recorded_at` | format timestamp valid |
| `readings` | minimal 1 item |
| `sensor_code` | hanya S1 atau S2 |
| `sensor_role` | ambient/hotspot |
| `temperature` | numeric, 0 sampai 80 |
| `humidity` | numeric, 0 sampai 100 |

### Response 201

```json
{
  "status": "success",
  "message": "Readings stored successfully",
  "data": {
    "gateway_id": "raspi-gateway-01",
    "stored_count": 2,
    "recorded_at": "2026-05-23T14:30:00+07:00"
  }
}
```

### Response 401

```json
{
  "status": "error",
  "message": "Unauthorized gateway token"
}
```

### Response 422

```json
{
  "status": "error",
  "message": "Validation failed",
  "errors": {
    "readings.0.temperature": ["temperature must be between 0 and 80"],
    "readings.1.humidity": ["humidity must be between 0 and 100"]
  }
}
```

### Backend Behavior

Setelah menerima payload valid, backend harus:

1. Mengecek token.
2. Membuat atau mengambil data gateway.
3. Membuat atau mengambil data sensor S1/S2.
4. Menyimpan data ke `sensor_readings`.
5. Update `gateways.last_seen_at`.
6. Update `sensors.last_seen_at`.
7. Emit SSE event `reading.latest`.
8. Return response sukses.

### SSE Event Setelah Insert

```json
{
  "event": "reading.latest",
  "data": {
    "S1": {
      "temperature": 27.4,
      "humidity": 63.2,
      "recorded_at": "2026-05-23T14:30:00+07:00"
    },
    "S2": {
      "temperature": 30.8,
      "humidity": 58.5,
      "recorded_at": "2026-05-23T14:30:00+07:00"
    }
  }
}
```

### Acceptance Criteria

```text
[ ] Request tanpa token ditolak
[ ] Request token valid diterima
[ ] Payload S1 dapat disimpan
[ ] Payload S2 dapat disimpan
[ ] Data invalid ditolak
[ ] Data tersimpan ke sensor_readings
[ ] SSE event reading.latest dikirim
```

---

## 8.3 POST Batch Readings

### Endpoint

```http
POST /api/v1/readings/batch
```

### Fungsi

Menerima data batch dari gateway apabila data sempat tertahan karena backend offline.

Endpoint ini opsional, tetapi berguna untuk replay data.

### Authentication

Wajib.

### Request Body

```json
{
  "gateway_id": "raspi-gateway-01",
  "source": "hardware",
  "items": [
    {
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
  ]
}
```

### Response 201

```json
{
  "status": "success",
  "message": "Batch readings stored successfully",
  "data": {
    "stored_count": 2,
    "batch_items": 1
  }
}
```

### Acceptance Criteria

```text
[ ] Batch payload diterima
[ ] Semua readings valid disimpan
[ ] Data invalid dicatat atau ditolak sesuai strategi implementasi
```

---

## 8.4 POST Gateway Status

### Endpoint

```http
POST /api/v1/gateway/status
```

### Fungsi

Menerima status gateway atau sensor trouble dari Raspberry Pi.

### Authentication

Wajib.

### Request Body

```json
{
  "gateway_id": "raspi-gateway-01",
  "status": "active",
  "reported_at": "2026-05-23T14:30:00+07:00",
  "sensors": [
    {
      "sensor_code": "S1",
      "status": "normal",
      "message": "Sensor readable"
    },
    {
      "sensor_code": "S2",
      "status": "trouble",
      "message": "Sensor timeout"
    }
  ]
}
```

### Response 200

```json
{
  "status": "success",
  "message": "Gateway status updated"
}
```

### Backend Behavior

1. Update status gateway.
2. Update status sensor.
3. Simpan system log jika trouble.
4. Emit SSE event `sensor.trouble` jika ada sensor trouble.

### Acceptance Criteria

```text
[ ] Status gateway dapat diperbarui
[ ] Status sensor dapat diperbarui
[ ] Sensor trouble tampil di dashboard
```

---

# 9. Dashboard API

---

## 9.1 GET Dashboard Summary

### Endpoint

```http
GET /api/v1/dashboard/summary
```

### Fungsi

Mengambil data ringkasan untuk main dashboard.

### Query Parameters

Tidak wajib.

Opsional:

| Parameter | Type | Keterangan |
|---|---|---|
| `from` | datetime | Awal rentang grafik |
| `to` | datetime | Akhir rentang grafik |

### Response 200

```json
{
  "status": "success",
  "message": "Dashboard summary retrieved",
  "data": {
    "latest_readings": {
      "S1": {
        "sensor_code": "S1",
        "sensor_role": "ambient",
        "temperature": 27.4,
        "humidity": 63.2,
        "quality_status": "valid",
        "status": "normal",
        "recorded_at": "2026-05-23T14:30:00+07:00"
      },
      "S2": {
        "sensor_code": "S2",
        "sensor_role": "hotspot",
        "temperature": 30.8,
        "humidity": 58.5,
        "quality_status": "valid",
        "status": "waspada",
        "recorded_at": "2026-05-23T14:30:00+07:00"
      }
    },
    "latest_prediction": {
      "id": 101,
      "target_sensor": "S2",
      "predicted_temperature": 31.4,
      "predicted_for": "2026-05-23T14:35:00+07:00",
      "status": "waspada",
      "model_version": "v1.0.0"
    },
    "today_summary": {
      "total_readings": 120,
      "total_waspada": 4,
      "total_anomali": 1,
      "total_trouble": 0
    },
    "latest_metrics": {
      "rmse": 0.84,
      "mae": 0.62,
      "mape": 2.15,
      "model_version": "v1.0.0"
    }
  }
}
```

### Acceptance Criteria

```text
[ ] Summary menampilkan data S1 dan S2
[ ] Summary menampilkan prediksi terbaru
[ ] Summary menampilkan status termal
[ ] Summary menampilkan metrik terbaru
[ ] Summary tetap sukses walaupun prediksi belum tersedia
```

---

## 9.2 GET SSE Events

### Endpoint

```http
GET /api/v1/events
```

### Fungsi

Membuka koneksi SSE untuk dashboard.

### Header Response

```text
Content-Type: text/event-stream
Cache-Control: no-cache
Connection: keep-alive
```

### Event: reading.latest

```text
event: reading.latest
data: {"S1":{"temperature":27.4,"humidity":63.2},"S2":{"temperature":30.8,"humidity":58.5}}
```

### Event: prediction.latest

```text
event: prediction.latest
data: {"predicted_temperature":31.4,"status":"waspada","predicted_for":"2026-05-23T14:35:00+07:00"}
```

### Event: anomaly.created

```text
event: anomaly.created
data: {"status":"anomali","predicted_temperature":33.1,"detected_at":"2026-05-23T14:30:00+07:00"}
```

### Event: notification.sent

```text
event: notification.sent
data: {"channel":"telegram","status":"sent","sent_at":"2026-05-23T14:30:05+07:00"}
```

### Acceptance Criteria

```text
[ ] Dashboard dapat connect ke SSE
[ ] reading.latest dikirim saat data sensor masuk
[ ] prediction.latest dikirim saat prediksi baru tersedia
[ ] anomaly.created dikirim saat status waspada/anomali dibuat
[ ] Koneksi SSE tidak menghentikan backend saat client disconnect
```

---

# 10. Sensor Readings API

---

## 10.1 GET Latest Readings

### Endpoint

```http
GET /api/v1/readings/latest
```

### Response 200

```json
{
  "status": "success",
  "message": "Latest readings retrieved",
  "data": {
    "S1": {
      "sensor_id": 1,
      "sensor_code": "S1",
      "sensor_role": "ambient",
      "temperature": 27.4,
      "humidity": 63.2,
      "quality_status": "valid",
      "recorded_at": "2026-05-23T14:30:00+07:00"
    },
    "S2": {
      "sensor_id": 2,
      "sensor_code": "S2",
      "sensor_role": "hotspot",
      "temperature": 30.8,
      "humidity": 58.5,
      "quality_status": "valid",
      "recorded_at": "2026-05-23T14:30:00+07:00"
    }
  }
}
```

---

## 10.2 GET History Readings

### Endpoint

```http
GET /api/v1/readings/history
```

### Query Parameters

| Parameter | Required | Keterangan |
|---|---|---|
| `sensor_code` | Tidak | S1/S2 |
| `from` | Tidak | Waktu awal |
| `to` | Tidak | Waktu akhir |
| `limit` | Tidak | Default 500 |
| `quality_status` | Tidak | valid/simulated/timeout/invalid |

### Contoh Request

```http
GET /api/v1/readings/history?sensor_code=S2&from=2026-05-23T00:00:00Z&to=2026-05-23T23:59:59Z
```

### Response 200

```json
{
  "status": "success",
  "message": "Reading history retrieved",
  "data": [
    {
      "sensor_code": "S2",
      "sensor_role": "hotspot",
      "temperature": 30.8,
      "humidity": 58.5,
      "quality_status": "valid",
      "recorded_at": "2026-05-23T14:30:00+07:00"
    }
  ],
  "meta": {
    "total": 1,
    "limit": 500
  }
}
```

### Acceptance Criteria

```text
[ ] Dapat filter sensor_code
[ ] Dapat filter rentang waktu
[ ] Data urut berdasarkan recorded_at
[ ] Response cocok untuk grafik frontend
```

---

## 10.3 GET Sensors

### Endpoint

```http
GET /api/v1/sensors
```

### Response 200

```json
{
  "status": "success",
  "message": "Sensors retrieved",
  "data": [
    {
      "id": 1,
      "sensor_code": "S1",
      "sensor_role": "ambient",
      "name": "S1 Ambient Sensor",
      "type": "XY-MD02",
      "location": "Area ambient / referensi ruangan",
      "status": "normal",
      "last_seen_at": "2026-05-23T14:30:00+07:00"
    },
    {
      "id": 2,
      "sensor_code": "S2",
      "sensor_role": "hotspot",
      "name": "S2 Hotspot Sensor",
      "type": "XY-MD02",
      "location": "Area hotspot / exhaust server testbed",
      "status": "waspada",
      "last_seen_at": "2026-05-23T14:30:00+07:00"
    }
  ]
}
```

---

# 11. Prediction API

---

## 11.1 GET Latest Prediction

### Endpoint

```http
GET /api/v1/predictions/latest
```

### Response 200

```json
{
  "status": "success",
  "message": "Latest prediction retrieved",
  "data": {
    "id": 101,
    "model_version": {
      "id": 1,
      "model_name": "ems_lstm_s2_temperature",
      "version": "v1.0.0"
    },
    "target_sensor": {
      "sensor_code": "S2",
      "sensor_role": "hotspot"
    },
    "predicted_temperature": 31.4,
    "prediction_horizon_minutes": 5,
    "input_window_size": 30,
    "input_start_at": "2026-05-23T14:00:00+07:00",
    "input_end_at": "2026-05-23T14:30:00+07:00",
    "predicted_for": "2026-05-23T14:35:00+07:00",
    "status": "waspada",
    "created_at": "2026-05-23T14:30:10+07:00"
  }
}
```

### Jika Belum Ada Prediksi

```json
{
  "status": "success",
  "message": "No prediction available",
  "data": null
}
```

---

## 11.2 GET Prediction History

### Endpoint

```http
GET /api/v1/predictions/history
```

### Query Parameters

| Parameter | Required | Keterangan |
|---|---|---|
| `from` | Tidak | Waktu awal |
| `to` | Tidak | Waktu akhir |
| `status` | Tidak | normal/waspada/anomali |
| `limit` | Tidak | Default 200 |

### Response 200

```json
{
  "status": "success",
  "message": "Prediction history retrieved",
  "data": [
    {
      "id": 101,
      "predicted_temperature": 31.4,
      "predicted_for": "2026-05-23T14:35:00+07:00",
      "status": "waspada",
      "model_version": "v1.0.0",
      "created_at": "2026-05-23T14:30:10+07:00"
    }
  ],
  "meta": {
    "total": 1,
    "limit": 200
  }
}
```

---

## 11.3 POST Prediction

### Endpoint

```http
POST /api/v1/predictions
```

### Fungsi

Menyimpan hasil prediksi dari ML worker melalui API.

Catatan: endpoint ini opsional jika ML worker menulis langsung ke database. Namun endpoint ini berguna jika ingin semua write operation melewati backend.

### Authentication

Dapat menggunakan internal token.

### Request Body

```json
{
  "model_version_id": 1,
  "target_sensor_code": "S2",
  "predicted_temperature": 31.4,
  "prediction_horizon_minutes": 5,
  "input_window_size": 30,
  "input_start_at": "2026-05-23T14:00:00+07:00",
  "input_end_at": "2026-05-23T14:30:00+07:00",
  "predicted_for": "2026-05-23T14:35:00+07:00"
}
```

### Response 201

```json
{
  "status": "success",
  "message": "Prediction stored successfully",
  "data": {
    "prediction_id": 101,
    "thermal_status": "waspada"
  }
}
```

### Backend Behavior

1. Validasi model_version_id.
2. Validasi target sensor S2.
3. Simpan prediction.
4. Hitung status normal/waspada/anomali.
5. Simpan anomaly_event.
6. Trigger notification jika perlu.
7. Emit SSE event `prediction.latest` dan `anomaly.created` jika status waspada/anomali.

---

# 12. Anomaly API

---

## 12.1 GET Latest Anomaly Status

### Endpoint

```http
GET /api/v1/anomalies/latest
```

### Response 200

```json
{
  "status": "success",
  "message": "Latest anomaly status retrieved",
  "data": {
    "id": 55,
    "sensor_code": "S2",
    "status": "waspada",
    "predicted_temperature": 31.4,
    "actual_temperature": 30.8,
    "threshold_normal_max": 30,
    "threshold_anomaly_min": 32,
    "description": "Predicted S2 temperature is in warning range",
    "detected_at": "2026-05-23T14:30:10+07:00"
  }
}
```

---

## 12.2 GET Anomaly History

### Endpoint

```http
GET /api/v1/anomalies
```

### Query Parameters

| Parameter | Required | Keterangan |
|---|---|---|
| `status` | Tidak | normal/waspada/anomali |
| `from` | Tidak | Waktu awal |
| `to` | Tidak | Waktu akhir |
| `limit` | Tidak | Default 100 |
| `page` | Tidak | Default 1 |

### Response 200

```json
{
  "status": "success",
  "message": "Anomaly history retrieved",
  "data": [
    {
      "id": 55,
      "sensor_code": "S2",
      "status": "waspada",
      "predicted_temperature": 31.4,
      "actual_temperature": 30.8,
      "detected_at": "2026-05-23T14:30:10+07:00",
      "notification_status": "sent"
    }
  ],
  "meta": {
    "page": 1,
    "per_page": 20,
    "total": 1
  }
}
```

---

## 12.3 GET Anomaly Detail

### Endpoint

```http
GET /api/v1/anomalies/{id}
```

### Response 200

```json
{
  "status": "success",
  "message": "Anomaly detail retrieved",
  "data": {
    "id": 55,
    "status": "waspada",
    "sensor": {
      "sensor_code": "S2",
      "sensor_role": "hotspot",
      "name": "S2 Hotspot Sensor"
    },
    "prediction": {
      "id": 101,
      "predicted_temperature": 31.4,
      "predicted_for": "2026-05-23T14:35:00+07:00",
      "model_version": "v1.0.0"
    },
    "threshold": {
      "normal_max": 30,
      "anomaly_min": 32
    },
    "description": "Predicted S2 temperature is in warning range",
    "detected_at": "2026-05-23T14:30:10+07:00",
    "notifications": [
      {
        "channel": "telegram",
        "status": "sent",
        "sent_at": "2026-05-23T14:30:12+07:00"
      }
    ]
  }
}
```

---

# 13. Model Evaluation API

---

## 13.1 GET Model Versions

### Endpoint

```http
GET /api/v1/model-versions
```

### Response 200

```json
{
  "status": "success",
  "message": "Model versions retrieved",
  "data": [
    {
      "id": 1,
      "model_name": "ems_lstm_s2_temperature",
      "model_type": "LSTM",
      "version": "v1.0.0",
      "window_size": 30,
      "horizon_minutes": 5,
      "trained_at": "2026-05-23T13:00:00+07:00"
    }
  ]
}
```

---

## 13.2 GET Latest Model Metrics

### Endpoint

```http
GET /api/v1/model-metrics/latest
```

### Response 200

```json
{
  "status": "success",
  "message": "Latest model metrics retrieved",
  "data": {
    "model_version": "v1.0.0",
    "rmse": 0.84,
    "mae": 0.62,
    "mape": 2.15,
    "dataset_start_at": "2026-05-20T00:00:00+07:00",
    "dataset_end_at": "2026-05-23T00:00:00+07:00",
    "train_size": 2500,
    "test_size": 500,
    "created_at": "2026-05-23T13:10:00+07:00"
  }
}
```

---

## 13.3 GET Baseline Latest

### Endpoint

```http
GET /api/v1/baselines/latest
```

### Response 200

```json
{
  "status": "success",
  "message": "Latest baseline results retrieved",
  "data": [
    {
      "baseline_type": "persistence",
      "rmse": 1.12,
      "mae": 0.88,
      "mape": 3.01,
      "created_at": "2026-05-23T13:11:00+07:00"
    },
    {
      "baseline_type": "moving_average",
      "rmse": 1.05,
      "mae": 0.81,
      "mape": 2.74,
      "created_at": "2026-05-23T13:11:00+07:00"
    }
  ]
}
```

---

## 13.4 GET Model Comparison Latest

### Endpoint

```http
GET /api/v1/model-comparison/latest
```

### Response 200

```json
{
  "status": "success",
  "message": "Latest model comparison retrieved",
  "data": {
    "lstm": {
      "model_version": "v1.0.0",
      "rmse": 0.84,
      "mae": 0.62,
      "mape": 2.15
    },
    "baselines": [
      {
        "baseline_type": "persistence",
        "rmse": 1.12,
        "mae": 0.88,
        "mape": 3.01
      },
      {
        "baseline_type": "moving_average",
        "rmse": 1.05,
        "mae": 0.81,
        "mape": 2.74
      }
    ]
  }
}
```

---

# 14. Layout Sensor API

---

## 14.1 GET Active Layout

### Endpoint

```http
GET /api/v1/layout
```

### Response 200

```json
{
  "status": "success",
  "message": "Active layout retrieved",
  "data": {
    "layout": {
      "id": 1,
      "name": "Server Testbed Layout",
      "image_path": "/uploads/layouts/server-testbed.png",
      "is_active": true
    },
    "devices": [
      {
        "layout_device_id": 1,
        "sensor_id": 1,
        "sensor_code": "S1",
        "sensor_role": "ambient",
        "label": "S1 Ambient",
        "x_position": 18.5,
        "y_position": 42.0,
        "status": "normal",
        "icon_path": "/icons/normal.svg",
        "color_hex": "#22c55e"
      },
      {
        "layout_device_id": 2,
        "sensor_id": 2,
        "sensor_code": "S2",
        "sensor_role": "hotspot",
        "label": "S2 Hotspot",
        "x_position": 70.0,
        "y_position": 45.0,
        "status": "waspada",
        "icon_path": "/icons/waspada.svg",
        "color_hex": "#f59e0b"
      }
    ]
  }
}
```

---

## 14.2 PUT Sensor Position

### Endpoint

```http
PUT /api/v1/layout/sensors/{id}/position
```

### Fungsi

Update posisi icon sensor pada layout.

### Request Body

```json
{
  "x_position": 70.0,
  "y_position": 45.0,
  "label": "S2 Hotspot"
}
```

### Response 200

```json
{
  "status": "success",
  "message": "Sensor position updated",
  "data": {
    "layout_device_id": 2,
    "x_position": 70.0,
    "y_position": 45.0
  }
}
```

### Acceptance Criteria

```text
[ ] Posisi X tersimpan
[ ] Posisi Y tersimpan
[ ] Dashboard dapat mengambil ulang posisi terbaru
```

---

## 14.3 GET Status Icons

### Endpoint

```http
GET /api/v1/status-icons
```

### Response 200

```json
{
  "status": "success",
  "message": "Status icons retrieved",
  "data": [
    {
      "status": "normal",
      "label": "Normal",
      "icon_path": "/icons/normal.svg",
      "color_hex": "#22c55e"
    },
    {
      "status": "waspada",
      "label": "Waspada",
      "icon_path": "/icons/waspada.svg",
      "color_hex": "#f59e0b"
    },
    {
      "status": "anomali",
      "label": "Anomali",
      "icon_path": "/icons/anomali.svg",
      "color_hex": "#ef4444"
    },
    {
      "status": "trouble",
      "label": "Trouble",
      "icon_path": "/icons/trouble.svg",
      "color_hex": "#64748b"
    }
  ]
}
```

---

# 15. Notification API

---

## 15.1 GET Notifications

### Endpoint

```http
GET /api/v1/notifications
```

### Query Parameters

| Parameter | Required | Keterangan |
|---|---|---|
| `status` | Tidak | sent/failed/skipped |
| `from` | Tidak | Waktu awal |
| `to` | Tidak | Waktu akhir |
| `limit` | Tidak | Default 50 |

### Response 200

```json
{
  "status": "success",
  "message": "Notifications retrieved",
  "data": [
    {
      "id": 1,
      "channel": "telegram",
      "recipient": "123456789",
      "status": "sent",
      "message": "[EMS THERMAL ALERT] Status: WASPADA...",
      "sent_at": "2026-05-23T14:30:12+07:00",
      "error_message": null,
      "created_at": "2026-05-23T14:30:10+07:00"
    }
  ]
}
```

---

## 15.2 POST Test Notification

### Endpoint

```http
POST /api/v1/notifications/test
```

### Fungsi

Mengirim pesan test Telegram dari dashboard/settings.

### Request Body

```json
{
  "message": "Test notification from EMS Thermal Monitoring System"
}
```

### Response 200

```json
{
  "status": "success",
  "message": "Test notification sent",
  "data": {
    "channel": "telegram",
    "status": "sent"
  }
}
```

### Jika Telegram Gagal

```json
{
  "status": "error",
  "message": "Telegram notification failed",
  "data": {
    "channel": "telegram",
    "status": "failed",
    "error_message": "telegram token is missing"
  }
}
```

---

## 15.3 POST Notification Trigger

### Endpoint

```http
POST /api/v1/notifications/trigger
```

### Fungsi

Endpoint internal opsional untuk ML worker memicu notifikasi berdasarkan anomali.

### Request Body

```json
{
  "anomaly_event_id": 55
}
```

### Response 200

```json
{
  "status": "success",
  "message": "Notification trigger processed",
  "data": {
    "notification_id": 10,
    "status": "sent"
  }
}
```

---

# 16. Settings API

---

## 16.1 GET Settings

### Endpoint

```http
GET /api/v1/settings
```

### Response 200

```json
{
  "status": "success",
  "message": "Settings retrieved",
  "data": {
    "normal_max_temperature": {
      "value": "30",
      "value_type": "number",
      "description": "Batas maksimum status normal"
    },
    "anomaly_min_temperature": {
      "value": "32",
      "value_type": "number",
      "description": "Batas minimum status anomali"
    },
    "notification_cooldown_minutes": {
      "value": "5",
      "value_type": "number",
      "description": "Cooldown notifikasi Telegram"
    },
    "telegram_enabled": {
      "value": "true",
      "value_type": "boolean",
      "description": "Status aktif Telegram"
    }
  }
}
```

---

## 16.2 PUT Setting

### Endpoint

```http
PUT /api/v1/settings/{key}
```

### Request Body

```json
{
  "value": "31"
}
```

### Response 200

```json
{
  "status": "success",
  "message": "Setting updated",
  "data": {
    "key": "normal_max_temperature",
    "value": "31"
  }
}
```

### Validation

| Key | Rule |
|---|---|
| `normal_max_temperature` | number |
| `anomaly_min_temperature` | number, harus lebih besar dari normal_max |
| `notification_cooldown_minutes` | integer > 0 |
| `telegram_enabled` | boolean |
| `window_size` | integer > 0 |
| `prediction_horizon_minutes` | integer > 0 |

---

# 17. System Logs API

---

## 17.1 GET System Logs

### Endpoint

```http
GET /api/v1/system-logs
```

### Query Parameters

| Parameter | Required | Keterangan |
|---|---|---|
| `source` | Tidak | gateway/backend/ml-worker/frontend |
| `level` | Tidak | info/warning/error |
| `limit` | Tidak | Default 100 |

### Response 200

```json
{
  "status": "success",
  "message": "System logs retrieved",
  "data": [
    {
      "id": 1,
      "source": "gateway",
      "level": "warning",
      "message": "S2 sensor timeout",
      "context": {
        "sensor_code": "S2"
      },
      "created_at": "2026-05-23T14:30:00+07:00"
    }
  ]
}
```

---

## 17.2 POST System Log

### Endpoint

```http
POST /api/v1/system-logs
```

### Request Body

```json
{
  "source": "ml-worker",
  "level": "warning",
  "message": "Not enough data for LSTM inference",
  "context": {
    "required_rows": 35,
    "available_rows": 20
  }
}
```

### Response 201

```json
{
  "status": "success",
  "message": "System log stored"
}
```

---

# 18. Export API Opsional

---

## 18.1 GET Readings Export CSV

### Endpoint

```http
GET /api/v1/readings/export
```

### Query Parameters

| Parameter | Required | Keterangan |
|---|---|---|
| `from` | Tidak | Waktu awal |
| `to` | Tidak | Waktu akhir |
| `sensor_code` | Tidak | S1/S2 |
| `format` | Tidak | csv |

### Response

```text
Content-Type: text/csv
Content-Disposition: attachment; filename="sensor_readings.csv"
```

### CSV Columns

```text
timestamp,sensor_code,sensor_role,temperature,humidity,quality_status
```

---

# 19. Thermal Status Classification Rule

Backend atau ML Worker harus menggunakan rule berikut:

```text
if predicted_temperature < normal_max_temperature:
    status = "normal"
elif predicted_temperature >= normal_max_temperature and predicted_temperature <= anomaly_min_temperature:
    status = "waspada"
else:
    status = "anomali"
```

Default:

```text
normal_max_temperature = 30
anomaly_min_temperature = 32
```

Catatan:

1. Threshold dapat berasal dari tabel `settings`.
2. Status ditentukan berdasarkan prediksi suhu S2.
3. Status trouble tidak berasal dari prediksi, tetapi dari sensor timeout atau data invalid.

---

# 20. Telegram Message Format

## 20.1 Waspada

```text
[EMS THERMAL ALERT]

Status        : WASPADA
Sensor Acuan  : S2 - Hotspot/Exhaust
Prediksi S2   : 31.4°C
Horizon       : 5 menit ke depan
Waktu Prediksi: 2026-05-23 14:35:00
Waktu Deteksi : 2026-05-23 14:30:00

Sistem memprediksi suhu mendekati batas operasional.
Silakan cek dashboard EMS untuk monitoring lebih lanjut.
```

## 20.2 Anomali

```text
[EMS THERMAL ALERT]

Status        : ANOMALI
Sensor Acuan  : S2 - Hotspot/Exhaust
Prediksi S2   : 33.1°C
Horizon       : 5 menit ke depan
Waktu Prediksi: 2026-05-23 14:35:00
Waktu Deteksi : 2026-05-23 14:30:00

Sistem memprediksi suhu melewati batas operasional.
Silakan cek dashboard EMS untuk tindakan pemantauan.
```

## 20.3 Trouble

```text
[EMS SENSOR TROUBLE]

Sensor : S2 - Hotspot/Exhaust
Status : TROUBLE
Pesan  : Sensor timeout atau data tidak valid
Waktu  : 2026-05-23 14:30:00

Silakan cek koneksi sensor dan gateway.
```

---

# 21. API Error Handling

## 21.1 Invalid Token

```json
{
  "status": "error",
  "message": "Unauthorized gateway token"
}
```

HTTP:

```text
401 Unauthorized
```

## 21.2 Validation Error

```json
{
  "status": "error",
  "message": "Validation failed",
  "errors": {
    "recorded_at": ["recorded_at is required"],
    "readings": ["readings must contain at least one item"]
  }
}
```

HTTP:

```text
422 Unprocessable Entity
```

## 21.3 Not Found

```json
{
  "status": "error",
  "message": "Resource not found"
}
```

HTTP:

```text
404 Not Found
```

## 21.4 Database Error

```json
{
  "status": "error",
  "message": "Internal server error"
}
```

HTTP:

```text
500 Internal Server Error
```

Backend harus mencatat detail error di system log, bukan menampilkan detail sensitif ke frontend.

---

# 22. CORS

Development allowed origin:

```text
http://localhost:5173
```

Backend `.env`:

```env
CORS_ALLOWED_ORIGINS=http://localhost:5173
```

---

# 23. Rate Limit Sederhana

Untuk versi skripsi, rate limit tidak wajib kompleks. Namun endpoint gateway sebaiknya dibatasi secara wajar.

Rekomendasi:

```text
POST /readings: maksimal 60 request per menit per gateway
```

Karena sampling default 1 menit, rate limit ini lebih dari cukup.

---

# 24. API Testing Checklist

## 24.1 Gateway API

```text
[ ] POST /readings tanpa token menghasilkan 401
[ ] POST /readings dengan token salah menghasilkan 401
[ ] POST /readings valid menghasilkan 201
[ ] POST /readings dengan suhu invalid menghasilkan 422
[ ] POST /readings dengan humidity invalid menghasilkan 422
[ ] POST /gateway/status trouble menghasilkan update sensor trouble
```

## 24.2 Dashboard API

```text
[ ] GET /dashboard/summary berhasil
[ ] GET /readings/latest berhasil
[ ] GET /readings/history dengan filter sensor berhasil
[ ] GET /predictions/latest berhasil
[ ] GET /anomalies berhasil
[ ] GET /model-metrics/latest berhasil
[ ] GET /model-comparison/latest berhasil
[ ] GET /layout berhasil
```

## 24.3 SSE

```text
[ ] GET /events membuka koneksi
[ ] Event reading.latest terkirim saat readings masuk
[ ] Event prediction.latest terkirim saat prediksi masuk
[ ] Event anomaly.created terkirim saat anomali dibuat
```

## 24.4 Notification API

```text
[ ] GET /notifications berhasil
[ ] POST /notifications/test berhasil jika Telegram aktif
[ ] Telegram gagal tidak membuat backend crash
```

## 24.5 Settings API

```text
[ ] GET /settings berhasil
[ ] PUT /settings/normal_max_temperature berhasil
[ ] PUT /settings/anomaly_min_temperature validasi nilainya
```

---

# 25. Contoh cURL

## 25.1 Health Check

```bash
curl http://localhost:8080/api/v1/health
```

## 25.2 Kirim Data Sensor

```bash
curl -X POST http://localhost:8080/api/v1/readings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer change-me" \
  -d '{
    "gateway_id": "raspi-gateway-01",
    "recorded_at": "2026-05-23T14:30:00+07:00",
    "source": "simulator",
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
  }'
```

## 25.3 Ambil Data Terbaru

```bash
curl http://localhost:8080/api/v1/readings/latest
```

## 25.4 Ambil Summary Dashboard

```bash
curl http://localhost:8080/api/v1/dashboard/summary
```

## 25.5 Test Telegram

```bash
curl -X POST http://localhost:8080/api/v1/notifications/test \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Test notification from EMS Thermal Monitoring System"
  }'
```

---

# 26. Frontend API Client Contract

Frontend harus menggunakan satu API client terpusat.

Contoh struktur TypeScript:

```ts
export type ApiResponse<T> = {
  status: "success" | "error";
  message: string;
  data?: T;
  errors?: Record<string, string[]>;
  meta?: {
    page?: number;
    per_page?: number;
    total?: number;
    limit?: number;
  };
};
```

Contoh type sensor:

```ts
export type SensorReading = {
  sensor_code: "S1" | "S2";
  sensor_role: "ambient" | "hotspot";
  temperature: number;
  humidity: number;
  quality_status: "valid" | "invalid" | "timeout" | "simulated";
  recorded_at: string;
};
```

Contoh type anomaly:

```ts
export type ThermalStatus = "normal" | "waspada" | "anomali" | "trouble";

export type AnomalyEvent = {
  id: number;
  sensor_code: "S2";
  status: ThermalStatus;
  predicted_temperature: number;
  actual_temperature?: number;
  detected_at: string;
  notification_status?: "pending" | "sent" | "failed" | "skipped";
};
```

---

# 27. Backend Implementation Notes for Go

AI agent direkomendasikan membuat struktur handler seperti:

```text
internal/handler/health_handler.go
internal/handler/reading_handler.go
internal/handler/dashboard_handler.go
internal/handler/prediction_handler.go
internal/handler/anomaly_handler.go
internal/handler/metric_handler.go
internal/handler/layout_handler.go
internal/handler/notification_handler.go
internal/handler/setting_handler.go
internal/handler/system_log_handler.go
```

Service:

```text
internal/service/reading_service.go
internal/service/dashboard_service.go
internal/service/status_service.go
internal/service/notification_service.go
internal/service/telegram_service.go
internal/service/sse_service.go
```

Repository:

```text
internal/repository/reading_repository.go
internal/repository/sensor_repository.go
internal/repository/prediction_repository.go
internal/repository/anomaly_repository.go
internal/repository/metric_repository.go
internal/repository/layout_repository.go
internal/repository/notification_repository.go
internal/repository/setting_repository.go
```

---

# 28. API Acceptance Criteria Final

API dianggap selesai apabila:

```text
[ ] GET /health berjalan
[ ] POST /readings menerima payload simulator
[ ] POST /readings menyimpan S1 dan S2
[ ] POST /readings menolak token invalid
[ ] POST /readings menolak data invalid
[ ] GET /readings/latest menampilkan S1 dan S2
[ ] GET /readings/history mendukung filter waktu
[ ] GET /dashboard/summary menampilkan data utama dashboard
[ ] GET /events menyediakan SSE
[ ] GET /predictions/latest menampilkan prediksi terbaru
[ ] GET /predictions/history menampilkan riwayat prediksi
[ ] GET /anomalies menampilkan riwayat anomali
[ ] GET /model-metrics/latest menampilkan RMSE/MAE/MAPE
[ ] GET /model-comparison/latest menampilkan LSTM vs baseline
[ ] GET /layout menampilkan layout dan posisi sensor
[ ] PUT /layout/sensors/:id/position menyimpan posisi sensor
[ ] GET /notifications menampilkan riwayat notifikasi
[ ] POST /notifications/test dapat menguji Telegram
[ ] GET /settings menampilkan threshold
[ ] PUT /settings/:key memperbarui threshold
[ ] GET /system-logs menampilkan error/aktivitas sistem
[ ] Semua response menggunakan format standar
[ ] Error handling tidak membocorkan secret
```

---

# 29. Ringkasan Final API

```text
Base URL        : http://localhost:8080/api/v1
Backend         : Go/Golang
Protocol        : HTTP REST JSON
Realtime        : Server-Sent Events
Gateway Auth    : Bearer token
Frontend        : React + Vite + TypeScript
Dashboard Data  : Summary, readings, predictions, anomalies, metrics, layout
ML Data         : Predictions, metrics, baseline, anomaly events
Notification    : Telegram via backend service
Main Target     : Prediksi suhu S2
Status          : normal, waspada, anomali, trouble
```
