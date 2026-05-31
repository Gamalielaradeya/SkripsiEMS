# 10 Test Plan — EMS LSTM Thermal Anomaly Monitoring System

> **Catatan implementasi terbaru:** gunakan `15_Implementation_Runbook_Final.md` untuk command test aktual. Jalur fisik berada di `gateway-rpi/`; `gateway/` hanya simulator. Event SSE final mencakup `sensor.trouble` dan callback ML internal.

**Judul Skripsi:** Prediksi Anomali Termal pada Environment Monitoring System Server Menggunakan Algoritma Long Short-Term Memory  
**Jenis Dokumen:** Test Plan Document  
**Versi:** 1.0  
**Status:** Final untuk dasar implementasi dan Bab 4  
**Target Pengguna Dokumen:** AI coding agent, developer, mahasiswa, penguji, dan reviewer teknis  
**Tanggal:** 2026-05-23  

---

## 1. Tujuan Dokumen

Dokumen ini menjelaskan rencana pengujian untuk sistem **EMS LSTM Thermal Anomaly Monitoring System**.

Test plan ini digunakan untuk memastikan bahwa sistem yang dikembangkan dapat berjalan sesuai requirement, mulai dari pembacaan data sensor, pengiriman data gateway, penyimpanan ke database, visualisasi dashboard, prediksi LSTM, deteksi status termal, hingga notifikasi Telegram.

Dokumen ini juga dapat digunakan sebagai dasar penulisan Bab 4 bagian implementasi dan pengujian.

---

## 2. Tujuan Pengujian

Pengujian dilakukan untuk memastikan:

1. Gateway dapat membaca atau mensimulasikan data sensor S1 dan S2.
2. Gateway dapat mengirim data ke Go backend.
3. Backend dapat menerima, memvalidasi, dan menyimpan data sensor.
4. PostgreSQL/TimescaleDB dapat menyimpan data time-series.
5. Dashboard dapat menampilkan data aktual, historis, prediksi, status, dan evaluasi model.
6. ML Worker dapat melakukan preprocessing, baseline, training LSTM, evaluasi, dan inference.
7. Sistem dapat mengklasifikasikan status normal, waspada, anomali, dan trouble.
8. Sistem dapat mengirim notifikasi Telegram sesuai aturan alert.
9. Sistem dapat berjalan dengan mode simulator apabila hardware belum tersedia.
10. Sistem dapat didemokan secara lokal untuk kebutuhan skripsi.

---

## 3. Scope Pengujian

### 3.1 In Scope

| Area | Pengujian |
|---|---|
| Gateway Sensor | Mode simulator, mode hardware, validasi data, retry, buffer |
| Backend API | Health check, readings, history, dashboard summary, SSE |
| Database | Migration, seed, insert, query time-series, index |
| Dashboard | Card, chart, table, layout sensor, loading/empty/error state |
| ML Worker | Dataset loader, preprocessing, windowing, baseline, LSTM, metrics, inference |
| Alert Rules | Normal, waspada, anomali, trouble, cooldown |
| Telegram | Test notification, alert notification, failure handling |
| Integration | Gateway → Backend → Database → Dashboard → ML → Alert |
| Demo | Skenario normal, waspada, anomali, trouble |

### 3.2 Out of Scope

| Area | Keterangan |
|---|---|
| PUE aktual | Tidak diuji karena tidak termasuk scope skripsi |
| Kontrol pendingin otomatis | Tidak diuji karena sistem tidak mengontrol kipas/AC |
| Optimasi energi | Tidak diuji |
| Load testing enterprise | Tidak diperlukan untuk scope skripsi |
| Multi-user kompleks | Tidak menjadi fokus pengujian |
| Mobile app | Tidak ada mobile app |

---

## 4. Strategi Pengujian

Pengujian dilakukan dengan beberapa pendekatan:

1. **Unit Testing**  
   Menguji fungsi kecil seperti validator, status classifier, metric calculator, dan window builder.

2. **API Testing**  
   Menguji endpoint backend menggunakan curl, Postman, atau Thunder Client.

3. **Integration Testing**  
   Menguji alur antar modul seperti gateway ke backend, backend ke database, ML worker ke database, dan dashboard ke backend.

4. **Blackbox Testing**  
   Menguji fitur dari sisi pengguna tanpa melihat kode internal.

