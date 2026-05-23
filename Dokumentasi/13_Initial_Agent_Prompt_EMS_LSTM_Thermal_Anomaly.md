# 13 Initial Agent Prompt — EMS LSTM Thermal Anomaly Monitoring System

**Judul Skripsi:** Prediksi Anomali Termal pada Environment Monitoring System Server Menggunakan Algoritma Long Short-Term Memory  
**Jenis Dokumen:** Initial AI Agent Prompt  
**Versi:** 1.0  
**Status:** Final untuk ditempel ke Google Antigravity / AI Coding Agent  
**Target Pengguna Dokumen:** Mahasiswa dan AI coding agent  
**Tanggal:** 2026-05-23  

---

## 1. Tujuan Dokumen

Dokumen ini berisi prompt awal yang dapat ditempelkan ke **Google Antigravity** atau AI coding agent lain untuk memulai pembuatan program dari awal sampai selesai.

Prompt ini harus digunakan setelah semua dokumen requirement dimasukkan ke folder project, khususnya folder:

```text
docs/
```

AI agent wajib membaca dokumen-dokumen tersebut terlebih dahulu sebelum menulis kode.

---

## 2. Prompt Awal untuk AI Agent

Salin seluruh prompt di bawah ini, lalu tempelkan ke Google Antigravity / AI coding agent.

