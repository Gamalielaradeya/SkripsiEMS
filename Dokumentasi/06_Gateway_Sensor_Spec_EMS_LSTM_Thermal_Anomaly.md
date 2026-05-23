# 06 Gateway Sensor Specification — EMS LSTM Thermal Anomaly Monitoring System

**Judul Skripsi:** Prediksi Anomali Termal pada Environment Monitoring System Server Menggunakan Algoritma Long Short-Term Memory  
**Jenis Dokumen:** Gateway Sensor Specification  
**Versi:** 1.0  
**Status:** Final untuk dasar implementasi AI Agent  
**Target Pengguna Dokumen:** AI coding agent, developer gateway, mahasiswa, dan reviewer teknis  
**Tanggal:** 2026-05-23  

---

## 1. Tujuan Dokumen

Dokumen ini menjelaskan spesifikasi teknis **Gateway Sensor** pada sistem **EMS LSTM Thermal Anomaly Monitoring System**.

Gateway Sensor adalah program yang berjalan pada **Raspberry Pi** untuk membaca data suhu dan kelembaban dari dua sensor **XY-MD02** melalui komunikasi **Modbus RS485** menggunakan **USB RS485 Converter**, lalu mengirimkan data ke **Go Backend API** dalam format JSON.

Dokumen ini digunakan agar AI coding agent dapat membuat modul gateway secara jelas, konsisten, dan sesuai dengan rancangan skripsi.

---

## 2. Posisi Gateway dalam Sistem

Gateway berada di antara sensor fisik dan backend.

```text
[Sensor XY-MD02 S1 Ambient] ─┐
                             ├── [USB RS485 Converter] ── [Raspberry Pi Gateway]
[Sensor XY-MD02 S2 Hotspot] ─┘                                      |
                                                                    | HTTP REST API / JSON
                                                                    v
                                                         [Go Backend API]
                                                                    |
                                                                    v
                                                  [PostgreSQL + TimescaleDB]
```

Gateway tidak melakukan prediksi LSTM dan tidak melakukan training model. Gateway hanya bertugas sebagai pengambil data sensor dan pengirim data ke backend.

---

## 3. Tanggung Jawab Gateway

Gateway bertanggung jawab untuk:

1. Membaca sensor suhu dan kelembaban S1.
2. Membaca sensor suhu dan kelembaban S2.
3. Memberikan timestamp pada data.
4. Melakukan validasi awal data sensor.
5. Membentuk payload JSON.
6. Mengirim payload ke backend menggunakan HTTP REST API.
7. Menangani kondisi sensor timeout.
8. Menangani data tidak valid.
9. Menyimpan log lokal.
10. Melakukan retry ketika backend tidak dapat dihubungi.
11. Menyediakan mode simulator untuk development dan demo.
12. Menyediakan mode replay data jika dibutuhkan untuk demo.

---

## 4. Batasan Gateway

Gateway tidak melakukan:

1. Training LSTM.
2. Inference LSTM.
3. Penyimpanan utama ke database.
4. Visualisasi dashboard.
5. Klasifikasi final normal/waspada/anomali berdasarkan model.
6. Kontrol pendingin otomatis.
7. Kontrol kipas/AC/relay.
8. Pengukuran PUE.
9. Optimasi energi.

Gateway boleh melakukan validasi sederhana dan penandaan kondisi trouble, tetapi keputusan status termal berbasis prediksi tetap dilakukan oleh backend/ML Worker.

---

## 5. Hardware Gateway

## 5.1 Komponen Hardware

| Komponen | Fungsi |
|---|---|
| Raspberry Pi | Menjalankan program gateway |
| Sensor XY-MD02 S1 | Membaca suhu dan kelembaban ambient/reference |
| Sensor XY-MD02 S2 | Membaca suhu dan kelembaban hotspot/exhaust |
| USB RS485 Converter | Menghubungkan sensor RS485 ke Raspberry Pi |
| Kabel RS485 | Menghubungkan sensor ke converter |
| Adaptor Raspberry Pi | Sumber daya gateway |
| Jaringan lokal | Menghubungkan Raspberry Pi ke backend |
| Laptop/backend server | Menjalankan Go backend, database, dashboard, ML worker |

---

## 5.2 Penempatan Sensor

### S1 — Ambient / Reference Sensor

S1 ditempatkan pada area ambient atau referensi ruangan. Sensor ini tidak ditempatkan dekat sumber panas langsung. Data S1 digunakan sebagai pembanding kondisi lingkungan sekitar.