5. **End-to-End Testing**  
   Menguji alur lengkap dari data sensor/simulator sampai dashboard dan Telegram.

6. **Manual Demo Testing**  
   Menguji skenario yang akan ditampilkan saat demo/prasidang/sidang.

---

## 5. Environment Pengujian

### 5.1 Development Environment

| Komponen | Spesifikasi |
|---|---|
| OS | Windows/Linux/macOS |
| Backend | Go/Golang |
| Database | PostgreSQL |
| Time-series extension | TimescaleDB jika tersedia |
| Gateway | Python |
| ML Worker | Python + TensorFlow/Keras |
| Frontend | React + Vite + TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| Chart | Chart.js |
| Notification | Telegram Bot API |
| API Testing | Postman/Thunder Client/curl |
| Version Control | Git |

### 5.2 Hardware Environment

| Komponen | Keterangan |
|---|---|
| Raspberry Pi | Gateway sensor |
| Sensor S1 | XY-MD02 ambient/reference |
| Sensor S2 | XY-MD02 hotspot/exhaust |
| Converter | USB RS485 Converter |
| Server testbed | Laptop/mini PC |
| Laptop development | Menjalankan backend, database, dashboard, ML worker |

### 5.3 Simulator Environment

Jika hardware belum tersedia, gunakan:

| Komponen | Keterangan |
|---|---|
| Gateway simulator | Menghasilkan data S1/S2 |
| Scenario normal | S2 di bawah threshold |
| Scenario waspada | S2 30–32°C |
| Scenario anomali | S2 > 32°C |
| Scenario trouble | Sensor timeout/data invalid |
| Scenario replay | Mengirim data CSV sebagai real-time |

---

## 6. Test Data

### 6.1 Data Normal

| Sensor | Temperature | Humidity | Expected Status |
|---|---:|---:|---|
| S1 | 27.0°C | 63% | normal |
| S2 | 28.5°C | 58% | normal |

### 6.2 Data Waspada

| Sensor | Temperature | Humidity | Expected Status |
|---|---:|---:|---|
| S1 | 27.5°C | 62% | normal |
| S2 prediction | 31.0°C | - | waspada |

### 6.3 Data Anomali

| Sensor | Temperature | Humidity | Expected Status |
|---|---:|---:|---|
| S1 | 28.0°C | 61% | normal |
| S2 prediction | 33.2°C | - | anomali |

### 6.4 Data Trouble

| Kondisi | Expected Status |
|---|---|
| S2 timeout | trouble |
| Temperature null | invalid/trouble |
| Temperature 90°C | invalid/trouble |
| Humidity 120% | invalid/trouble |
| Tidak ada data > 5 menit | trouble |

---

## 7. Entry Criteria

Pengujian dapat dimulai jika:

```text
[ ] Repository project sudah dibuat
[ ] Database dapat dijalankan
[ ] Backend dapat dijalankan
[ ] Gateway simulator tersedia
[ ] Frontend dapat dijalankan
[ ] .env.example tersedia
[ ] Migration database tersedia
[ ] Seed S1 dan S2 tersedia
[ ] Dokumentasi API tersedia
```

---

## 8. Exit Criteria

Pengujian dianggap selesai jika:

```text
[ ] Semua pengujian must-have berhasil
[ ] Tidak ada error fatal pada alur utama
[ ] Data sensor dapat masuk ke database
[ ] Dashboard dapat menampilkan data
[ ] ML Worker dapat menghasilkan prediksi
[ ] Status normal/waspada/anomali dapat diuji
[ ] Telegram alert dapat diuji atau failure-nya tercatat dengan aman
[ ] End-to-end demo berhasil dilakukan
[ ] Hasil pengujian dapat ditulis ke Bab 4
```

---

# 9. Test Case Gateway Sensor

## 9.1 Gateway Simulator

