# 12 Demo Script — EMS LSTM Thermal Anomaly Monitoring System

**Judul Skripsi:** Prediksi Anomali Termal pada Environment Monitoring System Server Menggunakan Algoritma Long Short-Term Memory  
**Jenis Dokumen:** Demo Script Document  
**Versi:** 1.0  
**Status:** Final untuk panduan demo, prasidang, sidang, dan AI Agent  
**Target Pengguna Dokumen:** Mahasiswa, AI coding agent, developer pendamping, dan penguji  
**Tanggal:** 2026-05-23  

---

## 1. Tujuan Dokumen

Dokumen ini berisi panduan demo sistem **EMS LSTM Thermal Anomaly Monitoring System** dari awal sampai akhir.

Demo script ini dibuat agar saat presentasi, prasidang, atau sidang, alur penjelasan sistem menjadi rapi, tidak loncat-loncat, dan mudah dipahami oleh dosen penguji.

Dokumen ini mencakup:

1. Persiapan sebelum demo.
2. Urutan menjalankan service.
3. Narasi penjelasan sistem.
4. Skenario demo normal.
5. Skenario demo waspada.
6. Skenario demo anomali.
7. Skenario demo trouble sensor.
8. Demo dashboard.
9. Demo prediksi LSTM.
10. Demo evaluasi RMSE, MAE, MAPE.
11. Demo baseline comparison.
12. Demo Telegram alert.
13. Pertanyaan dosen yang mungkin muncul.
14. Jawaban singkat yang aman secara akademik.

---

## 2. Tujuan Demo

Tujuan demo adalah membuktikan bahwa sistem yang dibuat dapat:

1. Mengumpulkan data suhu dan kelembaban dari sensor atau simulator.
2. Mengirim data dari gateway ke backend.
3. Menyimpan data sensor sebagai data time-series.
4. Menampilkan data aktual pada dashboard.
5. Menampilkan grafik suhu dan kelembaban.
6. Melakukan prediksi suhu S2 menggunakan LSTM.
7. Menentukan status normal, waspada, atau anomali berdasarkan prediksi suhu S2.
8. Menampilkan riwayat anomali.
9. Mengirim notifikasi Telegram sebagai early warning.
10. Menampilkan evaluasi model menggunakan RMSE, MAE, dan MAPE.
11. Menampilkan baseline sederhana sebagai pembanding.
12. Menunjukkan posisi sensor S1 dan S2 pada layout dashboard.

---

## 3. Batasan yang Harus Dijelaskan Saat Demo

Sampaikan batasan berikut agar scope skripsi tetap aman:

1. Sistem ini adalah **monitoring dan prediksi**, bukan sistem kontrol otomatis.
2. Sistem tidak menyalakan atau mematikan kipas/AC.
3. Sistem tidak melakukan optimasi energi.
4. Sistem tidak menghitung PUE aktual.
5. Raspberry Pi hanya sebagai gateway pembaca sensor.
6. Model LSTM berjalan di laptop/backend environment, bukan di Raspberry Pi.
7. Target prediksi utama adalah suhu **S2 Hotspot/Exhaust**.
8. S1 digunakan sebagai sensor ambient/reference.
9. Threshold 30°C dan 32°C adalah batas operasional penelitian pada testbed, bukan standar universal data center.
10. Simulator digunakan sebagai fallback jika hardware belum siap atau bermasalah saat demo.

---

## 4. Komponen yang Didemokan

| Komponen | Fungsi Saat Demo |
|---|---|
| Gateway simulator/hardware | Menghasilkan data S1 dan S2 |
| Go Backend API | Menerima dan menyimpan data |
| PostgreSQL/TimescaleDB | Menyimpan data sensor, prediksi, anomali, evaluasi |
| React Dashboard | Menampilkan monitoring dan hasil prediksi |
| Python ML Worker | Training, evaluasi, dan inference LSTM |
| Telegram Bot | Mengirim alert waspada/anomali |
| Sensor layout | Menampilkan posisi S1 dan S2 |
| Chart.js | Menampilkan grafik sensor dan prediksi |

---

## 5. Persiapan Sebelum Demo