### S2 — Hotspot / Exhaust Sensor

S2 ditempatkan dekat area hotspot atau exhaust laptop/server testbed. Sensor ini menjadi sensor utama karena suhu S2 digunakan sebagai target prediksi model LSTM.

---

## 5.3 Topologi Hardware

```text
         ┌────────────────────┐
         │  Sensor S1 XY-MD02 │
         │  Ambient/Reference │
         └─────────┬──────────┘
                   │ RS485 A/B
                   │
                   │
         ┌─────────┴──────────┐
         │  Sensor S2 XY-MD02 │
         │  Hotspot/Exhaust   │
         └─────────┬──────────┘
                   │ RS485 A/B
                   │
         ┌─────────▼──────────┐
         │ USB RS485 Converter│
         └─────────┬──────────┘
                   │ USB
         ┌─────────▼──────────┐
         │   Raspberry Pi     │
         │   Gateway Program  │
         └─────────┬──────────┘
                   │ HTTP JSON
         ┌─────────▼──────────┐
         │   Go Backend API   │
         └────────────────────┘
```

---

## 6. Komunikasi Sensor

## 6.1 Protokol

Sensor XY-MD02 menggunakan komunikasi:

```text
Modbus RTU over RS485
```

Raspberry Pi membaca sensor melalui USB RS485 Converter yang biasanya muncul sebagai serial device:

```text
/dev/ttyUSB0
```

atau

```text
/dev/ttyUSB1
```

Pada Windows development, device dapat muncul sebagai:

```text
COM3
COM4
```

---

## 6.2 Parameter Komunikasi Awal

Parameter awal yang direkomendasikan:

| Parameter | Nilai Awal |
|---|---|
| Serial port | `/dev/ttyUSB0` |
| Baudrate | 9600 |
| Data bits | 8 |
| Parity | None |
| Stop bits | 1 |
| Timeout | 3 detik |
| Sensor S1 slave ID | 1 |
| Sensor S2 slave ID | 2 |
| Mode | Modbus RTU |

Catatan: nilai register, skala suhu, dan skala kelembaban harus disesuaikan dengan datasheet atau hasil uji sensor XY-MD02 yang digunakan.

---

## 6.3 Register Sensor

Karena variasi module bisa berbeda, AI agent harus membuat konfigurasi register fleksibel.

Konfigurasi awal:

| Data | Register | Keterangan |
|---|---|---|
| Temperature | configurable | Register suhu |
| Humidity | configurable | Register kelembaban |

Contoh konfigurasi:

```yaml
registers:
  temperature:
    address: 1
    count: 1
    scale: 0.1
  humidity:
    address: 2
    count: 1
    scale: 0.1
```

Jika hasil pembacaan tidak sesuai, register dapat diubah melalui file konfigurasi tanpa mengubah kode utama.

---

## 7. Software Gateway

## 7.1 Bahasa dan Library

Gateway dibuat menggunakan Python.

Rekomendasi library:

| Library | Fungsi |
|---|---|
| `pymodbus` | Membaca sensor Modbus RTU |
| `requests` atau `httpx` | Mengirim HTTP request ke backend |
| `python-dotenv` | Membaca konfigurasi `.env` |
| `PyYAML` | Membaca file konfigurasi YAML |
| `logging` | Menulis log gateway |
| `tenacity` opsional | Retry request |
| `schedule` opsional | Scheduler sederhana |

---

## 7.2 Struktur Folder Gateway

```text
gateway/
├── src/
│   ├── main.py
│   ├── config_loader.py
│   ├── modbus_reader.py
│   ├── sensor_validator.py
│   ├── payload_builder.py
│   ├── http_sender.py
│   ├── local_logger.py
│   ├── simulator.py
│   ├── replay.py
│   └── models.py
│
├── logs/
│   └── gateway.log
│
├── data/
│   ├── failed_payloads.jsonl
│   └── replay_sample.csv
│
├── config.example.yaml
├── .env.example
├── requirements.txt
└── README.md
```

---

## 7.3 File Utama

### `main.py`

Entry point gateway.

Tugas:

1. Load konfigurasi.
2. Tentukan mode hardware/simulator/replay.
3. Jalankan loop pembacaan.
4. Kirim payload ke backend.
5. Catat log.
6. Tunggu berdasarkan interval sampling.
7. Ulangi proses.

### `config_loader.py`