| ID | Skenario | Langkah | Expected Result | Status |
|---|---|---|---|---|
| GW-001 | Menjalankan simulator normal | Jalankan `python src/main.py --mode simulator --scenario normal` | Payload S1/S2 normal terbentuk | Pending |
| GW-002 | Simulator waspada | Jalankan simulator scenario waspada | Data S2 berada sekitar 30–32°C | Pending |
| GW-003 | Simulator anomali | Jalankan simulator scenario anomali | Data S2 berada di atas 32°C | Pending |
| GW-004 | Simulator trouble | Jalankan simulator scenario trouble | Status trouble terbentuk | Pending |
| GW-005 | Payload format | Cek JSON payload | Payload sesuai API Spec | Pending |
| GW-006 | Interval sampling | Jalankan simulator beberapa menit | Data dikirim tiap 60 detik | Pending |

## 9.2 Gateway Hardware

| ID | Skenario | Langkah | Expected Result | Status |
|---|---|---|---|---|
| GW-HW-001 | USB RS485 terdeteksi | Jalankan `ls /dev/ttyUSB*` | Port `/dev/ttyUSB0` muncul | Pending |
| GW-HW-002 | Baca S1 | Jalankan test sensor S1 | Suhu dan kelembaban S1 terbaca | Pending |
| GW-HW-003 | Baca S2 | Jalankan test sensor S2 | Suhu dan kelembaban S2 terbaca | Pending |
| GW-HW-004 | S2 dilepas | Cabut/kondisikan S2 tidak terbaca | Status S2 trouble | Pending |
| GW-HW-005 | Slave ID salah | Ubah slave ID salah | Sensor gagal terbaca dan log warning | Pending |

## 9.3 Gateway Validasi Data

| ID | Input | Expected Result | Status |
|---|---|---|---|
| GW-VAL-001 | Temperature 27.4 | Valid | Pending |
| GW-VAL-002 | Temperature -1 | Invalid | Pending |
| GW-VAL-003 | Temperature 90 | Invalid | Pending |
| GW-VAL-004 | Humidity 63 | Valid | Pending |
| GW-VAL-005 | Humidity 120 | Invalid | Pending |
| GW-VAL-006 | sensor_code S3 | Invalid | Pending |
| GW-VAL-007 | S1 role hotspot | Invalid | Pending |
| GW-VAL-008 | S2 role ambient | Invalid | Pending |

## 9.4 Gateway Retry dan Buffer

| ID | Skenario | Langkah | Expected Result | Status |
|---|---|---|---|---|
| GW-RET-001 | Backend offline | Matikan backend, jalankan gateway | Request retry dilakukan | Pending |
| GW-RET-002 | Retry gagal | Backend tetap offline | Payload disimpan ke `failed_payloads.jsonl` | Pending |
| GW-RET-003 | Replay failed | Hidupkan backend, jalankan replay failed | Payload berhasil dikirim ulang | Pending |

---

# 10. Test Case Backend API

## 10.1 Health Check

| ID | Endpoint | Langkah | Expected Result | Status |
|---|---|---|---|---|
| API-001 | `GET /api/v1/health` | Request endpoint health | Response 200 dan database connected | Pending |

## 10.2 Authentication Gateway

| ID | Skenario | Langkah | Expected Result | Status |
|---|---|---|---|---|
| API-AUTH-001 | Tanpa token | POST readings tanpa Authorization | Response 401 | Pending |
| API-AUTH-002 | Token salah | POST readings dengan token salah | Response 401 | Pending |
| API-AUTH-003 | Token benar | POST readings dengan token valid | Response 201 | Pending |

## 10.3 POST Readings

| ID | Skenario | Input | Expected Result | Status |
|---|---|---|---|---|
| API-RD-001 | Payload valid S1/S2 | Data S1 dan S2 valid | Stored count 2 | Pending |
| API-RD-002 | Missing gateway_id | gateway_id kosong | Response 422 | Pending |
| API-RD-003 | Missing readings | readings kosong | Response 422 | Pending |
| API-RD-004 | Temperature invalid | temperature 90 | Response 422 | Pending |
| API-RD-005 | Humidity invalid | humidity 120 | Response 422 | Pending |
| API-RD-006 | Sensor role salah | S1 hotspot | Response 422 atau diperbaiki sesuai aturan | Pending |

## 10.4 GET Latest Readings

| ID | Endpoint | Langkah | Expected Result | Status |
|---|---|---|---|---|
| API-LT-001 | `GET /readings/latest` | Setelah data masuk | Data terbaru S1 dan S2 tampil | Pending |
| API-LT-002 | Data kosong | Database kosong | Response success dengan data null/empty | Pending |