```text
You are an AI coding agent working inside my local project folder.

Project name:
EMS LSTM Thermal Anomaly Monitoring System

Thesis title:
Prediksi Anomali Termal pada Environment Monitoring System Server Menggunakan Algoritma Long Short-Term Memory

Your task:
Build a complete, runnable, and well-documented thesis prototype application based on the documentation inside the docs/ folder.

This system is an Environment Monitoring System for a server testbed. It collects temperature and humidity data from two XY-MD02 sensors, stores the data as time-series data, predicts future S2 temperature using an LSTM model, classifies the thermal status, displays everything on a dashboard, and sends Telegram alerts for warning/anomaly conditions.

Before writing any code, read these documents first:

1. docs/00_Project_Context_Workflow_EMS_LSTM_Thermal_Anomaly.md
2. docs/01_PRD_EMS_LSTM_Thermal_Anomaly.md
3. docs/02_SRS_EMS_LSTM_Thermal_Anomaly.md
4. docs/03_System_Architecture_EMS_LSTM_Thermal_Anomaly.md
5. docs/04_Database_Design_EMS_LSTM_Thermal_Anomaly.md
6. docs/05_API_Specification_EMS_LSTM_Thermal_Anomaly.md
7. docs/06_Gateway_Sensor_Spec_EMS_LSTM_Thermal_Anomaly.md
8. docs/07_ML_Model_Spec_EMS_LSTM_Thermal_Anomaly.md
9. docs/08_UI_Wireframe_EMS_LSTM_Thermal_Anomaly.md
10. docs/09_Alert_Rules_EMS_LSTM_Thermal_Anomaly.md
11. docs/10_Test_Plan_EMS_LSTM_Thermal_Anomaly.md
12. docs/11_Deployment_Guide_EMS_LSTM_Thermal_Anomaly.md
13. docs/12_Demo_Script_EMS_LSTM_Thermal_Anomaly.md
14. docs/13_Initial_Agent_Prompt_EMS_LSTM_Thermal_Anomaly.md

Important:
Do not start coding randomly. First inspect the project directory, read the docs, then propose a short implementation plan.

Main objective:
Create a complete local thesis prototype that can run on one laptop for development and demo, with optional Raspberry Pi hardware integration.

Final stack:

Backend:
- Go/Golang
- REST API
- Server-Sent Events
- PostgreSQL integration
- Telegram notification service

Database:
- PostgreSQL
- TimescaleDB if possible
- If TimescaleDB setup is difficult, use normal PostgreSQL with timestamp indexes

Gateway:
- Python
- Raspberry Pi target
- XY-MD02 sensor support
- Modbus RTU over RS485
- USB RS485 Converter
- Simulator mode
- Hardware mode
- Replay mode

Machine Learning:
- Python
- TensorFlow/Keras
- Pandas
- NumPy
- Scikit-learn
- LSTM as the main model
- Persistence baseline
- Moving average baseline
- RMSE, MAE, MAPE evaluation

Frontend:
- React
- Vite
- TypeScript
- Tailwind CSS
- shadcn/ui
- Chart.js
- SSE client

Notification:
- Telegram Bot API

Core hardware concept:
- S1 = Ambient / Reference Sensor
- S2 = Hotspot / Exhaust Sensor
- Sensor type = XY-MD02
- Communication = Modbus RS485
- Gateway = Raspberry Pi
- Converter = USB RS485 Converter
- Server testbed = laptop or mini PC

Core architecture:

[Sensor XY-MD02 S1 Ambient] ─┐
                             ├── [USB RS485 Converter] ── [Raspberry Pi Gateway]
[Sensor XY-MD02 S2 Hotspot] ─┘                                      |
                                                                    | HTTP REST API / JSON
                                                                    v
                                                         [Go Backend API + SSE]
                                                                    |
                                                                    v
                                                  [PostgreSQL + TimescaleDB]
                                                                    |
                                      ┌─────────────────────────────┴─────────────────────────────┐
                                      v                                                           v
                         [Python ML Worker: LSTM]                                      [React Dashboard]
                                      |                                                           |
                                      v                                                           v
               [Prediction + Evaluation + Anomaly Status]                         [Chart + Sensor Layout + Alert]
                                      |                                                           |
                                      └────────────────────── [Telegram Notification] ─────────────┘

Locked thesis scope:
1. The system is an Environment Monitoring System for a server testbed.
2. The system uses two XY-MD02 temperature and humidity sensors.
3. S1 is ambient/reference.
4. S2 is hotspot/exhaust.
5. S2 temperature is the main prediction target.
6. LSTM is the main model.
7. Baseline is only for comparison.
8. Raspberry Pi is only a gateway.
9. ML training and inference run on the laptop/backend environment, not on Raspberry Pi.
10. The system displays actual data, historical data, prediction, status, model evaluation, sensor layout, anomaly history, and notification history.
11. The system sends Telegram alerts when warning/anomaly conditions occur.
12. The system must support simulator mode so development and demo can run without hardware.

Strictly out of scope:
1. Do not add PUE calculation.
2. Do not add energy optimization.
3. Do not add automatic cooling control.
4. Do not control fan, AC, relay, or physical actuator.
5. Do not replace LSTM as the main model.
6. Do not change the main prediction target from S2 temperature.
7. Do not turn this project into an enterprise monitoring platform.
8. Do not add Elasticsearch, Grafana, Prometheus, Kafka, or complex SIEM stack unless explicitly requested later.
9. Do not over-engineer the project.

Thermal status rules:
- Normal: predicted S2 temperature < 30°C
- Waspada: 30°C <= predicted S2 temperature <= 32°C
- Anomali: predicted S2 temperature > 32°C
- Trouble: sensor timeout, invalid data, sensor offline, or gateway problem

Important note:
The threshold 30°C and 32°C is an operational threshold for this thesis server testbed. Do not describe it as a universal server/data center standard.

ML model configuration:
- Input features:
  - temperature_s1
  - humidity_s1
  - temperature_s2
  - humidity_s2
- Target:
  - future temperature_s2
- Sampling interval:
  - 1 minute
- Window size:
  - 30 latest data points
- Prediction horizon:
  - 5 minutes ahead
- Main model:
  - LSTM
- Baselines:
  - Persistence model
  - Moving average
- Metrics:
  - RMSE
  - MAE
  - MAPE
- Data split:
  - Chronological split, not random split
- Avoid data leakage:
  - Fit scaler only on training data

Recommended project structure:

ems-lstm-thermal-anomaly/
├── backend-go/
│   ├── cmd/
│   │   └── server/
│   │       └── main.go
│   ├── internal/
│   │   ├── config/
│   │   ├── handler/
│   │   ├── middleware/
│   │   ├── model/
│   │   ├── repository/
│   │   ├── service/
│   │   ├── sse/
│   │   ├── telegram/
│   │   ├── validator/
│   │   └── logger/
│   ├── migrations/
│   ├── go.mod
│   ├── .env.example
│   └── README.md
│
├── frontend-dashboard/
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── lib/
│   │   └── types/
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── components.json
│   ├── .env.example
│   └── README.md
│
├── gateway/
│   ├── src/
│   │   ├── main.py
│   │   ├── config_loader.py
│   │   ├── modbus_reader.py
│   │   ├── sensor_validator.py
│   │   ├── payload_builder.py
│   │   ├── http_sender.py
│   │   ├── local_logger.py
│   │   ├── simulator.py
│   │   ├── replay.py
│   │   └── models.py
│   ├── logs/
│   ├── data/
│   ├── config.example.yaml
│   ├── .env.example
│   ├── requirements.txt
│   └── README.md
│
├── ml-worker/
│   ├── src/
│   │   ├── config.py
│   │   ├── db.py
│   │   ├── load_dataset.py
│   │   ├── preprocess.py
│   │   ├── windowing.py
│   │   ├── baseline.py
│   │   ├── metrics.py
│   │   ├── model_lstm.py
│   │   ├── train_lstm.py
│   │   ├── evaluate.py
│   │   ├── inference.py
│   │   ├── classify_status.py
│   │   ├── write_results.py
│   │   └── system_log.py
│   ├── models/
│   ├── artifacts/
│   ├── notebooks/
│   ├── tests/
│   ├── requirements.txt
│   ├── .env.example
│   └── README.md
│
├── database/
│   ├── migrations/
│   ├── seed/
│   ├── views/
│   └── README.md
│
├── docs/
├── docker-compose.yml
├── .env.example
└── README.md

Required database tables:
- gateways
- sensors
- sensor_readings
- model_versions
- prediction_runs
- predictions
- anomaly_events
- model_metrics
- baseline_results
- notification_logs
- layouts
- layout_devices
- status_icons
- settings
- api_tokens
- system_logs

Important database rules:
1. Use TIMESTAMPTZ for time columns.
2. sensor_readings is the main time-series table.
3. Add index on recorded_at.
4. Add index on sensor_id + recorded_at.
5. If TimescaleDB is available, convert sensor_readings into hypertable.
6. Seed gateway, S1, S2, status icons, settings, and initial model version.
7. Store predictions and anomaly events.
8. Store model metrics and baseline results.
9. Store Telegram notification logs.
10. Store system logs for gateway/backend/ML worker errors.

Required backend API endpoints:
- GET    /api/v1/health
- POST   /api/v1/readings
- POST   /api/v1/readings/batch
- POST   /api/v1/gateway/status
- GET    /api/v1/dashboard/summary
- GET    /api/v1/events
- GET    /api/v1/readings/latest
- GET    /api/v1/readings/history
- GET    /api/v1/sensors
- GET    /api/v1/predictions/latest
- GET    /api/v1/predictions/history
- POST   /api/v1/predictions
- GET    /api/v1/anomalies
- GET    /api/v1/anomalies/latest
- GET    /api/v1/anomalies/:id
- GET    /api/v1/model-versions
- GET    /api/v1/model-metrics/latest
- GET    /api/v1/baselines/latest
- GET    /api/v1/model-comparison/latest
- GET    /api/v1/layout
- PUT    /api/v1/layout/sensors/:id/position
- GET    /api/v1/status-icons
- GET    /api/v1/notifications
- POST   /api/v1/notifications/test
- GET    /api/v1/settings
- PUT    /api/v1/settings/:key
- GET    /api/v1/system-logs

Gateway API payload:
POST /api/v1/readings

{
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
}

Backend must:
1. Validate gateway bearer token.
2. Validate payload.
3. Store readings.
4. Update gateway last_seen_at.
5. Update sensor last_seen_at.
6. Emit SSE reading.latest.
7. Keep running even if Telegram fails.

Gateway must support:
1. Simulator mode.
2. Hardware mode.
3. Replay mode.
4. Scenario normal.
5. Scenario warming.
6. Scenario waspada.
7. Scenario anomali.
8. Scenario trouble.
9. Retry request.
10. Local failed payload buffer.
11. Local logging.

Frontend dashboard must include:
1. Sidebar.
2. Topbar.
3. Main dashboard page.
4. S1 temperature card.
5. S1 humidity card.
6. S2 temperature card.
7. S2 humidity card.
8. Predicted S2 temperature card.
9. Thermal status card.
10. Temperature chart.
11. Humidity chart.
12. Actual S2 vs Predicted S2 chart.
13. Recent anomaly table.
14. Model evaluation page.
15. Sensor readings page.
16. Predictions page.
17. Anomalies page.
18. Sensor layout page.
19. Notifications page.
20. Settings page.
21. System logs page.
22. Loading state.
23. Empty state.
24. Error state.
25. SSE client.
26. Fallback polling if SSE fails.

Frontend UI requirements:
1. Use React + Vite + TypeScript.
2. Use Tailwind CSS.
3. Use shadcn/ui components.
4. Use Chart.js.
5. Use clean and professional dashboard design.
6. Do not use a raw template.
7. Use status badges for normal, waspada, anomali, and trouble.
8. Make UI easy to explain in thesis presentation.

Telegram alert rules:
1. Send alert when status becomes waspada.
2. Send alert when status becomes anomali.
3. Send alert when S2 sensor trouble occurs.
4. Apply cooldown, default 5 minutes.
5. Do not spam repeated same status.
6. Escalation from waspada to anomali must still send notification.
7. Store all notification attempts in notification_logs.
8. If Telegram fails, do not crash the backend.

Telegram message example:

[EMS THERMAL ALERT]

Status        : ANOMALI
Sensor Acuan  : S2 - Hotspot/Exhaust
Prediksi S2   : 33.1°C
Horizon       : 5 menit ke depan
Waktu Prediksi: 2026-05-23 14:35:00
Waktu Deteksi : 2026-05-23 14:30:00

Sistem memprediksi suhu melewati batas operasional.
Silakan cek dashboard EMS untuk tindakan pemantauan.

ML Worker must:
1. Load sensor data from database.
2. Merge S1 and S2 by timestamp.
3. Resample to 1-minute interval if needed.
4. Handle missing values.
5. Remove invalid values.
6. Create target temperature_s2 at t+5.
7. Normalize features.
8. Build window input with shape samples, 30, 4.
9. Split chronologically.
10. Build persistence baseline.
11. Build moving average baseline.
12. Train LSTM.
13. Evaluate RMSE, MAE, MAPE.
14. Save model and scalers.
15. Save model version and metrics to database.
16. Run inference using latest 30 data.
17. Save prediction.
18. Classify status.
19. Save anomaly event.
20. Trigger notification through backend or database flow.

Recommended LSTM architecture:
- Input shape: (30, 4)
- LSTM 64 units, return_sequences=True
- Dropout 0.2
- LSTM 32 units
- Dropout 0.2
- Dense 16 relu
- Dense 1 output
- Optimizer Adam
- Loss MSE
- EarlyStopping enabled

Required environment files:
1. root .env.example
2. backend-go/.env.example
3. frontend-dashboard/.env.example
4. gateway/.env.example
5. gateway/config.example.yaml
6. ml-worker/.env.example

Required README files:
1. root README.md
2. backend-go/README.md
3. frontend-dashboard/README.md
4. gateway/README.md
5. ml-worker/README.md
6. database/README.md

Development order:
1. Inspect folder structure.
2. Read all docs.
3. Summarize understanding.
4. Create project skeleton if empty.
5. Create docker-compose.yml for PostgreSQL/TimescaleDB.
6. Create database migrations and seed files.
7. Create backend Go structure.
8. Implement health check.
9. Implement POST readings.
10. Implement latest/history readings.
11. Implement SSE hub.
12. Implement dashboard summary.
13. Implement gateway simulator.
14. Test simulator → backend → database.
15. Create frontend React dashboard.
16. Connect dashboard to backend API.
17. Implement charts and cards.
18. Implement settings and status badges.
19. Implement ML Worker dataset loader.
20. Implement preprocessing and windowing.
21. Implement baseline models.
22. Implement LSTM training.
23. Implement evaluation metrics.
24. Implement inference.
25. Store predictions and anomaly events.
26. Implement Telegram notification service.
27. Implement alert cooldown.
28. Implement sensor layout.
29. Implement notifications and system logs pages.
30. Write README and demo commands.
31. Run full end-to-end test.

First task you must perform now:
1. Inspect the current project directory.
2. Check whether the repository is empty or already contains files.
3. Check whether the docs/ folder exists.
4. List which required docs are present and which are missing.
5. Confirm whether backend-go, frontend-dashboard, gateway, ml-worker, and database folders exist.
6. Do not generate code yet until you provide a short implementation plan.

After inspection, respond with:
1. Summary of current folder state.
2. Missing files/folders.
3. Proposed implementation plan.
4. First milestone to implement.
5. Commands you plan to run.

Acceptance criteria for the final system:
1. PostgreSQL runs.
2. Migrations and seed data run successfully.
3. Gateway simulator sends S1/S2 data.
4. Backend receives and stores sensor readings.
5. Dashboard displays S1/S2 readings.
6. Dashboard displays temperature and humidity charts.
7. ML Worker trains LSTM.
8. ML Worker creates baseline comparison.
9. RMSE, MAE, and MAPE are saved and displayed.
10. ML Worker predicts S2 temperature.
11. Status normal/waspada/anomali is classified.
12. Anomaly events are stored.
13. Telegram alert can be sent.
14. Sensor layout shows S1 and S2.
15. System logs and notification logs are available.
16. System can run locally for demo.
17. README explains setup, testing, and demo flow.
18. The implementation stays aligned with thesis scope.

Important reminder:
This is a thesis prototype. Keep the implementation realistic, explainable, modular, and demo-ready. Do not over-engineer the system. Do not add features outside the locked thesis scope.
```

