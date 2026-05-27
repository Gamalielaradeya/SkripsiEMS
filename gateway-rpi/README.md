# EMS Gateway RPi

Program mandiri untuk **Raspberry Pi** yang membaca sensor suhu/kelembaban via **Modbus RTU** dan mengirimkan data ke **EMS Server**.

## Struktur

```
gateway-rpi/
├── src/
│   ├── main.py              ← FastAPI app (entry point)
│   ├── config_manager.py    ← Baca/tulis config.yaml
│   ├── modbus_reader.py     ← Driver Modbus RTU (pymodbus)
│   ├── serial_scanner.py    ← Deteksi port USB otomatis
│   ├── ems_sender.py        ← Kirim data ke EMS Server via HTTP
│   ├── poller.py            ← Background polling task
│   └── templates/           ← HTML (Jinja2 + HTMX + Alpine.js)
├── static/style.css
├── config.yaml              ← Konfigurasi utama (edit via Web UI)
├── requirements.txt
└── install.sh               ← Setup otomatis di RPi
```

## Cara Install di Raspberry Pi

```bash
git clone <repo-url>
cd gateway-rpi
chmod +x install.sh
./install.sh
```

## Cara Jalankan

```bash
source .venv/bin/activate
cd src
uvicorn main:app --host 0.0.0.0 --port 8765
```

Akses dari laptop: **`http://<IP-Raspberry-Pi>:8765`**

## Fitur Web UI

| Halaman | Fungsi |
|---|---|
| Overview | Status koneksi, info gateway, kontrol polling, pembacaan terakhir |
| Serial Settings | Config port USB, Modbus (baudrate/parity/dll), alamat sensor |
| Serial Test | Baca sensor sekali, scan slave ID, live monitor |
| App Settings | URL EMS Server, API token, identitas gateway |

## Sensor XY-MD02 — Register Default

| | Register (desimal) | Scale |
|---|---|---|
| Temperature | 1 | ÷10 → °C |
| Humidity | 2 | ÷10 → %RH |

Register bisa diubah lewat **Serial Settings** di Web UI tanpa ubah kode.

## Konfigurasi Manual (config.yaml)

Edit `config.yaml` langsung atau gunakan Web UI. Perubahan via Web UI langsung tersimpan ke file ini.

```yaml
modbus:
  port: "/dev/ttyUSB0"   # Ganti sesuai port USB yang dipakai
  baudrate: 9600

sensors:
  - id: "S1"
    slave_id: 1
    temp_register: 1
    humidity_register: 2

ems_server:
  url: "http://192.168.1.100:8080"
  api_token: "ems-gateway-token"
```

## Catatan Raspberry Pi

- Pastikan user punya akses serial port: `sudo usermod -a -G dialout $USER`
- USB-to-RS485 converter biasanya muncul sebagai `/dev/ttyUSB0`
- Cek port yang terdeteksi: `ls /dev/ttyUSB*`