Membaca konfigurasi dari `.env` dan `config.yaml`.

### `modbus_reader.py`

Membaca sensor XY-MD02 melalui Modbus RTU.

### `sensor_validator.py`

Memvalidasi nilai sensor.

### `payload_builder.py`

Membentuk payload JSON.

### `http_sender.py`

Mengirim request ke backend dan melakukan retry.

### `local_logger.py`

Mengatur logging lokal.

### `simulator.py`

Menghasilkan data sensor simulasi.

### `replay.py`

Mengirim ulang data dari file CSV/JSON untuk demo.

### `models.py`

Menyimpan struktur data Python seperti dataclass untuk sensor reading dan payload.

---

## 8. Konfigurasi Gateway

## 8.1 `config.example.yaml`

```yaml
gateway:
  id: "raspi-gateway-01"
  name: "Raspberry Pi Gateway 01"
  mode: "simulator" # simulator | hardware | replay

backend:
  url: "http://localhost:8080/api/v1/readings"
  token: "change-me"
  timeout_seconds: 5
  retry_count: 3
  retry_delay_seconds: 2

sampling:
  interval_seconds: 60

modbus:
  port: "/dev/ttyUSB0"
  baudrate: 9600
  bytesize: 8
  parity: "N"
  stopbits: 1
  timeout_seconds: 3

sensors:
  - code: "S1"
    role: "ambient"
    name: "S1 Ambient Sensor"
    slave_id: 1
    enabled: true
    registers:
      temperature:
        address: 1
        count: 1
        scale: 0.1
      humidity:
        address: 2
        count: 1
        scale: 0.1

  - code: "S2"
    role: "hotspot"
    name: "S2 Hotspot Sensor"
    slave_id: 2
    enabled: true
    registers:
      temperature:
        address: 1
        count: 1
        scale: 0.1
      humidity:
        address: 2
        count: 1
        scale: 0.1

validation:
  temperature_min: 0
  temperature_max: 80
  humidity_min: 0
  humidity_max: 100

simulator:
  scenario: "normal" # normal | warming | waspada | anomali | trouble | mixed
  noise_enabled: true
  send_interval_seconds: 60

replay:
  file_path: "./data/replay_sample.csv"
  speed_multiplier: 1.0

logging:
  level: "INFO"
  file_path: "./logs/gateway.log"
```

---

## 8.2 `.env.example`

```env
GATEWAY_ID=raspi-gateway-01
GATEWAY_MODE=simulator

BACKEND_URL=http://localhost:8080/api/v1/readings
BACKEND_TOKEN=change-me

MODBUS_PORT=/dev/ttyUSB0
MODBUS_BAUDRATE=9600

SAMPLING_INTERVAL_SECONDS=60

LOG_LEVEL=INFO
```

Catatan: konfigurasi YAML lebih detail. `.env` dapat digunakan untuk override nilai penting.

---

## 9. Format Data Internal

## 9.1 Sensor Reading Object

```json
{
  "sensor_code": "S1",
  "sensor_role": "ambient",
  "temperature": 27.4,
  "humidity": 63.2,
  "quality_status": "valid",
  "message": "Sensor read successfully"
}
```

## 9.2 Gateway Payload Object

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

## 9.3 Gateway Status Payload

Digunakan jika terjadi trouble.

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

---

## 10. API Tujuan Gateway

## 10.1 Kirim Data Sensor

```http
POST /api/v1/readings
```

Header:

```text
Authorization: Bearer <BACKEND_TOKEN>
Content-Type: application/json
```

Payload:

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

Response sukses:

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

---

## 10.2 Kirim Status Gateway/Sensor Trouble

```http
POST /api/v1/gateway/status
```

Payload:

```json
{
  "gateway_id": "raspi-gateway-01",
  "status": "active",
  "reported_at": "2026-05-23T14:30:00+07:00",
  "sensors": [
    {
      "sensor_code": "S2",
      "status": "trouble",
      "message": "Sensor timeout"
    }
  ]
}
```

---

## 11. Alur Runtime Gateway

## 11.1 Alur Umum

```text
Start Gateway
    ↓
Load Configuration
    ↓
Check Mode
    ↓
If hardware:
    Read S1 via Modbus
    Read S2 via Modbus
If simulator:
    Generate S1 and S2 simulated data
If replay:
    Read next row from replay file
    ↓
Validate Sensor Data
    ↓
Build JSON Payload
    ↓
Send Payload to Backend
    ↓
If Success:
    Write success log
If Failed:
    Retry
    Save failed payload locally if still failed
    ↓
Sleep based on sampling interval
    ↓
Repeat
```

