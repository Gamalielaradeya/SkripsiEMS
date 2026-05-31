# UI Design Audit Hallmark - EMS Thermal Dashboard

## Tujuan

Audit ini menjaga dashboard tetap jelas untuk demo skripsi EMS: pembacaan XY-MD02 S1/S2, prediksi suhu S2, status termal, layout sensor, dan notifikasi Telegram.

## Ringkasan Audit

| Hallmark | Temuan | Prioritas | Keputusan |
|---|---|---:|---|
| Information hierarchy | Status termal terlihat, tetapi health gateway kurang eksplisit. | P0 | Tampilkan status gateway pada banner dashboard. |
| Data trust | Chart historis menebak S1/S2 dari urutan ID database. | P0 | Petakan chart melalui `sensor_code`. |
| Real-time feedback | UI belum refresh saat sensor trouble dan notification callback. | P0 | Dengarkan event SSE `sensor.trouble`, `prediction.latest`, `anomaly.created`, dan `notification.sent`. |
| Persistence clarity | Layout tersimpan hanya di browser. | P0 | Gunakan DB sebagai sumber utama; localStorage hanya draft fallback. |
| Responsive access | Sidebar fixed memotong viewport kecil. | P1 | Pertahankan sidebar desktop dan tambah bottom navigation mobile. |
| Theme consistency | Dark theme matang; light theme masih memiliki warna utility hardcoded. | P2 | Pertahankan toggle, catat penyelarasan light theme penuh sebagai polishing terpisah. |
| Accessibility | Status memakai warna dan label teks. | Baik | Pertahankan badge, label, dan ikon; jangan mengandalkan warna saja. |
| Academic scope | Dashboard fokus EMS dan LSTM S2. | Baik | Jangan tambah PUE, kontrol pendingin, MQTT, atau fitur enterprise. |

## Perubahan Wave 5

1. Layout sensor memakai endpoint DB untuk load, update, dan delete posisi.
2. Dashboard menampilkan health gateway pada banner status.
3. Chart historis memetakan sensor memakai kode `S1` dan `S2`.
4. Chart prediksi menampilkan aktual S2, prediksi LSTM, batas waspada, dan batas anomali dari settings runtime.
5. Halaman prediksi, anomali, notifikasi, layout, dan dashboard refresh melalui SSE sesuai event.
6. Mobile mendapat bottom navigation horizontal; desktop tetap memakai sidebar.

## Risiko Tersisa

- Upload gambar denah masih disimpan lokal browser karena tabel `layouts.image_path` belum memiliki alur upload file.
- Light theme penuh memerlukan audit visual lanjutan pada utility warna hardcoded.
- Endpoint settings dan layout masih mengikuti model akses dashboard lokal testbed; autentikasi admin bukan scope skripsi saat ini.

## Checklist Demo UI

1. Jalankan backend, frontend, dan simulator.
2. Buka Dashboard; cek gateway online dan pembacaan S1/S2 berubah.
3. Jalankan inference; cek chart prediksi, status termal, dan anomali refresh tanpa reload manual.
4. Buka Sensor Layout; pindahkan S2, simpan, reload browser, lalu cek posisi bertahan.
5. Aktifkan skenario trouble; cek banner berubah menjadi trouble.
6. Buka viewport mobile; cek bottom navigation dapat digeser horizontal.
