# 09 Alert Rules — EMS LSTM Thermal Anomaly Monitoring System

**Judul Skripsi:** Prediksi Anomali Termal pada Environment Monitoring System Server Menggunakan Algoritma Long Short-Term Memory  
**Jenis Dokumen:** Alert Rules Document  
**Versi:** 1.0  
**Status:** Final untuk dasar implementasi AI Agent  
**Target Pengguna Dokumen:** AI coding agent, backend developer, ML worker developer, frontend developer, dan reviewer teknis  
**Tanggal:** 2026-05-23  

---

## 1. Tujuan Dokumen

Dokumen ini menjelaskan aturan alert dan notifikasi pada sistem **EMS LSTM Thermal Anomaly Monitoring System**.

Alert digunakan untuk memberi peringatan ketika sistem mendeteksi potensi kondisi termal yang tidak normal berdasarkan:

1. Prediksi suhu S2 dari model LSTM.
2. Status sensor.
3. Sensor timeout atau data tidak valid.
4. Perubahan status dari normal ke waspada atau anomali.
5. Kegagalan sistem penting yang berpengaruh terhadap monitoring.

Dokumen ini dibuat agar AI coding agent dapat mengimplementasikan logika status, alert dashboard, dan Telegram notification secara konsisten.

---

## 2. Posisi Alert dalam Sistem

Alert berada setelah proses prediksi dan klasifikasi status.

```text
Sensor S1/S2
    ↓
Gateway
    ↓
Backend
    ↓
Database sensor_readings
    ↓
ML Worker LSTM
    ↓
Prediction suhu S2
    ↓
Status classification
    ↓
Anomaly event
    ↓
Dashboard alert + Telegram notification
```

Alert bukan sistem kontrol otomatis. Sistem hanya memberikan informasi, peringatan, dan notifikasi. Sistem tidak menyalakan kipas, mematikan perangkat, mengontrol AC, atau melakukan tindakan otomatis terhadap perangkat fisik.

---

## 3. Sumber Alert

Sistem memiliki beberapa sumber alert:

| Sumber | Keterangan |
|---|---|
| Prediksi LSTM | Prediksi suhu S2 melewati rentang tertentu |
| Sensor Gateway | Sensor timeout, sensor tidak terbaca, data invalid |
| Backend | Database error, API menerima payload invalid berulang |
| ML Worker | Data tidak cukup, model gagal inference, model belum siap |
| Telegram Service | Notifikasi gagal terkirim |
| Dashboard | API/SSE disconnected sebagai alert UI lokal |

---

## 4. Jenis Status

Sistem menggunakan empat status utama:

| Status | Keterangan |
|---|---|
| `normal` | Kondisi aman |
| `waspada` | Kondisi mendekati batas operasional |
| `anomali` | Kondisi melewati batas operasional |
| `trouble` | Sensor/sistem bermasalah secara teknis |

Status `normal`, `waspada`, dan `anomali` berasal dari hasil prediksi suhu S2.  
Status `trouble` berasal dari masalah teknis seperti sensor timeout, sensor tidak terbaca, atau data invalid.

---

## 5. Status Termal Berdasarkan Prediksi S2

Status termal ditentukan berdasarkan **prediksi suhu S2**.

Default threshold:

| Status | Kriteria |
|---|---|
| Normal | `predicted_temperature_s2 < 30°C` |
| Waspada | `30°C <= predicted_temperature_s2 <= 32°C` |
| Anomali | `predicted_temperature_s2 > 32°C` |

Pseudocode:

```python
def classify_thermal_status(predicted_temperature, normal_max=30.0, anomaly_min=32.0):
    if predicted_temperature < normal_max:
        return "normal"

    if predicted_temperature <= anomaly_min:
        return "waspada"

    return "anomali"
```

Catatan penting:

1. Threshold 30°C dan 32°C digunakan sebagai batas operasional penelitian pada server testbed.
2. Threshold ini bukan standar universal untuk semua server atau data center.
3. Threshold dapat dikonfigurasi dari tabel `settings`.
4. Target utama status termal adalah **S2 Hotspot/Exhaust**.
5. S1 digunakan sebagai sensor referensi, bukan target utama alert prediksi.