---

## 11.2 Pseudocode Main Loop

```python
def main():
    config = load_config()
    logger = setup_logger(config)

    while True:
        recorded_at = now_iso()

        try:
            if config.gateway.mode == "hardware":
                readings = read_hardware_sensors(config)
            elif config.gateway.mode == "simulator":
                readings = generate_simulated_readings(config)
            elif config.gateway.mode == "replay":
                readings = read_replay_data(config)
            else:
                raise ValueError("Unsupported gateway mode")

            valid_readings, trouble_status = validate_readings(readings, config)

            if valid_readings:
                payload = build_payload(
                    gateway_id=config.gateway.id,
                    recorded_at=recorded_at,
                    source=config.gateway.mode,
                    readings=valid_readings
                )
                send_payload(payload, config.backend)

            if trouble_status:
                send_gateway_status(trouble_status, config.backend)

        except Exception as error:
            logger.exception("Gateway loop failed")
            save_error_log(error)

        sleep(config.sampling.interval_seconds)
```

---

## 12. Mode Hardware

## 12.1 Cara Kerja

Pada mode hardware, gateway membaca sensor asli melalui Modbus RTU.

```text
Raspberry Pi
    ↓
Open serial port /dev/ttyUSB0
    ↓
Read sensor slave ID 1
    ↓
Read temperature and humidity S1
    ↓
Read sensor slave ID 2
    ↓
Read temperature and humidity S2
    ↓
Validate
    ↓
Send to backend
```

## 12.2 Pseudocode Read Sensor

```python
def read_sensor(client, sensor_config):
    slave_id = sensor_config["slave_id"]

    temp_register = sensor_config["registers"]["temperature"]
    hum_register = sensor_config["registers"]["humidity"]

    raw_temp = client.read_holding_registers(
        address=temp_register["address"],
        count=temp_register["count"],
        slave=slave_id
    )

    raw_hum = client.read_holding_registers(
        address=hum_register["address"],
        count=hum_register["count"],
        slave=slave_id
    )

    temperature = raw_temp.registers[0] * temp_register["scale"]
    humidity = raw_hum.registers[0] * hum_register["scale"]

    return {
        "sensor_code": sensor_config["code"],
        "sensor_role": sensor_config["role"],
        "temperature": temperature,
        "humidity": humidity
    }
```

Catatan: fungsi dan parameter `pymodbus` dapat berbeda tergantung versi library. AI agent harus menyesuaikan dengan versi yang dipakai.

---

## 12.3 Error Mode Hardware

| Error | Handling |
|---|---|
| Serial port tidak ditemukan | Log error, hentikan mode hardware |
| Sensor tidak merespons | Tandai sensor trouble |
| Register salah | Log error dan sarankan cek konfigurasi |
| Data tidak masuk akal | Tandai invalid |
| Backend tidak reachable | Retry lalu simpan payload lokal |
| USB RS485 terlepas | Log error, sensor trouble |

---

## 13. Mode Simulator

## 13.1 Tujuan Simulator

Simulator wajib dibuat agar sistem tetap bisa dikembangkan dan didemokan walaupun hardware belum siap.

Simulator harus menghasilkan payload yang sama seperti gateway asli.

---

## 13.2 Scenario Simulator

| Scenario | Fungsi |
|---|---|
| `normal` | S1 dan S2 berada pada suhu normal |
| `warming` | Suhu S2 naik perlahan |
| `waspada` | S2 berada pada rentang waspada |
| `anomali` | S2 berada di atas threshold anomali |
| `trouble` | Mensimulasikan sensor timeout/data invalid |
| `mixed` | Menggabungkan beberapa kondisi secara bergantian |

---

## 13.3 Pola Data Simulator

### Scenario Normal

| Sensor | Suhu | Kelembaban |
|---|---|---|
| S1 | 26–28°C | 55–65% |
| S2 | 27–29°C | 50–60% |

### Scenario Warming

| Sensor | Suhu |
|---|---|
| S1 | Relatif stabil 26–28°C |
| S2 | Naik perlahan dari 28°C ke 31°C |

### Scenario Waspada

| Sensor | Suhu |
|---|---|
| S2 | 30–32°C |

### Scenario Anomali

| Sensor | Suhu |
|---|---|
| S2 | > 32°C |