## 5.1 Checklist File dan Project

Pastikan folder project tersedia:

```text
ems-lstm-thermal-anomaly/
├── backend-go/
├── frontend-dashboard/
├── gateway/
├── ml-worker/
├── database/
├── docs/
├── docker-compose.yml
└── README.md
```

Pastikan dokumen penting sudah ada di folder `docs/`:

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
```

---

## 5.2 Checklist Software

Pastikan software berikut sudah siap:

```text
[ ] Docker Desktop / PostgreSQL local
[ ] Go
[ ] Python 3.10/3.11
[ ] Node.js 20 LTS+
[ ] Browser
[ ] Telegram
[ ] Git
[ ] VS Code / Google Antigravity
[ ] Postman/Thunder Client/curl
```

---

## 5.3 Checklist Hardware Jika Demo Hardware

```text
[ ] Raspberry Pi menyala
[ ] Sensor XY-MD02 S1 terhubung
[ ] Sensor XY-MD02 S2 terhubung
[ ] USB RS485 Converter terdeteksi
[ ] Kabel RS485 A/B benar
[ ] Raspberry Pi dan laptop berada pada jaringan yang sama
[ ] Backend dapat diakses dari Raspberry Pi
```

Jika hardware tidak tersedia atau tidak stabil:

```text
Gunakan gateway simulator.
```

---

## 5.4 Checklist Telegram

```text
[ ] Bot Telegram sudah dibuat
[ ] Bot token tersedia
[ ] Chat ID tersedia
[ ] TELEGRAM_ENABLED=true jika ingin demo notifikasi
[ ] Test notification berhasil
```

---

## 6. Urutan Menjalankan Sistem

Gunakan beberapa terminal terpisah.

---

## 6.1 Terminal 1 — Jalankan Database

Jika menggunakan Docker Compose:

```bash
docker compose up -d postgres
```

Cek:

```bash
docker compose ps
```

Jika database baru:

```bash
migrate -path backend-go/migrations -database "postgres://ems_user:ems_password@localhost:5432/ems_db?sslmode=disable" up
```

Atau jalankan SQL migration dan seed manual sesuai README.

---

## 6.2 Terminal 2 — Jalankan Backend

```bash
cd backend-go
go run ./cmd/server
```

Expected output:

```text
EMS Backend running on :8080
Database connected
```

Test:

```bash
curl http://localhost:8080/api/v1/health
```

Expected:

```json
{
  "status": "success",
  "message": "Service is healthy"
}
```

---

## 6.3 Terminal 3 — Jalankan Dashboard

```bash
cd frontend-dashboard
npm run dev
```

Buka browser:

```text
http://localhost:5173
```

Expected:

1. Sidebar tampil.
2. Topbar tampil.
3. Dashboard tampil.
4. Jika data belum ada, tampil empty state.

---

## 6.4 Terminal 4 — Jalankan Gateway Simulator

Scenario normal:

```bash
cd gateway
source .venv/bin/activate
python src/main.py --mode simulator --scenario normal
```

Windows PowerShell:

```powershell
cd gateway
.\.venv\Scripts\Activate.ps1
python src/main.py --mode simulator --scenario normal
```

Expected:

```text
Payload sent successfully stored_count=2
```

---

## 6.5 Terminal 5 — Jalankan ML Worker

Inference sekali:

```bash
cd ml-worker
source .venv/bin/activate
python src/inference.py --model-version v1.0.0
```

Inference loop:

```bash
python src/inference.py --model-version v1.0.0 --loop --interval 300
```

Training jika diperlukan:

```bash
python src/train_lstm.py --days 7
```

---

## 7. Narasi Pembukaan Demo

Gunakan narasi berikut:

```text
Pada demo ini saya menampilkan sistem Environment Monitoring System untuk server testbed.
Sistem ini membaca suhu dan kelembaban dari dua sensor, yaitu S1 sebagai sensor ambient/reference dan S2 sebagai sensor hotspot/exhaust.

Data dari sensor dikirim melalui Raspberry Pi gateway ke backend Go, lalu disimpan ke PostgreSQL sebagai data time-series. Data tersebut ditampilkan pada dashboard React, dan digunakan oleh ML Worker Python untuk memprediksi suhu S2 menggunakan algoritma LSTM.