## 10.5 GET History Readings

| ID | Skenario | Langkah | Expected Result | Status |
|---|---|---|---|---|
| API-HIS-001 | Filter S1 | `sensor_code=S1` | Hanya data S1 tampil | Pending |
| API-HIS-002 | Filter S2 | `sensor_code=S2` | Hanya data S2 tampil | Pending |
| API-HIS-003 | Filter tanggal | `from` dan `to` | Data sesuai rentang | Pending |
| API-HIS-004 | Limit | `limit=100` | Maksimal 100 data | Pending |

## 10.6 Dashboard Summary

| ID | Endpoint | Expected Result | Status |
|---|---|---|---|
| API-DS-001 | `GET /dashboard/summary` | Summary S1/S2 tampil | Pending |
| API-DS-002 | Prediksi belum tersedia | Summary tetap sukses | Pending |
| API-DS-003 | Metrics belum tersedia | Summary tetap sukses | Pending |

## 10.7 SSE

| ID | Skenario | Langkah | Expected Result | Status |
|---|---|---|---|---|
| API-SSE-001 | Connect SSE | Buka `/events` dari browser/frontend | Koneksi terbuka | Pending |
| API-SSE-002 | Reading masuk | POST readings | Event `reading.latest` terkirim | Pending |
| API-SSE-003 | Prediction masuk | Simpan prediksi | Event `prediction.latest` terkirim | Pending |
| API-SSE-004 | Anomaly dibuat | Status waspada/anomali | Event `anomaly.created` terkirim | Pending |
| API-SSE-005 | Client disconnect | Tutup dashboard | Backend tidak crash | Pending |

---

# 11. Test Case Database

## 11.1 Migration

| ID | Skenario | Expected Result | Status |
|---|---|---|---|
| DB-001 | Run migration dari nol | Semua tabel terbentuk | Pending |
| DB-002 | Run seed | Gateway, S1, S2, settings, status icons tersedia | Pending |
| DB-003 | Rollback migration | Tabel dapat rollback jika menggunakan tool migration | Pending |

## 11.2 Insert dan Query

| ID | Skenario | Expected Result | Status |
|---|---|---|---|
| DB-INS-001 | Insert sensor_readings S1 | Data tersimpan | Pending |
| DB-INS-002 | Insert sensor_readings S2 | Data tersimpan | Pending |
| DB-QRY-001 | Query latest readings | Data S1/S2 terbaru muncul | Pending |
| DB-QRY-002 | Query history by time | Data sesuai rentang | Pending |
| DB-QRY-003 | Query dataset ML | Dataset gabungan S1/S2 terbentuk | Pending |
| DB-QRY-004 | Query latest prediction | Prediksi terbaru muncul | Pending |
| DB-QRY-005 | Query anomalies | Riwayat anomali muncul | Pending |

## 11.3 TimescaleDB Optional

| ID | Skenario | Expected Result | Status |
|---|---|---|---|
| DB-TS-001 | Enable TimescaleDB | Extension aktif | Pending |
| DB-TS-002 | Create hypertable | `sensor_readings` menjadi hypertable | Pending |
| DB-TS-003 | Jika TimescaleDB tidak tersedia | PostgreSQL biasa tetap berjalan | Pending |

---

# 12. Test Case ML Worker

## 12.1 Dataset Loader

| ID | Skenario | Expected Result | Status |
|---|---|---|---|
| ML-DATA-001 | Load data sensor | Data dari database terbaca | Pending |
| ML-DATA-002 | Merge S1/S2 | Dataset gabungan terbentuk | Pending |
| ML-DATA-003 | Data kosong | Worker berhenti aman dan catat log | Pending |
| ML-DATA-004 | Data kurang dari window | Worker tidak inference dan catat log | Pending |

## 12.2 Preprocessing

| ID | Skenario | Expected Result | Status |
|---|---|---|---|
| ML-PREP-001 | Sort timestamp | Data urut kronologis | Pending |
| ML-PREP-002 | Missing kecil | Data diinterpolasi/ffill sesuai aturan | Pending |
| ML-PREP-003 | Missing besar | Window terkait di-drop | Pending |
| ML-PREP-004 | Outlier invalid | Data invalid tidak dipakai | Pending |
| ML-PREP-005 | Target shifting | Target `temperature_s2_future` terbentuk | Pending |