---

## 6. Status Sensor

Status sensor digunakan untuk menampilkan kondisi setiap sensor pada dashboard dan layout sensor.

| Status Sensor | Kondisi |
|---|---|
| `normal` | Sensor terbaca, data valid, dan tidak terkait kondisi waspada/anomali |
| `waspada` | Sensor S2 terkait status termal waspada |
| `anomali` | Sensor S2 terkait status termal anomali |
| `trouble` | Sensor timeout, tidak terbaca, atau data tidak valid |
| `inactive` | Sensor tidak digunakan sementara |

Aturan khusus:

1. S1 umumnya berstatus `normal` atau `trouble`.
2. S2 dapat berstatus `normal`, `waspada`, `anomali`, atau `trouble`.
3. Jika S2 trouble, status trouble lebih diprioritaskan daripada status prediksi.
4. Jika model belum siap, status prediksi tidak boleh dipaksakan.

---

## 7. Alert Severity

Untuk kebutuhan sistem dan dashboard, status dapat dipetakan ke severity.

| Status | Severity | Keterangan |
|---|---|---|
| normal | INFO | Kondisi aman |
| waspada | WARNING | Perlu perhatian |
| anomali | CRITICAL | Perlu tindakan pemantauan segera |
| trouble | ERROR | Masalah teknis pada sensor/sistem |

---

## 8. Trigger Alert

## 8.1 Thermal Warning Alert

Trigger:

```text
predicted_temperature_s2 >= 30°C AND predicted_temperature_s2 <= 32°C
```

Status:

```text
waspada
```

Kondisi ini berarti model memprediksi suhu S2 mendekati batas operasional.

Action:

1. Simpan event ke `anomaly_events`.
2. Tampilkan di dashboard.
3. Kirim Telegram jika memenuhi aturan cooldown.
4. Emit SSE event `anomaly.created`.

---

## 8.2 Thermal Anomaly Alert

Trigger:

```text
predicted_temperature_s2 > 32°C
```

Status:

```text
anomali
```

Kondisi ini berarti model memprediksi suhu S2 melewati batas operasional.

Action:

1. Simpan event ke `anomaly_events`.
2. Tampilkan di dashboard.
3. Kirim Telegram jika memenuhi aturan cooldown.
4. Emit SSE event `anomaly.created`.
5. Tampilkan marker S2 sebagai anomali pada sensor layout.

---

## 8.3 Normal Recovery Event

Trigger:

```text
previous_status IN ('waspada', 'anomali') AND current_status = 'normal'
```

Status:

```text
normal
```

Action opsional:

1. Simpan event recovery.
2. Tampilkan di dashboard sebagai recovery.
3. Telegram recovery boleh dikirim jika dibutuhkan, tetapi tidak wajib untuk versi MVP.

Rekomendasi untuk skripsi:

```text
Simpan recovery di database, tetapi Telegram recovery bersifat opsional.
```

---

## 8.4 Sensor Trouble Alert

Trigger:

1. Sensor timeout.
2. Sensor tidak terbaca.
3. Data kosong.
4. Data tidak valid.
5. Sensor tidak mengirim data lebih dari batas waktu tertentu.

Default timeout rule:

| Kondisi | Rule |
|---|---|
| Warning missing data | Tidak ada data sensor > 2x interval sampling |
| Trouble | Tidak ada data sensor > 5 menit |
| Invalid data | Temperature/humidity di luar rentang valid |

Dengan sampling 1 menit:

```text
Jika sensor tidak mengirim data lebih dari 5 menit → trouble
```

Action:

1. Update status sensor menjadi `trouble`.
2. Simpan system log.
3. Tampilkan sensor trouble di dashboard.
4. Emit SSE event `sensor.trouble`.
5. Telegram dikirim jika trouble terkait S2 atau gateway utama.

---

## 8.5 Model Not Ready Alert

Trigger:

1. Model LSTM belum dilatih.
2. File model tidak ditemukan.
3. Scaler tidak ditemukan.
4. Data kurang dari `window_size + horizon`.
5. Inference gagal.

Status:

```text
model_not_ready
```

Action:

1. Simpan ke `system_logs`.
2. Tampilkan warning di dashboard.
3. Tidak perlu membuat anomaly_event termal.
4. Telegram tidak wajib dikirim, kecuali demo menginginkan alert teknis.

---

## 8.6 Backend/System Alert

Trigger:

1. Database tidak dapat dihubungi.
2. API health check gagal.
3. Payload invalid berulang.
4. Telegram service gagal.
5. SSE service bermasalah.

Action:

1. Simpan ke `system_logs`.
2. Tampilkan di halaman System Logs.
3. Tampilkan alert UI lokal.
4. Telegram opsional.

---

## 9. Prioritas Status

Jika beberapa status terjadi bersamaan, gunakan prioritas berikut:

```text
trouble > anomali > waspada > normal
```

Contoh:

1. Jika S2 trouble, tampilkan `trouble`, walaupun prediksi terakhir `normal`.
2. Jika prediksi S2 `anomali`, tampilkan `anomali`, walaupun S1 normal.
3. Jika prediksi S2 `waspada`, tampilkan `waspada`, kecuali ada trouble.
4. Jika tidak ada masalah, tampilkan `normal`.

---

## 10. Event yang Disimpan ke Database

## 10.1 `anomaly_events`

Digunakan untuk menyimpan event status termal.

Field penting:

```text
prediction_id
sensor_id
status
predicted_temperature
actual_temperature
threshold_normal_max
threshold_anomaly_min
description
detected_at
created_at
```

Status yang disimpan:

1. `normal` jika ingin menyimpan recovery.
2. `waspada`.
3. `anomali`.

Untuk MVP, boleh menyimpan hanya `waspada` dan `anomali`, tetapi lebih baik menyimpan `normal` saat recovery agar riwayat status lengkap.

---

## 10.2 `notification_logs`

Digunakan untuk menyimpan riwayat notifikasi Telegram.

Field penting:

```text
anomaly_event_id
channel
recipient
message
status
sent_at
error_message
created_at
```

Status notifikasi:

| Status | Keterangan |
|---|---|
| pending | Belum dikirim |
| sent | Berhasil dikirim |
| failed | Gagal dikirim |
| skipped | Tidak dikirim karena cooldown atau Telegram disabled |

---

## 10.3 `system_logs`

Digunakan untuk menyimpan masalah teknis.

Contoh:

```text
source = ml-worker
level = warning
message = Not enough data for LSTM inference
```

Contoh lain:

```text
source = gateway
level = error
message = S2 sensor timeout
```

---

## 11. Telegram Notification Rules

## 11.1 Kapan Telegram Dikirim?

Telegram dikirim pada kondisi berikut:

| Kondisi | Telegram |
|---|---|
| Status berubah normal → waspada | Ya |
| Status berubah normal → anomali | Ya |
| Status berubah waspada → anomali | Ya |
| Status tetap waspada dalam cooldown | Tidak |
| Status tetap anomali dalam cooldown | Tidak |
| Status kembali normal | Opsional |
| Sensor S2 trouble | Ya |
| Sensor S1 trouble | Opsional |
| Gateway offline | Ya jika terdeteksi |
| Telegram disabled | Tidak |

---

## 11.2 Cooldown Rule

Default cooldown:

```text
5 menit
```

Rule:

1. Notifikasi status yang sama dari sensor yang sama tidak dikirim ulang selama cooldown.
2. Eskalasi status tetap dikirim meskipun masih dalam cooldown.
3. Contoh eskalasi:
   - `waspada` → `anomali`
   - `normal` → `anomali`
   - `normal` → `waspada`
4. Recovery ke normal boleh disimpan, tetapi Telegram recovery opsional.
5. Jika Telegram disabled, simpan notification log dengan status `skipped`.

Pseudocode:

```python
def should_send_notification(current_status, previous_status, last_notification_at, cooldown_minutes):
    if current_status == "normal":
        return False

    if previous_status != current_status:
        return True

    if last_notification_at is None:
        return True

    elapsed_minutes = now() - last_notification_at
    return elapsed_minutes >= cooldown_minutes
```

---

## 11.3 Telegram Disabled

Jika `telegram_enabled = false`:

1. Jangan kirim request ke Telegram API.
2. Simpan `notification_logs.status = skipped`.
3. Tampilkan di dashboard bahwa Telegram disabled.

---

## 12. Format Pesan Telegram

## 12.1 Thermal Waspada

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

---

## 12.2 Thermal Anomali

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

---

## 12.3 Sensor Trouble

```text
[EMS SENSOR TROUBLE]

Sensor : S2 - Hotspot/Exhaust
Status : TROUBLE
Pesan  : Sensor timeout atau data tidak valid
Waktu  : 2026-05-23 14:30:00

Silakan cek koneksi sensor, USB RS485 Converter, dan gateway.
```

---

## 12.4 Gateway Offline

```text
[EMS GATEWAY ALERT]

Gateway : raspi-gateway-01
Status  : OFFLINE / NOT SENDING DATA
Waktu   : 2026-05-23 14:30:00

Gateway tidak mengirim data dalam batas waktu yang ditentukan.
Silakan cek Raspberry Pi, jaringan lokal, dan program gateway.
```

---

## 13. Dashboard Alert Rules

Dashboard harus menampilkan alert dalam beberapa bentuk:

1. Badge status pada card.
2. Warna marker pada sensor layout.
3. Tabel recent anomalies.
4. Toast atau alert banner untuk event baru.
5. Halaman Anomalies.
6. Halaman Notifications.
7. Halaman System Logs untuk masalah teknis.

---

## 14. UI Status Mapping

| Status | Badge | Card Border | Marker | Dashboard Message |
|---|---|---|---|---|
| normal | Normal | Hijau | Hijau | Thermal condition is normal |
| waspada | Waspada | Kuning | Kuning | Predicted S2 temperature is near threshold |
| anomali | Anomali | Merah | Merah | Predicted S2 temperature exceeds threshold |
| trouble | Trouble | Abu/Merah gelap | Abu/Merah | Sensor trouble detected |

---

## 15. SSE Alert Events

Backend harus mengirim SSE event agar dashboard dapat memperbarui alert secara real-time.

## 15.1 Event `anomaly.created`

```text
event: anomaly.created
data: {
  "id": 55,
  "sensor_code": "S2",
  "status": "waspada",
  "predicted_temperature": 31.4,
  "detected_at": "2026-05-23T14:30:00+07:00"
}
```

## 15.2 Event `notification.sent`

```text
event: notification.sent
data: {
  "id": 10,
  "channel": "telegram",
  "status": "sent",
  "sent_at": "2026-05-23T14:30:05+07:00"
}
```

## 15.3 Event `sensor.trouble`

```text
event: sensor.trouble
data: {
  "sensor_code": "S2",
  "status": "trouble",
  "message": "Sensor timeout",
  "reported_at": "2026-05-23T14:30:00+07:00"
}
```

---

## 16. Alert Creation Logic

## 16.1 Dari ML Worker

Setelah inference:

```text
Prediksi dibuat
    ↓
Status diklasifikasi
    ↓
Prediction disimpan
    ↓
Anomaly event disimpan
    ↓
Backend/SSE diberi tahu
    ↓
Telegram dikirim jika perlu
```

Pseudocode:

```python
predicted_temp = model.predict(latest_window)
status = classify_thermal_status(predicted_temp)

prediction_id = save_prediction(predicted_temp)

event_id = save_anomaly_event(
    prediction_id=prediction_id,
    sensor_id=s2_id,
    status=status,
    predicted_temperature=predicted_temp
)

if status in ["waspada", "anomali"]:
    trigger_notification(event_id)
```

---

## 16.2 Dari Backend Gateway Status

Jika gateway mengirim status trouble:

```text
Gateway status diterima
    ↓
Sensor status diperbarui
    ↓
System log dibuat
    ↓
SSE sensor.trouble dikirim
    ↓
Telegram dikirim jika rule terpenuhi
```

---

## 17. Anti-Duplicate Rules

Untuk mencegah event berulang berlebihan:

1. Jangan membuat anomaly event baru jika status sama, sensor sama, dan prediksi masih dalam rentang waktu sangat dekat.
2. Boleh tetap menyimpan prediction baru, tetapi alert notification dapat di-skip.
3. Untuk dashboard, riwayat prediction boleh lengkap, sedangkan notification harus mengikuti cooldown.

Rekomendasi:

```text
Prediction: simpan setiap inference
Anomaly event: simpan setiap perubahan status atau setiap inference penting
Notification: cooldown 5 menit
```

Untuk MVP:

```text
Simpan anomaly_event setiap inference.
Batasi Telegram dengan cooldown.
```

---

## 18. Settings yang Digunakan Alert

Tabel `settings` minimal berisi:

| Key | Default | Fungsi |
|---|---:|---|
| `normal_max_temperature` | 30 | Batas maksimum normal |
| `anomaly_min_temperature` | 32 | Batas minimum anomali |
| `notification_cooldown_minutes` | 5 | Cooldown Telegram |
| `telegram_enabled` | true | Aktif/nonaktif Telegram |
| `sensor_trouble_minutes` | 5 | Batas sensor dianggap trouble |
| `gateway_offline_minutes` | 5 | Batas gateway dianggap offline |

---

## 19. Alert Rules Table

| Rule ID | Trigger | Status | Action |
|---|---|---|---|
| AR-001 | Prediksi S2 < 30°C | normal | Update dashboard |
| AR-002 | Prediksi S2 30–32°C | waspada | Save anomaly_event, show dashboard, Telegram if allowed |
| AR-003 | Prediksi S2 > 32°C | anomali | Save anomaly_event, show dashboard, Telegram if allowed |
| AR-004 | Sensor timeout | trouble | Update sensor status, system log, dashboard alert |
| AR-005 | S2 trouble | trouble | Dashboard alert + Telegram if allowed |
| AR-006 | Gateway offline | trouble | System log + dashboard + Telegram |
| AR-007 | Model not ready | warning | System log + dashboard banner |
| AR-008 | Telegram failed | warning | notification_logs failed + dashboard history |
| AR-009 | Status unchanged in cooldown | same | Skip Telegram |
| AR-010 | Waspada → Anomali | escalation | Send Telegram despite cooldown |

---

## 20. Error Handling Notifikasi

## 20.1 Telegram API Error

Jika Telegram API gagal:

1. Jangan crash.
2. Simpan `notification_logs.status = failed`.
3. Simpan `error_message`.
4. Tampilkan status failed di halaman Notifications.
5. Backend tetap berjalan.

---

## 20.2 Missing Telegram Token

Jika token kosong:

1. Jangan kirim Telegram.
2. Simpan notification log sebagai failed atau skipped.
3. Tampilkan pesan di Settings.
4. Dashboard tetap menampilkan anomaly event.

---

## 20.3 Missing Chat ID

Jika chat ID kosong:

1. Jangan kirim Telegram.
2. Simpan error.
3. Tampilkan status konfigurasi belum lengkap.

---

## 21. Alert Testing Scenarios

## 21.1 Thermal Status Test

| Input Prediksi S2 | Expected Status |
|---:|---|
| 28.5°C | normal |
| 29.9°C | normal |
| 30.0°C | waspada |
| 31.4°C | waspada |
| 32.0°C | waspada |
| 32.1°C | anomali |
| 35.0°C | anomali |

---

## 21.2 Notification Cooldown Test

| Kondisi | Expected |
|---|---|
| First waspada | Telegram sent |
| Waspada lagi 1 menit kemudian | Telegram skipped |
| Waspada lagi 6 menit kemudian | Telegram sent |
| Waspada lalu anomali 1 menit kemudian | Telegram sent |
| Anomali lagi 1 menit kemudian | Telegram skipped |
| Anomali lalu normal | Recovery optional |