Hasil prediksi suhu S2 kemudian diklasifikasikan menjadi normal, waspada, atau anomali. Jika sistem mendeteksi waspada atau anomali, dashboard menampilkan alert dan sistem dapat mengirim notifikasi Telegram.
```

---

## 8. Alur Penjelasan Arsitektur

Tunjukkan diagram arsitektur atau jelaskan secara lisan:

```text
Sensor XY-MD02 S1 dan S2
        ↓
Raspberry Pi Gateway
        ↓
Go Backend API
        ↓
PostgreSQL / TimescaleDB
        ↓
Python ML Worker LSTM
        ↓
React Dashboard
        ↓
Telegram Alert
```

Narasi:

```text
Arsitektur dibuat modular. Gateway hanya membaca sensor dan mengirim data. Backend menerima data dan menyediakan API. Database menyimpan data time-series. ML Worker melakukan training dan inference LSTM. Dashboard menampilkan data aktual, grafik, prediksi, status, dan alert.
```

---

## 9. Demo Dashboard Awal

Buka:

```text
http://localhost:5173
```

Tunjukkan:

1. Card suhu S1.
2. Card kelembaban S1.
3. Card suhu S2.
4. Card kelembaban S2.
5. Card prediksi suhu S2.
6. Card status termal.
7. Grafik suhu.
8. Grafik kelembaban.
9. Grafik aktual vs prediksi S2.
10. Layout sensor.
11. Tabel anomali terbaru.
12. Metrik RMSE/MAE/MAPE.

Narasi:

```text
Pada dashboard utama, sistem menampilkan data aktual dari S1 dan S2. S1 digunakan sebagai referensi ambient, sedangkan S2 ditempatkan dekat hotspot/exhaust sehingga menjadi target utama prediksi. Selain data aktual, dashboard juga menampilkan prediksi suhu S2 dan status termal hasil klasifikasi.
```

---

## 10. Skenario Demo 1 — Normal

## 10.1 Jalankan Simulator Normal

```bash
cd gateway
python src/main.py --mode simulator --scenario normal
```

## 10.2 Yang Harus Terlihat

Dashboard:

```text
S1 Temperature sekitar 26–28°C
S2 Temperature sekitar 27–29°C
Thermal Status: Normal
Badge warna hijau
Tidak ada Telegram alert baru
```

## 10.3 Narasi

```text
Pada skenario normal, suhu prediksi S2 masih berada di bawah 30°C, sehingga sistem mengklasifikasikan status sebagai normal. Pada kondisi ini sistem tidak mengirim alert Telegram karena belum ada indikasi risiko termal.
```

---

## 11. Skenario Demo 2 — Waspada

## 11.1 Jalankan Simulator Waspada

```bash
python src/main.py --mode simulator --scenario waspada
```

Atau jalankan ML inference yang menghasilkan prediksi S2 antara 30°C sampai 32°C.

```bash
cd ml-worker
python src/inference.py --model-version v1.0.0
```

## 11.2 Yang Harus Terlihat

Dashboard:

```text
Predicted S2 Temperature: 30–32°C
Thermal Status: Waspada
Badge warna kuning/oranye
Anomaly history bertambah
Marker S2 berubah menjadi waspada
Telegram alert terkirim jika cooldown mengizinkan
```

## 11.3 Narasi

```text
Pada skenario waspada, model memprediksi suhu S2 berada pada rentang 30°C sampai 32°C. Sistem menganggap kondisi ini sebagai peringatan dini karena suhu diprediksi mendekati batas operasional penelitian. Karena itu, sistem mencatat event waspada dan dapat mengirim notifikasi Telegram.
```

---

## 12. Skenario Demo 3 — Anomali

## 12.1 Jalankan Simulator Anomali

```bash
cd gateway
python src/main.py --mode simulator --scenario anomali
```

Atau jalankan inference yang menghasilkan prediksi S2 > 32°C.

```bash
cd ml-worker
python src/inference.py --model-version v1.0.0
```

## 12.2 Yang Harus Terlihat

Dashboard:

```text
Predicted S2 Temperature > 32°C
Thermal Status: Anomali
Badge warna merah
Marker S2 merah
Anomaly history bertambah
Telegram alert terkirim
```

Telegram message:

```text
[EMS THERMAL ALERT]