### Scenario Trouble

| Sensor | Kondisi |
|---|---|
| S1/S2 | timeout, null, atau data di luar rentang |

---

## 13.4 Pseudocode Simulator

```python
def generate_simulated_readings(scenario):
    if scenario == "normal":
        s1_temp = random_between(26.0, 28.0)
        s2_temp = random_between(27.0, 29.0)
    elif scenario == "waspada":
        s1_temp = random_between(26.0, 28.0)
        s2_temp = random_between(30.0, 32.0)
    elif scenario == "anomali":
        s1_temp = random_between(27.0, 29.0)
        s2_temp = random_between(32.5, 35.0)
    elif scenario == "warming":
        s1_temp = stable_temperature()
        s2_temp = increasing_temperature()
    elif scenario == "trouble":
        return generate_trouble_status()
    else:
        return generate_mixed_pattern()

    return [
        {
            "sensor_code": "S1",
            "sensor_role": "ambient",
            "temperature": round(s1_temp, 2),
            "humidity": round(random_between(55.0, 65.0), 2)
        },
        {
            "sensor_code": "S2",
            "sensor_role": "hotspot",
            "temperature": round(s2_temp, 2),
            "humidity": round(random_between(50.0, 60.0), 2)
        }
    ]
```

---

## 14. Mode Replay

## 14.1 Tujuan Replay

Mode replay digunakan untuk demo atau pengujian ulang dengan dataset tertentu.

Contoh penggunaan:

1. Menggunakan data CSV hasil pembacaan sebelumnya.
2. Mengirim data lama seolah-olah real-time.
3. Memastikan dashboard dan ML worker dapat diuji tanpa sensor aktif.

---

## 14.2 Format CSV Replay

```csv
timestamp,temperature_s1,humidity_s1,temperature_s2,humidity_s2
2026-05-23T14:00:00+07:00,27.1,63.2,28.4,58.1
2026-05-23T14:01:00+07:00,27.2,63.0,28.6,58.0
2026-05-23T14:02:00+07:00,27.2,62.9,29.1,57.8
```

---

## 14.3 Behavior Replay

1. Baca baris pertama.
2. Bentuk payload S1 dan S2.
3. Kirim ke backend.
4. Tunggu interval replay.
5. Baca baris berikutnya.
6. Ulangi sampai selesai.

---

## 15. Validasi Data

## 15.1 Validasi Field

| Field | Rule |
|---|---|
| `sensor_code` | Wajib `S1` atau `S2` |
| `sensor_role` | `ambient` untuk S1, `hotspot` untuk S2 |
| `temperature` | Wajib numeric |
| `humidity` | Wajib numeric |
| `recorded_at` | Wajib timestamp |
| `gateway_id` | Wajib string |

---

## 15.2 Validasi Rentang

| Parameter | Minimum | Maximum |
|---|---|---|
| Temperature | 0°C | 80°C |
| Humidity | 0% | 100% |

Catatan:

1. Rentang ini digunakan untuk mencegah nilai tidak logis.
2. Threshold status termal berbeda dari validasi rentang.
3. Suhu > 32°C bukan invalid, tetapi dapat menjadi anomali.
4. Suhu negatif atau > 80°C dianggap invalid untuk konteks testbed.

---

## 15.3 Validasi Role Sensor

| sensor_code | sensor_role yang benar |
|---|---|
| S1 | ambient |
| S2 | hotspot |

Jika tidak sesuai, gateway harus mencatat warning dan backend juga harus menolak atau memperbaiki berdasarkan konfigurasi.

---

## 16. Retry dan Buffer Lokal

## 16.1 Retry HTTP

Jika backend tidak dapat dihubungi, gateway melakukan retry.

Default:

| Parameter | Nilai |
|---|---|
| retry_count | 3 |
| retry_delay_seconds | 2 |
| timeout_seconds | 5 |

---

## 16.2 Buffer Payload Gagal

Jika setelah retry tetap gagal, gateway menyimpan payload ke file lokal:

```text
gateway/data/failed_payloads.jsonl
```

Format JSONL:

```json
{"recorded_at":"2026-05-23T14:30:00+07:00","payload":{...},"error":"connection timeout"}
```

---

## 16.3 Replay Failed Payload

Gateway dapat memiliki command:

```bash
python src/main.py --replay-failed
```

Fungsi:

1. Baca `failed_payloads.jsonl`.
2. Kirim ulang payload.
3. Jika sukses, pindahkan ke file `sent_payloads.jsonl` atau hapus dari queue.
4. Jika gagal, tetap simpan.

---

## 17. Logging Gateway

## 17.1 Format Log

```text
2026-05-23 14:30:00 INFO  Gateway started mode=simulator
2026-05-23 14:30:01 INFO  Read S1 temperature=27.4 humidity=63.2
2026-05-23 14:30:01 INFO  Read S2 temperature=30.8 humidity=58.5
2026-05-23 14:30:02 INFO  Payload sent successfully stored_count=2
2026-05-23 14:31:01 WARNING S2 sensor timeout
2026-05-23 14:31:02 ERROR Backend request failed error=connection timeout
```

---

## 17.2 Log Level

| Level | Penggunaan |
|---|---|
| DEBUG | Detail teknis pembacaan register |
| INFO | Gateway berjalan normal |
| WARNING | Sensor timeout, data tidak wajar, retry |
| ERROR | Backend gagal, serial port error, exception |

---

## 17.3 File Log

Default:

```text
gateway/logs/gateway.log
```

Log tidak perlu dikirim semua ke backend. Hanya status penting seperti sensor trouble yang dikirim melalui endpoint gateway status.

---

## 18. CLI Command Gateway

AI agent dapat menyediakan CLI command sederhana.

## 18.1 Run Mode Default

```bash
python src/main.py
```

## 18.2 Run Simulator

```bash
python src/main.py --mode simulator --scenario normal
```

```bash
python src/main.py --mode simulator --scenario anomali
```

## 18.3 Run Hardware

```bash
python src/main.py --mode hardware
```

## 18.4 Run Replay

```bash
python src/main.py --mode replay --file ./data/replay_sample.csv
```

## 18.5 Test Backend Connection

```bash
python src/main.py --test-backend
```

## 18.6 Test Sensor Read

```bash
python src/main.py --test-sensor
```

## 18.7 Replay Failed Payload

```bash
python src/main.py --replay-failed
```

---

## 19. Requirements Python

## 19.1 `requirements.txt`

```txt
pymodbus==3.6.9
requests==2.32.3
python-dotenv==1.0.1
PyYAML==6.0.2
tenacity==8.5.0
```

Catatan:

1. Versi dapat disesuaikan saat implementasi.
2. Jika `pymodbus` API berubah, AI agent harus menyesuaikan pemanggilan fungsi.
3. Untuk Raspberry Pi, instalasi dilakukan dalam virtual environment.

---

## 19.2 Setup Virtual Environment

```bash
cd gateway
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

---

## 20. Contoh Implementasi Dataclass

```python
from dataclasses import dataclass
from typing import Literal

SensorCode = Literal["S1", "S2"]
SensorRole = Literal["ambient", "hotspot"]

@dataclass
class SensorReading:
    sensor_code: SensorCode
    sensor_role: SensorRole
    temperature: float
    humidity: float
    quality_status: str = "valid"
    message: str | None = None
```

---

## 21. Contoh HTTP Sender

```python
import requests

def send_payload(payload: dict, backend_url: str, token: str, timeout: int = 5):
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
    }

    response = requests.post(
        backend_url,
        json=payload,
        headers=headers,
        timeout=timeout,
    )

    response.raise_for_status()
    return response.json()
```

---

## 22. Contoh Payload Builder

```python
from datetime import datetime, timezone

def build_payload(gateway_id: str, source: str, readings: list[dict]) -> dict:
    return {
        "gateway_id": gateway_id,
        "recorded_at": datetime.now(timezone.utc).isoformat(),
        "source": source,
        "readings": [
            {
                "sensor_code": item["sensor_code"],
                "sensor_role": item["sensor_role"],
                "temperature": item["temperature"],
                "humidity": item["humidity"],
            }
            for item in readings
        ],
    }
```

---

## 23. Contoh Validator

```python
def validate_reading(reading: dict, config: dict) -> tuple[bool, str | None]:
    if reading["sensor_code"] not in ["S1", "S2"]:
        return False, "invalid sensor_code"

    if reading["sensor_code"] == "S1" and reading["sensor_role"] != "ambient":
        return False, "S1 must use ambient role"

    if reading["sensor_code"] == "S2" and reading["sensor_role"] != "hotspot":
        return False, "S2 must use hotspot role"

    temp = reading["temperature"]
    hum = reading["humidity"]

    if temp is None or hum is None:
        return False, "temperature and humidity are required"

    if temp < config["validation"]["temperature_min"] or temp > config["validation"]["temperature_max"]:
        return False, "temperature out of range"

    if hum < config["validation"]["humidity_min"] or hum > config["validation"]["humidity_max"]:
        return False, "humidity out of range"

    return True, None