## 12.3 Windowing

| ID | Skenario | Expected Result | Status |
|---|---|---|---|
| ML-WIN-001 | Data cukup | X shape `(samples, 30, 4)` | Pending |
| ML-WIN-002 | Data kurang | Error/empty state terkendali | Pending |
| ML-WIN-003 | Target horizon 5 | Target sesuai S2 t+5 | Pending |

## 12.4 Baseline

| ID | Skenario | Expected Result | Status |
|---|---|---|---|
| ML-BAS-001 | Persistence baseline | Prediksi baseline terbentuk | Pending |
| ML-BAS-002 | Moving average baseline | Prediksi baseline terbentuk | Pending |
| ML-BAS-003 | Evaluasi baseline | RMSE/MAE/MAPE baseline dihitung | Pending |
| ML-BAS-004 | Simpan baseline | Data tersimpan ke `baseline_results` | Pending |

## 12.5 LSTM Training

| ID | Skenario | Expected Result | Status |
|---|---|---|---|
| ML-TR-001 | Training dengan data cukup | Model berhasil dilatih | Pending |
| ML-TR-002 | Split kronologis | Data tidak random | Pending |
| ML-TR-003 | Scaler fit train only | Tidak terjadi data leakage | Pending |
| ML-TR-004 | Early stopping | Training berhenti dengan aman | Pending |
| ML-TR-005 | Save model | File `.keras` tersimpan | Pending |
| ML-TR-006 | Save scaler | File scaler tersimpan | Pending |
| ML-TR-007 | Save model version | Data masuk `model_versions` | Pending |

## 12.6 Evaluation

| ID | Skenario | Expected Result | Status |
|---|---|---|---|
| ML-EV-001 | Hitung RMSE | Nilai RMSE tersedia | Pending |
| ML-EV-002 | Hitung MAE | Nilai MAE tersedia | Pending |
| ML-EV-003 | Hitung MAPE | Nilai MAPE tersedia | Pending |
| ML-EV-004 | Simpan metrics | Data masuk `model_metrics` | Pending |
| ML-EV-005 | Compare baseline | Tabel perbandingan tersedia | Pending |

## 12.7 Inference

| ID | Skenario | Expected Result | Status |
|---|---|---|---|
| ML-INF-001 | Load model | Model berhasil dibaca | Pending |
| ML-INF-002 | Ambil 30 data terakhir | Data input tersedia | Pending |
| ML-INF-003 | Prediksi S2 | Nilai prediksi suhu S2 tersedia | Pending |
| ML-INF-004 | Simpan prediction | Data masuk `predictions` | Pending |
| ML-INF-005 | Status normal | Prediksi < 30 menghasilkan normal | Pending |
| ML-INF-006 | Status waspada | Prediksi 30–32 menghasilkan waspada | Pending |
| ML-INF-007 | Status anomali | Prediksi > 32 menghasilkan anomali | Pending |
| ML-INF-008 | Simpan anomaly_event | Data masuk `anomaly_events` | Pending |

---

# 13. Test Case Alert dan Telegram

## 13.1 Status Classification

| ID | Input Prediksi S2 | Expected Status | Status |
|---|---:|---|---|
| AL-CLS-001 | 28.5 | normal | Pending |
| AL-CLS-002 | 29.9 | normal | Pending |
| AL-CLS-003 | 30.0 | waspada | Pending |
| AL-CLS-004 | 31.4 | waspada | Pending |
| AL-CLS-005 | 32.0 | waspada | Pending |
| AL-CLS-006 | 32.1 | anomali | Pending |
| AL-CLS-007 | 35.0 | anomali | Pending |

## 13.2 Cooldown

| ID | Skenario | Expected Result | Status |
|---|---|---|---|
| AL-CD-001 | Waspada pertama | Telegram sent | Pending |
| AL-CD-002 | Waspada lagi 1 menit | Telegram skipped | Pending |
| AL-CD-003 | Waspada lagi 6 menit | Telegram sent | Pending |
| AL-CD-004 | Waspada → Anomali 1 menit | Telegram sent karena eskalasi | Pending |
| AL-CD-005 | Anomali lagi 1 menit | Telegram skipped | Pending |

## 13.3 Telegram