---

## 21.3 Sensor Trouble Test

| Kondisi | Expected |
|---|---|
| S1 timeout | S1 trouble, dashboard alert |
| S2 timeout | S2 trouble, dashboard alert, Telegram optional/yes |
| S1 dan S2 timeout | Gateway/sensor trouble |
| Data suhu 90°C | Invalid/trouble |
| Data humidity 120% | Invalid/trouble |

---

## 21.4 Telegram Failure Test

| Kondisi | Expected |
|---|---|
| Token salah | notification failed |
| Chat ID kosong | notification failed/skipped |
| Internet mati | notification failed |
| Telegram disabled | notification skipped |
| Telegram gagal | anomaly tetap tampil di dashboard |

---

## 22. Acceptance Criteria Alert

Alert system dianggap selesai apabila:

```text
[ ] Sistem dapat mengklasifikasikan normal
[ ] Sistem dapat mengklasifikasikan waspada
[ ] Sistem dapat mengklasifikasikan anomali
[ ] Sistem dapat mengklasifikasikan trouble sensor
[ ] Prediksi S2 < 30 menghasilkan normal
[ ] Prediksi S2 30–32 menghasilkan waspada
[ ] Prediksi S2 > 32 menghasilkan anomali
[ ] Status tersimpan ke anomaly_events
[ ] Dashboard menampilkan status terbaru
[ ] Dashboard menampilkan riwayat anomali
[ ] Sensor layout menampilkan marker sesuai status
[ ] Telegram terkirim untuk waspada
[ ] Telegram terkirim untuk anomali
[ ] Telegram tidak spam karena cooldown
[ ] Eskalasi waspada ke anomali tetap mengirim Telegram
[ ] Telegram gagal tidak membuat sistem crash
[ ] notification_logs menyimpan status sent/failed/skipped
[ ] system_logs mencatat sensor/model/backend error
[ ] SSE anomaly.created terkirim
[ ] SSE notification.sent terkirim
[ ] SSE sensor.trouble terkirim
```

---

## 23. Instruksi Implementasi untuk AI Agent

AI agent harus mengikuti instruksi berikut:

1. Buat service khusus untuk status classification.
2. Ambil threshold dari settings.
3. Gunakan default 30°C dan 32°C jika settings tidak tersedia.
4. Target status termal selalu berdasarkan prediksi suhu S2.
5. Jangan menggunakan suhu S1 sebagai target utama alert termal.
6. Buat anomaly_event setelah prediction dibuat.
7. Buat notification service terpisah dari prediction service.
8. Terapkan cooldown Telegram.
9. Simpan semua percobaan notifikasi ke notification_logs.
10. Jangan crash jika Telegram gagal.
11. Kirim SSE event untuk anomaly, notification, dan sensor trouble.
12. Update marker sensor layout berdasarkan status.
13. Buat halaman dashboard menampilkan alert.
14. Buat test untuk status classification.
15. Buat test untuk cooldown.
16. Jangan menambahkan kontrol pendingin otomatis.
17. Jangan menambahkan PUE.
18. Jangan menganggap threshold sebagai standar universal server.
19. Dokumentasikan bahwa threshold adalah batas operasional penelitian.
20. Pastikan alert dapat diuji dengan simulator.

---

## 24. Ringkasan Final Alert Rules

```text
Alert utama       : Berdasarkan prediksi suhu S2
Status termal     : normal, waspada, anomali
Status teknis     : trouble
Normal            : predicted_s2 < 30°C
Waspada           : 30°C <= predicted_s2 <= 32°C
Anomali           : predicted_s2 > 32°C
Trouble           : sensor timeout/data invalid/gateway offline
Notification      : Telegram Bot API
Cooldown default  : 5 menit
Dashboard alert   : Card, badge, table, layout marker, SSE event
Database          : anomaly_events, notification_logs, system_logs
Batasan           : tidak kontrol pendingin, tidak PUE, tidak auto-remediation