```

---

## 24. Error Handling Detail

## 24.1 Sensor Timeout

Kondisi:

1. Sensor tidak merespons.
2. Modbus read gagal.
3. Timeout serial.

Handling:

1. Catat log warning.
2. Jangan kirim data sensor tersebut sebagai valid.
3. Kirim gateway status trouble.
4. Lanjutkan pembacaan sensor lain jika memungkinkan.

---

## 24.2 Salah Satu Sensor Gagal

Jika S1 gagal tetapi S2 berhasil:

1. Kirim data S2 valid ke backend.
2. Kirim status trouble untuk S1.
3. Catat log warning.

Jika S2 gagal tetapi S1 berhasil:

1. Kirim data S1 valid ke backend.
2. Kirim status trouble untuk S2.
3. Catat log warning.

Jika S1 dan S2 gagal:

1. Tidak mengirim readings valid.
2. Kirim gateway status trouble untuk keduanya.
3. Catat error.

---

## 24.3 Backend Tidak Tersedia

Handling:

1. Retry sesuai konfigurasi.
2. Jika gagal, simpan payload ke buffer lokal.
3. Catat error.
4. Loop tetap berjalan.

---

## 24.4 Data Tidak Valid

Contoh data tidak valid:

1. Suhu null.
2. Kelembaban null.
3. Suhu < 0.
4. Suhu > 80.
5. Kelembaban < 0.
6. Kelembaban > 100.
7. Sensor code tidak sesuai.
8. Sensor role tidak sesuai.

Handling:

1. Jangan kirim sebagai data valid.
2. Catat log warning.
3. Kirim status trouble jika perlu.

---

## 25. Sampling Strategy

Default interval:

```text
60 detik
```

Alasan:

1. Sesuai rancangan skripsi.
2. Cukup untuk melihat perubahan suhu server testbed.
3. Tidak membuat database terlalu berat.
4. Mendukung window 30 data sebagai 30 menit historis.
5. Mendukung horizon prediksi 5 menit.

---

## 26. Gateway State

Gateway sebaiknya menyimpan state sederhana:

| State | Fungsi |
|---|---|
| last_success_sent_at | Waktu terakhir data sukses terkirim |
| last_sensor_status | Status terakhir S1/S2 |
| failed_payload_count | Jumlah payload gagal |
| mode | hardware/simulator/replay |
| scenario | normal/waspada/anomali/etc |

State dapat disimpan di memory dan log lokal. Tidak wajib disimpan ke file kecuali failed payload.

---

## 27. Testing Gateway

## 27.1 Unit Test

| Test | Expected Result |
|---|---|
| Validasi S1 valid | Return valid |
| Validasi S2 valid | Return valid |
| Suhu -1 | Invalid |
| Suhu 90 | Invalid |
| Humidity 120 | Invalid |
| sensor_code S3 | Invalid |
| S1 role hotspot | Invalid |
| S2 role ambient | Invalid |
| Payload builder | Menghasilkan JSON sesuai API spec |

---

## 27.2 Integration Test Simulator

| Skenario | Expected Result |
|---|---|
| Simulator normal | Backend menerima data normal |
| Simulator waspada | Backend menerima data S2 30–32°C |
| Simulator anomali | Backend menerima data S2 > 32°C |
| Simulator trouble | Backend menerima status trouble |
| Backend offline | Payload disimpan ke failed buffer |
| Backend kembali online | Payload gagal dapat dikirim ulang |

---

## 27.3 Hardware Test

| Test | Expected Result |
|---|---|
| Cek port USB RS485 | `/dev/ttyUSB0` ditemukan |
| Baca sensor S1 | Mendapat suhu/kelembaban |
| Baca sensor S2 | Mendapat suhu/kelembaban |
| Cabut sensor S2 | Status S2 trouble |
| Ubah slave ID salah | Sensor tidak terbaca dan log error |
| Kirim ke backend | Data tersimpan ke database |

---

## 28. Acceptance Criteria Gateway

Gateway dianggap selesai apabila:

```text
[ ] Gateway memiliki file konfigurasi
[ ] Gateway dapat berjalan dalam mode simulator
[ ] Gateway dapat menghasilkan data S1 dan S2
[ ] Gateway dapat menghasilkan skenario normal
[ ] Gateway dapat menghasilkan skenario waspada
[ ] Gateway dapat menghasilkan skenario anomali
[ ] Gateway dapat menghasilkan skenario trouble
[ ] Gateway dapat membentuk payload JSON sesuai API spec
[ ] Gateway dapat mengirim payload ke backend
[ ] Gateway menggunakan Authorization Bearer token
[ ] Gateway dapat melakukan retry jika backend gagal
[ ] Gateway menyimpan failed payload ke buffer lokal
[ ] Gateway dapat replay failed payload
[ ] Gateway memiliki mode hardware
[ ] Gateway memiliki modul pembacaan Modbus RS485
[ ] Gateway dapat menangani sensor timeout
[ ] Gateway mencatat log lokal
[ ] Gateway memiliki README setup
[ ] Gateway dapat dijalankan di Raspberry Pi
[ ] Gateway dapat dijalankan di laptop untuk simulator
```

---

## 29. Instruksi Implementasi untuk AI Agent

AI agent harus mengikuti instruksi berikut:

1. Buat gateway menggunakan Python.
2. Pisahkan modul: config loader, modbus reader, validator, payload builder, sender, simulator, replay, logger.
3. Buat mode simulator terlebih dahulu agar backend dan dashboard bisa diuji tanpa hardware.
4. Pastikan payload simulator sama dengan payload hardware.
5. Buat konfigurasi YAML yang fleksibel untuk sensor dan register Modbus.
6. Jangan hardcode backend token.
7. Jangan hardcode serial port.
8. Gunakan retry saat mengirim data ke backend.
9. Simpan failed payload ke JSONL.
10. Catat error gateway ke file log.
11. Buat command test backend.
12. Buat command test sensor.
13. Buat README yang menjelaskan cara menjalankan mode simulator dan hardware.
14. Jangan melakukan training LSTM di gateway.
15. Jangan melakukan kontrol pendingin otomatis di gateway.
16. Jangan melakukan perhitungan PUE di gateway.
17. Pastikan gateway tetap berjalan meskipun satu sensor gagal.
18. Pastikan gateway aman untuk demo dengan mode simulator/replay.

---

## 30. README Gateway Minimum

File `gateway/README.md` minimal berisi:

1. Deskripsi gateway.
2. Hardware yang dibutuhkan.
3. Wiring umum RS485.
4. Cara install Python dependency.
5. Cara konfigurasi `config.yaml`.
6. Cara menjalankan simulator.
7. Cara menjalankan hardware mode.
8. Cara test backend.
9. Cara test sensor.
10. Cara replay failed payload.
11. Troubleshooting umum.

---

## 31. Troubleshooting Umum

| Masalah | Kemungkinan Penyebab | Solusi |
|---|---|---|
| `/dev/ttyUSB0` tidak ditemukan | Converter tidak terbaca | Cek kabel USB, jalankan `ls /dev/ttyUSB*` |
| Permission denied serial port | User belum masuk grup dialout | Jalankan `sudo usermod -a -G dialout $USER` |
| Sensor timeout | Wiring A/B terbalik atau slave ID salah | Cek kabel RS485 dan konfigurasi slave ID |
| Data suhu tidak masuk akal | Register/scale salah | Cek register dan skala sensor |
| Backend 401 | Token salah | Cek `BACKEND_TOKEN` |
| Backend timeout | Backend mati atau URL salah | Cek URL dan port backend |
| Data tidak tampil dashboard | Data belum masuk database | Cek backend log dan database |
| Telegram tidak terkirim | Bukan tugas gateway utama | Cek backend notification service |

---

## 32. Ringkasan Final Gateway

```text
Bahasa          : Python
Platform        : Raspberry Pi
Sensor          : XY-MD02 S1 dan S2
Komunikasi      : Modbus RTU over RS485
Converter       : USB RS485 Converter
Backend         : Go REST API
Payload         : JSON
Auth            : Bearer token
Sampling        : 1 menit
Mode            : hardware, simulator, replay
Simulator       : normal, warming, waspada, anomali, trouble, mixed
Error handling  : timeout, invalid data, backend offline
Buffer lokal    : failed_payloads.jsonl
Log lokal       : gateway/logs/gateway.log
Batasan         : tidak training LSTM, tidak kontrol pendingin, tidak PUE
```