Status        : ANOMALI
Sensor Acuan  : S2 - Hotspot/Exhaust
Prediksi S2   : 33.1°C
Horizon       : 5 menit ke depan
Waktu Prediksi: ...
Waktu Deteksi : ...

Sistem memprediksi suhu melewati batas operasional.
Silakan cek dashboard EMS untuk tindakan pemantauan.
```

## 12.3 Narasi

```text
Pada skenario anomali, prediksi suhu S2 melewati 32°C. Sistem mencatat event anomali, menampilkan status merah di dashboard, memperbarui layout sensor, dan mengirim Telegram alert sebagai early warning. Sistem tidak melakukan kontrol otomatis, tetapi memberikan informasi agar pengguna dapat mengambil tindakan pemantauan.
```

---

## 13. Skenario Demo 4 — Sensor Trouble

## 13.1 Jalankan Simulator Trouble

```bash
cd gateway
python src/main.py --mode simulator --scenario trouble
```

Jika hardware:

```text
Cabut sensor S2 atau ubah konfigurasi slave ID untuk mensimulasikan timeout.
```

## 13.2 Yang Harus Terlihat

Dashboard:

```text
Sensor status: Trouble
Marker sensor abu/merah gelap
System Logs bertambah
SSE event sensor.trouble terkirim
Telegram opsional untuk S2 trouble
```

## 13.3 Narasi

```text
Status trouble berbeda dari anomali termal. Trouble menunjukkan masalah teknis seperti sensor tidak terbaca, timeout, atau data tidak valid. Sistem mencatat kondisi ini agar pengguna tahu bahwa masalahnya bukan hanya suhu, tetapi bisa berasal dari koneksi sensor atau gateway.
```

---

## 14. Demo Sensor Readings Page

Buka menu:

```text
Sensor Readings
```

Tunjukkan:

1. Tabel data sensor.
2. Filter S1/S2.
3. Filter tanggal.
4. Grafik suhu.
5. Grafik kelembaban.
6. Quality status.

Narasi:

```text
Halaman ini menampilkan data historis suhu dan kelembaban dari S1 dan S2. Data ini digunakan sebagai data time-series untuk dashboard dan untuk proses training serta inference model LSTM.
```

---

## 15. Demo Predictions Page

Buka menu:

```text
Predictions
```

Tunjukkan:

1. Prediksi terbaru.
2. Horizon 5 menit.
3. Target sensor S2.
4. Model version.
5. Tabel riwayat prediksi.
6. Grafik actual vs prediction.

Narasi:

```text
Halaman prediksi menampilkan hasil prediksi suhu S2. Input model menggunakan 30 data terakhir dari suhu dan kelembaban S1 dan S2. Output model adalah prediksi suhu S2 untuk 5 menit ke depan.
```

---

## 16. Demo Anomalies Page

Buka menu:

```text
Anomalies
```

Tunjukkan:

1. Riwayat waspada.
2. Riwayat anomali.
3. Predicted temperature.
4. Actual temperature jika tersedia.
5. Status notifikasi.
6. Detail anomaly.

Narasi:

```text
Setiap hasil prediksi diklasifikasikan menjadi normal, waspada, atau anomali. Riwayat waspada dan anomali disimpan agar pengguna dapat melihat kapan sistem mendeteksi potensi gangguan termal.
```

---

## 17. Demo Model Evaluation Page

Buka menu:

```text
Model Evaluation
```

Tunjukkan:

1. RMSE.
2. MAE.
3. MAPE.
4. LSTM vs Persistence.
5. LSTM vs Moving Average.
6. Grafik aktual vs prediksi.

Narasi:

```text
Model dievaluasi menggunakan RMSE, MAE, dan MAPE. Selain itu, hasil LSTM dibandingkan dengan baseline sederhana seperti persistence model dan moving average. Baseline digunakan agar performa LSTM tidak dinilai sendirian, tetapi memiliki pembanding yang jelas.
```

Penjelasan singkat metrik:

```text
RMSE menunjukkan error dengan penalti lebih besar pada kesalahan besar.
MAE menunjukkan rata-rata selisih absolut dalam satuan derajat Celsius.
MAPE menunjukkan error dalam bentuk persentase.
```

---

## 18. Demo Sensor Layout Page

Buka menu:

```text
Sensor Layout
```

Tunjukkan:

1. Gambar layout server testbed.
2. Marker S1.
3. Marker S2.
4. Warna marker sesuai status.
5. Tooltip/detail sensor.

Narasi:

```text
Halaman layout sensor membantu pengguna memahami posisi sensor secara visual. S1 ditempatkan pada area ambient/reference, sedangkan S2 ditempatkan dekat hotspot atau exhaust. Ketika status berubah, marker sensor ikut berubah agar kondisi lebih mudah dipahami.
```

---

## 19. Demo Notifications Page

Buka menu:

```text
Notifications
```

Tunjukkan:

1. Riwayat Telegram.
2. Status sent/failed/skipped.
3. Message preview.
4. Error jika gagal.
5. Tombol test Telegram.

Narasi:

```text
Setiap percobaan pengiriman notifikasi dicatat. Jika Telegram berhasil, status menjadi sent. Jika gagal karena token atau jaringan, sistem tetap berjalan dan error dicatat sehingga tidak mengganggu proses monitoring.
```

---

## 20. Demo Settings Page

Buka menu:

```text
Settings
```

Tunjukkan:

1. normal_max_temperature = 30.
2. anomaly_min_temperature = 32.
3. notification_cooldown_minutes = 5.
4. telegram_enabled.
5. window_size = 30.
6. horizon = 5.

Narasi:

```text
Threshold dan konfigurasi dasar dibuat dapat dikonfigurasi agar sistem fleksibel untuk kebutuhan penelitian. Namun pada penelitian ini, threshold 30°C dan 32°C digunakan sebagai batas operasional pada server testbed.
```

---

## 21. Demo System Logs Page

Buka menu:

```text
System Logs
```

Tunjukkan:

1. Log gateway.
2. Log backend.
3. Log ML Worker.
4. Error atau warning.
5. Filter source dan level.

Narasi:

```text
System logs digunakan untuk membantu debugging dan dokumentasi pengujian. Misalnya ketika sensor timeout, model belum siap, atau Telegram gagal, sistem mencatat kejadian tersebut.
```

---

## 22. Demo Telegram Alert

## 22.1 Test Notification

Jalankan:

```bash
curl -X POST http://localhost:8080/api/v1/notifications/test \
  -H "Content-Type: application/json" \
  -d '{"message":"Test notification from EMS Thermal Monitoring System"}'
