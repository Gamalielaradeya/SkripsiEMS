# Implementation Runbook Final - EMS Thermal LSTM

Dokumen ini adalah sumber operasional terbaru untuk demo. Jika contoh command pada dokumen spesifikasi lama berbeda, gunakan runbook ini.

## Scope Final

```text
XY-MD02 S1/S2
  -> Modbus RTU / RS485
  -> gateway-rpi/ atau gateway/ simulator
  -> HTTP POST + Bearer Token
  -> backend-go/
  -> PostgreSQL
  -> ml-worker/ LSTM target suhu S2
  -> SSE dashboard + Telegram alert
```

Tidak termasuk PUE aktual, kontrol AC/kipas otomatis, MQTT, atau kompleksitas enterprise.

## 1. Environment

Salin `.env.example` per modul. Token berikut harus sama:

```env
GATEWAY_API_TOKEN=dev-token-change-in-production
ML_WORKER_API_TOKEN=dev-ml-worker-token-change-in-production
```

`ML_WORKER_API_TOKEN` hanya untuk callback internal ML Worker ke backend.

## 2. Database

Jalankan database:

```bash
docker compose up -d
docker exec ems_db pg_isready -U ems_user -d ems_db
```

PowerShell:

```powershell
Get-Content -Raw database/migrations/001_create_tables.sql | docker exec -i ems_db psql -v ON_ERROR_STOP=1 -U ems_user -d ems_db
Get-Content -Raw database/migrations/002_create_indexes.sql | docker exec -i ems_db psql -v ON_ERROR_STOP=1 -U ems_user -d ems_db
Get-Content -Raw database/migrations/004_layout_constraints.sql | docker exec -i ems_db psql -v ON_ERROR_STOP=1 -U ems_user -d ems_db

Get-ChildItem database/seed/*.sql | Sort-Object Name | ForEach-Object {
  Get-Content -Raw $_.FullName | docker exec -i ems_db psql -v ON_ERROR_STOP=1 -U ems_user -d ems_db
}
```

`003_timescaledb.sql` opsional. Compose default memakai PostgreSQL 16 biasa.

## 3. Backend

```bash
cd backend-go
cp .env.example .env
go run cmd/server/main.go
```

Verifikasi:

```bash
curl http://localhost:8080/api/v1/health
curl http://localhost:8080/api/v1/layout
curl http://localhost:8080/api/v1/dashboard/summary
```

Jika request Python ke localhost lambat pada Windows karena proxy lokal, set:

```powershell
$env:NO_PROXY='localhost,127.0.0.1,::1,[::1]'
```

## 4. Frontend

```bash
cd frontend-dashboard
cp .env.example .env
npm install
npm run dev
```

Buka `http://localhost:5173`.

## 5. Gateway Simulator

`gateway/` hanya untuk simulator. Hardware fisik memakai `gateway-rpi/`.

```bash
cd gateway
cp .env.example .env
python src/main.py --mode simulator --scenario normal
python src/main.py --mode simulator --scenario warming
python src/main.py --mode simulator --scenario waspada
python src/main.py --mode simulator --scenario anomali
python src/main.py --mode simulator --scenario trouble
```

Data historis demo:

```bash
cd gateway
python inject_demo_data.py
```

## 6. Raspberry Pi Gateway

```bash
cd gateway-rpi
chmod +x install.sh
./install.sh
source .venv/bin/activate
cd src
uvicorn main:app --host 0.0.0.0 --port 8765
```

Buka `http://<IP-Raspberry-Pi>:8765`. Web UI ini hanya konfigurasi gateway lokal, bukan dashboard EMS utama.

## 7. ML Worker

```bash
cd ml-worker
cp .env.example .env
pip install -r requirements.txt
python src/train_lstm.py
python src/scheduler.py --once
python src/scheduler.py --interval 1
```

Artefak aktif:

```text
ml-worker/models/lstm_model.keras
ml-worker/models/feature_scaler.pkl
ml-worker/models/target_scaler.pkl
```

Inference membaca threshold runtime dari tabel `settings`, menyimpan prediction dan anomaly event, lalu memanggil:

```text
POST /api/v1/ml/inference-events
Authorization: Bearer <ML_WORKER_API_TOKEN>
```

Backend menerbitkan SSE dan mencoba Telegram untuk status `waspada` atau `anomali`.

## 8. Endpoint Tambahan Final

| Method | Path | Fungsi |
|---|---|---|
| POST | `/api/v1/readings` | Gateway mengirim readings atau trouble |
| POST | `/api/v1/ml/inference-events` | Callback internal setelah inference commit |
| GET | `/api/v1/layout` | Layout aktif dan posisi sensor |
| PUT | `/api/v1/layout/devices/{sensorCode}` | Simpan posisi sensor |
| DELETE | `/api/v1/layout/devices/{sensorCode}` | Lepas sensor dari layout |
| GET | `/api/v1/events` | Stream SSE dashboard |

Event SSE final:

```text
reading.latest
sensor.trouble
prediction.latest
anomaly.created
notification.sent
```

## 9. Test Otomatis

```bash
cd backend-go && go test ./...
cd gateway-rpi/src && python -m unittest test_ems_sender.py
cd ml-worker && python -m unittest discover -s tests -v
cd frontend-dashboard && npm run build
```

## 10. Flow Demo Ringkas

1. Jalankan DB, migration, seed, backend, dan frontend.
2. Jalankan `python gateway/inject_demo_data.py` untuk chart historis.
3. Jalankan simulator `normal`; cek gateway online dan pembacaan SSE.
4. Jalankan simulator `trouble`; cek status trouble dan pin abu-abu.
5. Jalankan training bila artefak belum ada.
6. Jalankan `python ml-worker/src/scheduler.py --once`.
7. Cek prediction, anomaly event, SSE, dan log Telegram.
8. Buka Sensor Layout, geser S2, simpan, reload, dan cek posisi persisten.

## 11. Catatan Telegram

Telegram dapat tetap `disabled` saat demo lokal. Backend tetap mencatat notification log `skipped`. Untuk demo kirim nyata, isi setting bot token, chat ID, lalu aktifkan `telegram_enabled`.