---

## 3. Prompt Alternatif Versi Lebih Singkat

Gunakan versi ini apabila AI agent sulit menerima prompt yang terlalu panjang.

```text
You are an AI coding agent working inside my local project folder.

Build a thesis prototype named EMS LSTM Thermal Anomaly Monitoring System.

Before coding, read all documents in docs/:
- PRD
- SRS
- System Architecture
- Database Design
- API Specification
- Gateway Sensor Spec
- ML Model Spec
- UI Wireframe
- Alert Rules
- Test Plan
- Deployment Guide
- Demo Script

Main stack:
- Backend: Go/Golang REST API + SSE
- Database: PostgreSQL + TimescaleDB if possible
- Gateway: Python, Raspberry Pi, XY-MD02, Modbus RS485, simulator mode
- ML Worker: Python, TensorFlow/Keras, LSTM
- Frontend: React + Vite + TypeScript + Tailwind CSS + shadcn/ui + Chart.js
- Notification: Telegram Bot API

Locked scope:
- EMS server testbed
- 2 sensors XY-MD02
- S1 = ambient/reference
- S2 = hotspot/exhaust
- Target prediction = future S2 temperature
- Window = 30 latest data
- Horizon = 5 minutes ahead
- Sampling = 1 minute
- Status = normal, waspada, anomali, trouble
- Metrics = RMSE, MAE, MAPE
- Baseline = persistence and moving average

Do not add:
- PUE
- energy optimization
- automatic cooling control
- fan/AC/relay control
- enterprise monitoring stack
- model replacement for LSTM

First, inspect the folder and summarize current state. Then propose an implementation plan. Do not start coding until the plan is clear.
```