```

## 22.2 Alert Notification

Jalankan skenario anomali:

```bash
cd gateway
python src/main.py --mode simulator --scenario anomali
```

Atau inference yang menghasilkan status anomali.

Expected:

```text
Pesan Telegram masuk.
```

Narasi:

```text
Telegram digunakan sebagai media early warning agar pengguna tetap mendapatkan informasi ketika tidak membuka dashboard. Notifikasi dikirim saat status waspada atau anomali, dengan cooldown untuk mencegah spam.
```

---

## 23. Demo dengan Hardware Sensor

Jika hardware sudah siap, gunakan alur ini:

1. Tunjukkan sensor S1 dan S2.
2. Jelaskan posisi S1 dan S2.
3. Tunjukkan Raspberry Pi dan USB RS485 Converter.
4. Jalankan gateway hardware mode.
5. Tunjukkan log pembacaan sensor.
6. Tunjukkan dashboard berubah sesuai data sensor.
7. Dekatkan sumber panas ringan ke area S2 jika aman.
8. Tunjukkan perubahan suhu S2.
9. Jalankan inference.
10. Tunjukkan prediksi dan status.

Command:

```bash
cd gateway
python src/main.py --mode hardware
```

Narasi:

```text
Pada mode hardware, data benar-benar dibaca dari sensor XY-MD02 melalui Modbus RS485. Raspberry Pi hanya berfungsi sebagai gateway akuisisi data, sedangkan backend dan ML Worker berjalan di laptop.
```

---

## 24. Demo dengan Simulator Jika Hardware Bermasalah

Jika hardware bermasalah, sampaikan dengan aman:

```text
Untuk menjaga demo tetap berjalan, sistem juga menyediakan mode simulator. Simulator menghasilkan payload yang sama dengan gateway hardware, sehingga backend, database, dashboard, ML Worker, dan Telegram tetap dapat diuji end-to-end. Mode simulator ini juga digunakan selama pengembangan ketika sensor belum selalu tersedia.
```

Command:

```bash
cd gateway
python src/main.py --mode simulator --scenario mixed
```

---

## 25. Flow Demo Cepat 10 Menit

Gunakan ini jika waktu terbatas.

```text
1. Buka dashboard.
2. Jelaskan S1 dan S2.
3. Jalankan simulator normal.
4. Tunjukkan data sensor masuk.
5. Tunjukkan grafik suhu/kelembaban.
6. Jalankan inference LSTM.
7. Tunjukkan prediksi suhu S2.
8. Jalankan skenario waspada/anomali.
9. Tunjukkan alert dashboard dan Telegram.
10. Tunjukkan Model Evaluation: RMSE/MAE/MAPE dan baseline.
```

---

## 26. Flow Demo Lengkap 20–30 Menit

```text
1. Jelaskan arsitektur sistem.
2. Tunjukkan struktur project.
3. Jalankan database.
4. Jalankan backend.
5. Jalankan dashboard.
6. Jalankan gateway simulator/hardware.
7. Tunjukkan data masuk ke database.
8. Tunjukkan dashboard utama.
9. Tunjukkan Sensor Readings.
10. Tunjukkan Predictions.
11. Jelaskan LSTM input window dan horizon.
12. Jalankan inference.
13. Tunjukkan status normal.
14. Jalankan skenario waspada.
15. Tunjukkan Telegram alert.
16. Jalankan skenario anomali.
17. Tunjukkan anomaly history.
18. Tunjukkan model evaluation.
19. Tunjukkan baseline comparison.
20. Tunjukkan sensor layout.
21. Tunjukkan notifications dan system logs.
22. Jelaskan batasan dan kesimpulan demo.
```

---

## 27. Jawaban untuk Pertanyaan Dosen

## 27.1 Kenapa menggunakan LSTM?

Jawaban:

```text
Karena data suhu dan kelembaban merupakan data time-series yang memiliki urutan waktu. LSTM cocok digunakan untuk mempelajari pola temporal dari data historis, sehingga dapat digunakan untuk memprediksi suhu S2 pada periode mendatang.
```

---

## 27.2 Kenapa targetnya S2?

Jawaban:

```text
S2 ditempatkan dekat area hotspot atau exhaust server testbed, sehingga lebih merepresentasikan perubahan panas dari perangkat. Karena itu, suhu S2 digunakan sebagai target utama prediksi dan dasar status termal.
```

---

## 27.3 Apa fungsi S1?

Jawaban:

```text
S1 digunakan sebagai sensor ambient atau referensi ruangan. Data S1 membantu memberikan konteks kondisi lingkungan sekitar, sehingga model tidak hanya melihat suhu hotspot S2, tetapi juga kondisi ambient.
```

---

## 27.4 Kenapa tidak menghitung PUE?

Jawaban:

```text
PUE membutuhkan pengukuran daya total fasilitas dan daya perangkat IT. Pada penelitian ini fokusnya adalah prediksi anomali termal berbasis sensor suhu dan kelembaban, sehingga PUE tidak termasuk scope penelitian.
```

---

## 27.5 Apakah sistem ini mengontrol kipas atau AC?

Jawaban:

```text
Tidak. Sistem ini hanya melakukan monitoring, prediksi, klasifikasi status, dan notifikasi. Sistem tidak melakukan kontrol pendingin otomatis agar scope penelitian tetap fokus pada EMS dan prediksi anomali termal.
```

---

## 27.6 Kenapa pakai threshold 30°C dan 32°C?

Jawaban:

```text
Threshold tersebut digunakan sebagai batas operasional penelitian pada server testbed. Nilai ini bukan standar universal data center, tetapi digunakan agar sistem dapat mengklasifikasikan kondisi normal, waspada, dan anomali secara konsisten selama pengujian.
```

---

## 27.7 Kenapa perlu baseline?

Jawaban:

```text
Baseline diperlukan sebagai pembanding agar performa LSTM tidak dinilai sendirian. Dengan membandingkan LSTM terhadap persistence model atau moving average, hasil evaluasi model menjadi lebih objektif.
```

---

## 27.8 Apa itu persistence baseline?

Jawaban:

```text
Persistence baseline adalah metode prediksi sederhana yang menganggap nilai suhu masa depan sama dengan nilai suhu terakhir. Metode ini sederhana tetapi cocok sebagai pembanding minimum untuk forecasting time-series.
```

---

## 27.9 Apa itu moving average baseline?

Jawaban:

```text
Moving average baseline memprediksi suhu masa depan berdasarkan rata-rata beberapa data suhu terakhir. Metode ini membantu membandingkan LSTM dengan pendekatan statistik sederhana.
```

---

## 27.10 Kenapa menggunakan RMSE, MAE, dan MAPE?

Jawaban:

```text
RMSE digunakan untuk melihat error dengan penalti lebih besar pada kesalahan besar. MAE menunjukkan rata-rata kesalahan absolut dalam derajat Celsius. MAPE menunjukkan error dalam bentuk persentase. Ketiganya umum digunakan untuk evaluasi model regresi dan forecasting.
```

---

## 27.11 Kalau data sensor belum banyak, apakah LSTM valid?

Jawaban:

```text
Model LSTM membutuhkan data historis yang cukup. Karena itu sistem menyediakan simulator untuk development, tetapi data real tetap dikumpulkan untuk evaluasi. Jika data terbatas, hasil evaluasi akan dijelaskan sebagai keterbatasan penelitian.
```

---

## 27.12 Apakah simulator membuat penelitian tidak valid?

Jawaban:

```text
Simulator digunakan untuk pengembangan dan fallback demo. Untuk hasil evaluasi utama, data real dari sensor tetap diutamakan. Simulator membantu memastikan backend, dashboard, ML Worker, dan alert dapat diuji end-to-end walaupun hardware belum selalu stabil.
```

---

## 27.13 Kenapa Raspberry Pi tidak menjalankan LSTM?

Jawaban:

```text
Raspberry Pi difokuskan sebagai gateway sensor agar proses akuisisi data tetap ringan dan stabil. Training dan inference LSTM dijalankan di laptop/backend environment karena lebih sesuai untuk komputasi machine learning.
```

---

## 27.14 Kenapa menggunakan SSE?

Jawaban:

```text
SSE digunakan untuk mengirim update real-time satu arah dari backend ke dashboard. Untuk kebutuhan monitoring dashboard, SSE cukup sederhana dan sesuai karena browser hanya perlu menerima update data dari server.
```

---

## 27.15 Kenapa menggunakan PostgreSQL/TimescaleDB?

Jawaban:

```text
PostgreSQL digunakan sebagai database utama. TimescaleDB dapat digunakan karena data sensor berbentuk time-series, sehingga query berdasarkan waktu dapat lebih terstruktur. Jika TimescaleDB tidak tersedia, PostgreSQL biasa dengan index timestamp tetap dapat digunakan.
```

---

## 28. Hal yang Jangan Diucapkan Saat Demo

Hindari klaim berikut:

```text
Sistem ini bisa mencegah semua kerusakan server.
Sistem ini otomatis menghemat energi.
Sistem ini menghitung PUE.
Sistem ini standar data center profesional.
Threshold 30/32°C adalah standar global.
LSTM pasti selalu lebih baik dari semua baseline.
Simulator sepenuhnya menggantikan data real.
```

Gunakan klaim yang aman:

```text
Sistem ini memberikan early warning berbasis prediksi.
Sistem ini membantu monitoring kondisi termal server testbed.
Threshold digunakan sebagai batas operasional penelitian.
Baseline digunakan sebagai pembanding.
Simulator digunakan untuk development dan fallback demo.
```

---

## 29. Checklist Sebelum Hari Demo

```text
[ ] Laptop sudah di-charge
[ ] Internet tersedia untuk Telegram
[ ] Hotspot cadangan tersedia
[ ] Project sudah pull versi terbaru
[ ] .env sudah benar
[ ] Database sudah siap
[ ] Backend berhasil health check
[ ] Dashboard bisa dibuka
[ ] Simulator normal berjalan
[ ] Simulator waspada berjalan
[ ] Simulator anomali berjalan
[ ] Simulator trouble berjalan
[ ] ML model sudah dilatih atau model dummy demo tersedia
[ ] Metrics RMSE/MAE/MAPE sudah tersedia
[ ] Baseline sudah tersedia
[ ] Telegram test berhasil
[ ] Screenshot cadangan tersedia
[ ] Video demo cadangan tersedia jika memungkinkan
```

---

## 30. Checklist Saat Demo

```text
[ ] Buka dashboard
[ ] Jelaskan arsitektur singkat
[ ] Tunjukkan data S1 dan S2
[ ] Tunjukkan grafik sensor
[ ] Tunjukkan prediksi S2
[ ] Tunjukkan status normal
[ ] Tunjukkan skenario waspada
[ ] Tunjukkan skenario anomali
[ ] Tunjukkan Telegram alert
[ ] Tunjukkan model evaluation
[ ] Tunjukkan baseline comparison
[ ] Tunjukkan sensor layout
[ ] Jelaskan batasan sistem
```

---

## 31. Troubleshooting Saat Demo

## 31.1 Backend Mati

```bash
cd backend-go
go run ./cmd/server
```

Cek:

```bash
curl http://localhost:8080/api/v1/health
```

---

## 31.2 Dashboard Tidak Ada Data

Cek data terbaru:

```bash
curl http://localhost:8080/api/v1/readings/latest
```

Jalankan simulator:

```bash
cd gateway
python src/main.py --mode simulator --scenario normal
```

---

## 31.3 Telegram Tidak Masuk

Cek:

1. Internet.
2. `TELEGRAM_ENABLED=true`.
3. Token.
4. Chat ID.
5. Bot sudah di-start.
6. Notification logs.

Fallback narasi:

```text
Jika Telegram gagal karena koneksi internet, sistem tetap mencatat status alert di dashboard dan notification log. Kegagalan Telegram tidak menghentikan monitoring.
```

---

## 31.4 ML Worker Data Kurang

Fallback:

```text
Gunakan model yang sudah dilatih sebelumnya.
Gunakan dataset replay.
Gunakan simulator data.
Tunjukkan halaman model evaluation dari hasil training sebelumnya.
```

---

## 31.5 Sensor Hardware Bermasalah

Fallback:

```text
Gunakan simulator mode.
Jelaskan bahwa simulator menghasilkan payload yang sama dengan gateway hardware.
```

---

## 32. Penutup Demo

Gunakan narasi berikut:

```text
Berdasarkan demo ini, sistem berhasil menjalankan alur EMS dari akuisisi data sensor, penyimpanan data time-series, visualisasi dashboard, prediksi suhu S2 menggunakan LSTM, klasifikasi status termal, hingga pengiriman alert Telegram.

Sistem ini berfokus pada monitoring dan early warning, bukan kontrol pendingin otomatis. Dengan adanya evaluasi RMSE, MAE, MAPE, serta baseline comparison, performa model dapat dianalisis secara kuantitatif untuk mendukung hasil penelitian.
```

---

## 33. Ringkasan Final Demo

```text
Demo utama:
1. Data S1/S2 masuk
2. Dashboard tampil
3. Grafik sensor tampil
4. Prediksi suhu S2 tampil
5. Status normal/waspada/anomali tampil
6. Telegram alert terkirim
7. Model evaluation tampil
8. Baseline comparison tampil
9. Sensor layout tampil

Batasan:
- Tidak PUE
- Tidak kontrol pendingin
- Tidak optimasi energi
- Threshold adalah batas operasional penelitian
- Simulator hanya fallback/development, data real tetap diutamakan
```