| ID | Skenario | Expected Result | Status |
|---|---|---|---|
| TG-001 | Telegram enabled dan token valid | Pesan terkirim | Pending |
| TG-002 | Telegram disabled | Notification skipped | Pending |
| TG-003 | Token kosong | Notification failed/skipped, sistem tidak crash | Pending |
| TG-004 | Chat ID kosong | Notification failed/skipped | Pending |
| TG-005 | Internet gagal | Notification failed, sistem tetap berjalan | Pending |

---

# 14. Test Case Dashboard

## 14.1 Layout dan Komponen

| ID | Skenario | Expected Result | Status |
|---|---|---|---|
| UI-001 | Buka dashboard | Sidebar, topbar, content tampil | Pending |
| UI-002 | Card S1 temperature | Nilai suhu S1 tampil | Pending |
| UI-003 | Card S1 humidity | Nilai kelembaban S1 tampil | Pending |
| UI-004 | Card S2 temperature | Nilai suhu S2 tampil | Pending |
| UI-005 | Card S2 humidity | Nilai kelembaban S2 tampil | Pending |
| UI-006 | Card prediksi S2 | Prediksi suhu S2 tampil | Pending |
| UI-007 | Card status | Badge normal/waspada/anomali tampil | Pending |

## 14.2 Charts

| ID | Skenario | Expected Result | Status |
|---|---|---|---|
| UI-CH-001 | Grafik suhu | Data S1/S2 tampil | Pending |
| UI-CH-002 | Grafik kelembaban | Data S1/S2 tampil | Pending |
| UI-CH-003 | Aktual vs prediksi | Data aktual dan prediksi tampil | Pending |
| UI-CH-004 | Data kosong | Empty state tampil | Pending |

## 14.3 Pages

| ID | Page | Expected Result | Status |
|---|---|---|---|
| UI-PG-001 | Sensor Readings | Tabel dan filter tampil | Pending |
| UI-PG-002 | Predictions | Riwayat prediksi tampil | Pending |
| UI-PG-003 | Anomalies | Riwayat anomali tampil | Pending |
| UI-PG-004 | Model Evaluation | RMSE/MAE/MAPE dan baseline tampil | Pending |
| UI-PG-005 | Sensor Layout | Marker S1/S2 tampil | Pending |
| UI-PG-006 | Notifications | Riwayat Telegram tampil | Pending |
| UI-PG-007 | Settings | Threshold tampil dan dapat diubah | Pending |
| UI-PG-008 | System Logs | Log sistem tampil | Pending |

## 14.4 Loading, Empty, Error

| ID | Skenario | Expected Result | Status |
|---|---|---|---|
| UI-STATE-001 | Loading API | Skeleton/loading tampil | Pending |
| UI-STATE-002 | Data kosong | Empty state tampil | Pending |
| UI-STATE-003 | Backend mati | Error alert tampil | Pending |
| UI-STATE-004 | SSE disconnect | Fallback polling atau status disconnected | Pending |

---

# 15. End-to-End Test

## 15.1 E2E Normal

| ID | E2E-001 |
|---|---|
| Tujuan | Memastikan alur normal berjalan |
| Langkah | Jalankan backend, database, dashboard, gateway simulator normal |
| Expected | Data S1/S2 masuk, dashboard tampil normal, tidak ada Telegram alert |
| Status | Pending |

## 15.2 E2E Waspada

| ID | E2E-002 |
|---|---|
| Tujuan | Memastikan status waspada berjalan |
| Langkah | Jalankan simulator/prediksi dengan S2 30–32°C |
| Expected | Status waspada muncul, anomaly_event tersimpan, Telegram terkirim jika cooldown mengizinkan |
| Status | Pending |

## 15.3 E2E Anomali

| ID | E2E-003 |
|---|---|
| Tujuan | Memastikan status anomali berjalan |
| Langkah | Jalankan simulator/prediksi dengan S2 > 32°C |
| Expected | Status anomali muncul, marker S2 merah, Telegram terkirim |
| Status | Pending |

## 15.4 E2E Trouble

| ID | E2E-004 |
|---|---|
| Tujuan | Memastikan trouble sensor berjalan |
| Langkah | Jalankan simulator trouble atau putuskan sensor |
| Expected | Sensor trouble tampil di dashboard, system log tercatat, Telegram opsional/terkirim untuk S2 |
| Status | Pending |