---

## 4. Catatan Penggunaan

Sebelum menjalankan prompt ini:

1. Buat folder project lokal.
2. Masukkan seluruh dokumen `.md` ke folder `docs/`.
3. Buka project dengan Google Antigravity.
4. Tempel prompt utama di atas.
5. Minta AI agent mulai dari inspeksi folder.
6. Jangan langsung minta membuat semua kode sekaligus tanpa milestone.
7. Setelah milestone pertama selesai, lanjutkan bertahap.

---

## 5. Urutan Lanjutan Setelah Prompt

Setelah AI agent menjalankan inspeksi awal, lanjutkan dengan instruksi seperti:

```text
Lanjutkan Milestone 1: buat struktur folder, root README.md, .env.example, dan docker-compose.yml untuk PostgreSQL/TimescaleDB.
```

Lalu:

```text
Lanjutkan Milestone 2: buat database migrations dan seed untuk gateway, S1, S2, settings, status icons, dan model version awal.
```

Lalu:

```text
Lanjutkan Milestone 3: implementasikan Go backend health check, database connection, POST /api/v1/readings, GET /api/v1/readings/latest, dan GET /api/v1/readings/history.
```

Lanjutkan sampai semua milestone selesai.

---

## 6. Ringkasan Final

Prompt ini mengunci instruksi awal untuk AI coding agent agar program dibuat sesuai dokumen dan scope skripsi.

Fokus program:

```text
Sensor → Gateway → Backend → Database → Dashboard → ML Worker → Prediction → Status → Telegram Alert
```

Batasan penting:

```text
Tidak PUE
Tidak optimasi energi
Tidak kontrol pendingin otomatis
Tidak mengganti LSTM sebagai model utama
Tidak mengubah target prediksi dari suhu S2
```