## 15.5 E2E ML

| ID | E2E-005 |
|---|---|
| Tujuan | Memastikan pipeline ML penuh berjalan |
| Langkah | Kumpulkan data, train LSTM, evaluate, inference |
| Expected | Model tersimpan, metrics tersimpan, prediksi tampil di dashboard |
| Status | Pending |

---

# 16. Demo Test Script Ringkas

Urutan demo yang harus diuji sebelum presentasi:

```text
1. Jalankan database
2. Jalankan backend
3. Jalankan dashboard
4. Jalankan gateway simulator normal
5. Buka dashboard dan tunjukkan data S1/S2
6. Jalankan skenario waspada
7. Tunjukkan status waspada dan alert dashboard
8. Jalankan skenario anomali
9. Tunjukkan status anomali dan Telegram alert
10. Jalankan ML Worker inference
11. Tunjukkan prediksi suhu S2
12. Tunjukkan evaluasi RMSE/MAE/MAPE
13. Tunjukkan baseline comparison
14. Tunjukkan layout sensor S1/S2
```

---

# 17. Format Laporan Hasil Pengujian

Gunakan format berikut untuk Bab 4:

| No | Fitur yang Diuji | Skenario | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|
| 1 | Gateway simulator | Kirim data normal | Data masuk backend | Sesuai hasil uji | Berhasil |
| 2 | Backend API | POST readings valid | Data tersimpan | Sesuai hasil uji | Berhasil |
| 3 | Dashboard | Menampilkan data terbaru | Card tampil | Sesuai hasil uji | Berhasil |
| 4 | ML Worker | Inference prediksi | Prediksi tersimpan | Sesuai hasil uji | Berhasil |
| 5 | Alert | Prediksi > 32°C | Status anomali | Sesuai hasil uji | Berhasil |

---

# 18. Acceptance Criteria Test Plan

Test plan dianggap terpenuhi apabila:

```text
[ ] Gateway simulator berhasil diuji
[ ] Gateway hardware minimal siap diuji atau disediakan fallback simulator
[ ] Backend API utama berhasil diuji
[ ] Database migration dan seed berhasil
[ ] Dashboard utama tampil
[ ] Grafik suhu dan kelembaban tampil
[ ] ML Worker dapat training atau minimal inference dengan data yang tersedia
[ ] Baseline tersedia
[ ] RMSE/MAE/MAPE tampil
[ ] Status normal/waspada/anomali berhasil diuji
[ ] Telegram alert berhasil atau failure tercatat aman
[ ] Sensor trouble dapat diuji
[ ] End-to-end demo berhasil
```

---

## 19. Instruksi Implementasi untuk AI Agent

AI agent harus mengikuti instruksi berikut saat membuat pengujian:

1. Buat test case sesuai dokumen ini.
2. Sediakan command untuk menjalankan simulator normal/waspada/anomali/trouble.
3. Sediakan contoh curl untuk API testing.
4. Buat unit test untuk status classification.
5. Buat unit test untuk metric calculation.
6. Buat unit test untuk windowing ML.
7. Buat integration test sederhana untuk POST readings.
8. Pastikan dashboard bisa diuji dengan data simulator.
9. Pastikan Telegram failure tidak membuat sistem crash.
10. Dokumentasikan hasil pengujian di README atau folder `docs/testing-results`.
11. Jangan menambahkan pengujian PUE atau kontrol pendingin otomatis.
12. Fokus pada bukti bahwa sistem monitoring, prediksi, status, dan alert berjalan.

---

## 20. Ringkasan Final Test Plan

```text
Jenis pengujian : Unit, API, Integration, Blackbox, End-to-End, Demo
Komponen diuji  : Gateway, Backend, Database, Dashboard, ML Worker, Alert, Telegram
Mode pengujian  : Simulator dan hardware jika tersedia
Status diuji    : normal, waspada, anomali, trouble
Model diuji     : LSTM dan baseline
Metrik diuji    : RMSE, MAE, MAPE
Output utama    : data sensor tersimpan, prediksi tampil, status tampil, alert terkirim
Batasan         : tidak PUE, tidak kontrol pendingin, tidak optimasi energi
```
