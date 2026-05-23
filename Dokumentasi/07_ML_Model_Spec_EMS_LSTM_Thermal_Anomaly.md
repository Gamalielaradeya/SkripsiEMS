# 07 ML Model Specification — EMS LSTM Thermal Anomaly Monitoring System

**Judul Skripsi:** Prediksi Anomali Termal pada Environment Monitoring System Server Menggunakan Algoritma Long Short-Term Memory  
**Jenis Dokumen:** Machine Learning Model Specification  
**Versi:** 1.0  
**Status:** Final untuk dasar implementasi AI Agent  
**Target Pengguna Dokumen:** AI coding agent, ML developer, mahasiswa, dan reviewer teknis  
**Tanggal:** 2026-05-23  

---

## 1. Tujuan Dokumen

Dokumen ini menjelaskan spesifikasi teknis modul **Machine Learning Worker** untuk sistem **EMS LSTM Thermal Anomaly Monitoring System**.

ML Worker bertugas untuk:

1. Mengambil data historis suhu dan kelembaban dari database.
2. Melakukan preprocessing data time-series.
3. Membentuk dataset supervised learning berbasis window.
4. Membuat baseline sederhana sebagai pembanding.
5. Melatih model LSTM.
6. Mengevaluasi model menggunakan RMSE, MAE, dan MAPE.
7. Menyimpan model, scaler, metrik evaluasi, dan versi model.
8. Melakukan inference prediksi suhu S2.
9. Menentukan status normal, waspada, atau anomali.
10. Menyimpan hasil prediksi dan status ke database.

Dokumen ini dibuat agar AI coding agent dapat membangun modul ML secara runtut, realistis untuk skripsi, dan tidak keluar dari scope penelitian.

---

## 2. Posisi ML Worker dalam Sistem

ML Worker berada setelah data sensor tersimpan di database.

```text
[Sensor S1 dan S2]
        ↓
[Raspberry Pi Gateway]
        ↓
[Go Backend API]
        ↓
[PostgreSQL + TimescaleDB]
        ↓
[Python ML Worker]
        ↓
[Preprocessing + Baseline + LSTM + Evaluation + Inference]
        ↓
[Predictions + Anomaly Events + Model Metrics]
        ↓
[Dashboard + Telegram Alert]
```

ML Worker tidak berjalan di Raspberry Pi. Raspberry Pi hanya digunakan sebagai gateway akuisisi data sensor.

---

## 3. Scope ML

## 3.1 In Scope

| Area | Keterangan |
|---|---|
| Dataset | Data suhu dan kelembaban S1 dan S2 |
| Target | Suhu S2 pada horizon waktu mendatang |
| Model utama | Long Short-Term Memory |
| Feature input | Suhu S1, kelembaban S1, suhu S2, kelembaban S2 |
| Window input | 30 data terakhir |
| Horizon prediksi | 5 menit ke depan |
| Sampling interval | 1 menit |
| Baseline | Persistence model dan moving average |
| Evaluasi | RMSE, MAE, MAPE |
| Split data | Kronologis, bukan random |
| Output | Prediksi suhu S2 |
| Status | Normal, waspada, anomali |
| Penyimpanan | Model file, scaler file, predictions, anomaly_events, metrics |

## 3.2 Out of Scope

| Area | Keterangan |
|---|---|
| Prediksi PUE | Tidak termasuk |
| Optimasi energi | Tidak termasuk |
| Kontrol pendingin | Tidak termasuk |
| Model utama selain LSTM | Tidak digunakan sebagai model utama |
| Training di Raspberry Pi | Tidak dilakukan |
| Reinforcement learning | Tidak termasuk |
| AutoML kompleks | Tidak termasuk |
| Model ensemble kompleks | Tidak termasuk |
| Prediksi semua sensor terpisah | Target utama hanya suhu S2 |
| Deteksi anomali kompleks berbasis unsupervised | Tidak menjadi fokus utama |

---

## 4. Ringkasan Konsep Model

Penelitian menggunakan LSTM untuk memprediksi suhu S2 pada waktu mendatang berdasarkan data historis dari S1 dan S2.

S1 berfungsi sebagai sensor ambient/reference.  
S2 berfungsi sebagai sensor hotspot/exhaust dan menjadi target utama prediksi.

Model menerima input berupa window data historis:

```text
temperature_s1
humidity_s1
temperature_s2
humidity_s2
```

Lalu model menghasilkan output:

```text
future_temperature_s2
```

Dengan konfigurasi awal:

```text
Sampling interval : 1 menit
Window input      : 30 data terakhir
Horizon prediksi  : 5 menit ke depan
Target            : suhu S2
```

---

## 5. Data Source

Data ML berasal dari tabel:

```text
sensor_readings
```

Dengan relasi ke tabel:

```text
sensors
gateways
```

ML Worker juga menulis hasil ke tabel:

```text
model_versions
model_metrics
baseline_results
prediction_runs
predictions
anomaly_events
system_logs
```

---

## 6. Dataset Final untuk ML

ML Worker harus mengubah data sensor yang tersimpan per sensor menjadi dataset gabungan per timestamp.

## 6.1 Bentuk Data Mentah

Data mentah di database biasanya berbentuk seperti ini:

| recorded_at | sensor_code | temperature | humidity |
|---|---|---:|---:|
| 2026-05-23 14:00:00 | S1 | 27.1 | 63.2 |
| 2026-05-23 14:00:00 | S2 | 28.4 | 58.1 |
| 2026-05-23 14:01:00 | S1 | 27.2 | 63.0 |
| 2026-05-23 14:01:00 | S2 | 28.6 | 58.0 |

## 6.2 Bentuk Dataset Gabungan

Dataset untuk ML harus menjadi:

| timestamp | temperature_s1 | humidity_s1 | temperature_s2 | humidity_s2 |
|---|---:|---:|---:|---:|
| 2026-05-23 14:00:00 | 27.1 | 63.2 | 28.4 | 58.1 |
| 2026-05-23 14:01:00 | 27.2 | 63.0 | 28.6 | 58.0 |
| 2026-05-23 14:02:00 | 27.2 | 62.9 | 29.1 | 57.8 |

## 6.3 Target Column

Target model:

```text
temperature_s2_future
```

Target dibuat dengan shifting data S2 sejauh horizon prediksi.

Jika horizon prediksi = 5 menit dan interval = 1 menit, maka:

```text
target pada waktu t = temperature_s2 pada t+5
```

---

## 7. Feature dan Target

## 7.1 Feature Input

| Feature | Keterangan |
|---|---|
| `temperature_s1` | Suhu sensor ambient/reference |
| `humidity_s1` | Kelembaban sensor ambient/reference |
| `temperature_s2` | Suhu sensor hotspot/exhaust |
| `humidity_s2` | Kelembaban sensor hotspot/exhaust |

## 7.2 Target Output

| Target | Keterangan |
|---|---|
| `temperature_s2_future` | Suhu S2 pada horizon 5 menit ke depan |

## 7.3 Alasan Target S2

S2 dipilih sebagai target karena diletakkan dekat area hotspot/exhaust laptop/server testbed. Sensor ini paling merepresentasikan perubahan suhu yang dipengaruhi oleh panas perangkat.

---

## 8. Parameter Awal Model

| Parameter | Nilai Awal | Keterangan |
|---|---:|---|
| Sampling interval | 60 detik | Data dibaca tiap 1 menit |
| Window size | 30 | 30 data terakhir |
| Window duration | 30 menit | Jika interval 1 menit |
| Prediction horizon | 5 menit | Prediksi suhu S2 5 menit ke depan |
| Input features | 4 | S1 temp, S1 hum, S2 temp, S2 hum |
| Output | 1 | Prediksi suhu S2 |
| Split method | Chronological | Tidak random |
| Train ratio | 70% | Data awal |
| Validation ratio | 15% | Data tengah |
| Test ratio | 15% | Data akhir |
| Batch size | 32 | Dapat disesuaikan |
| Epoch | 50 | Dapat memakai early stopping |
| Loss | MSE | Untuk regresi |
| Optimizer | Adam | Default |
| Metric | RMSE, MAE, MAPE | Evaluasi akhir |

---

## 9. Minimum Data Requirement

Minimal data untuk inference:

```text
window_size + horizon = 30 + 5 = 35 data per sensor
```

Minimal data untuk training development:

```text
>= 300 data per sensor
```

Data lebih baik untuk training:

```text
>= 1000 data per sensor
```

Catatan:

1. Semakin sedikit data, performa LSTM bisa tidak stabil.
2. Baseline tetap wajib dibuat sebagai pembanding.
3. Jika data real belum cukup, simulator dapat digunakan untuk development.
4. Untuk hasil akademik, data real tetap lebih diutamakan.

---

## 10. Preprocessing Pipeline

## 10.1 Alur Preprocessing

```text
Load Data
    ↓
Sort by Timestamp
    ↓
Merge S1 and S2
    ↓
Validate Timestamp
    ↓
Resample to 1-Minute Interval
    ↓
Handle Missing Value
    ↓
Detect Invalid/Outlier Values
    ↓
Create Target Column
    ↓
Normalize Features
    ↓
Build Window Data
    ↓
Chronological Split
```

---

## 10.2 Load Data

ML Worker mengambil data dari database berdasarkan rentang waktu tertentu.

Contoh query:

```sql
SELECT
    s.sensor_code,
    sr.temperature,
    sr.humidity,
    sr.recorded_at
FROM sensor_readings sr
JOIN sensors s ON s.id = sr.sensor_id
WHERE sr.quality_status IN ('valid', 'simulated')
  AND sr.recorded_at BETWEEN $1 AND $2
ORDER BY sr.recorded_at ASC;
```

---

## 10.3 Merge S1 dan S2

Data S1 dan S2 harus digabung berdasarkan timestamp.

Jika timestamp sama persis:

```text
JOIN by recorded_at
```

Jika timestamp tidak sama persis:

```text
Resample per 1 menit lalu merge
```

Rekomendasi implementasi Python:

```python
df = df.set_index("timestamp").sort_index()
df_resampled = df.groupby("sensor_code").resample("1min").mean()
```

Kemudian pivot:

```python
pivot = df.pivot_table(
    index="timestamp",
    columns="sensor_code",
    values=["temperature", "humidity"]
)
```

---

## 10.4 Validasi Timestamp

Aturan:

1. Timestamp tidak boleh kosong.
2. Timestamp harus bisa dikonversi ke datetime.
3. Data harus diurutkan secara naik.
4. Duplikasi timestamp per sensor harus ditangani.

Strategi duplikasi:

```text
Jika ada timestamp duplikat untuk sensor yang sama, ambil nilai terakhir atau rata-rata.
```

---

## 10.5 Missing Value Handling

Kondisi missing value dapat terjadi jika:

1. Sensor timeout.
2. Gateway gagal mengirim data.
3. S1 masuk tetapi S2 tidak masuk.
4. S2 masuk tetapi S1 tidak masuk.

Strategi awal:

| Kondisi | Strategi |
|---|---|
| Missing kecil | Forward fill |
| Missing berurutan pendek | Interpolation |
| Missing panjang | Drop window terkait |
| Missing target | Drop row target |
| Missing terlalu banyak | Catat warning dan jangan training |

Rekomendasi implementasi:

```python
df = df.interpolate(method="time", limit=3)
df = df.ffill(limit=3)
df = df.dropna()
```

Catatan:

1. Jangan interpolation terlalu panjang.
2. Missing value yang banyak harus dilaporkan.
3. Data hasil interpolasi boleh digunakan untuk training jika jumlahnya kecil dan dijelaskan.

---

## 10.6 Outlier dan Nilai Tidak Wajar

Validasi rentang:

| Parameter | Minimum | Maximum |
|---|---:|---:|
| Temperature | 0°C | 80°C |
| Humidity | 0% | 100% |

Nilai di luar rentang dianggap invalid.

Strategi:

1. Tandai sebagai invalid.
2. Jangan gunakan untuk training.
3. Catat jumlah data invalid.
4. Untuk anomaly termal, suhu > 32°C bukan invalid karena itu bisa menjadi skenario anomali.

---

## 10.7 Target Shifting

Target dibuat dengan shifting suhu S2 ke depan.

Jika:

```text
horizon_minutes = 5
sampling_interval = 1 menit
horizon_steps = 5
```

Maka:

```python
df["target_temperature_s2"] = df["temperature_s2"].shift(-5)
```

Baris terakhir yang targetnya kosong harus dibuang.

---

## 10.8 Normalisasi

Normalisasi dilakukan pada feature input.

Rekomendasi:

```text
MinMaxScaler
```

Feature yang dinormalisasi:

```text
temperature_s1
humidity_s1
temperature_s2
humidity_s2
```

Target dapat:

1. Dinormalisasi bersama suhu.
2. Dinormalisasi terpisah.
3. Dikembalikan ke satuan Celsius saat evaluasi.

Rekomendasi implementasi paling aman:

1. Gunakan scaler untuk feature.
2. Gunakan scaler target terpisah untuk target.
3. Simpan kedua scaler ke file.

File scaler:

```text
ml-worker/models/feature_scaler.pkl
ml-worker/models/target_scaler.pkl
```

---

## 10.9 Chronological Split

Data time-series tidak boleh di-split secara random.

Split awal:

| Bagian | Rasio |
|---|---:|
| Train | 70% |
| Validation | 15% |
| Test | 15% |

Contoh:

```text
Data awal 70%  → training
Data tengah 15% → validation
Data akhir 15% → testing
```

Alasan:

1. Mencegah data leakage.
2. Lebih sesuai dengan forecasting time-series.
3. Model diuji pada data masa depan relatif terhadap data training.

---

## 11. Windowing

## 11.1 Tujuan Windowing

LSTM membutuhkan input 3 dimensi:

```text
(samples, timesteps, features)
```

Dengan konfigurasi:

```text
timesteps = 30
features = 4
```

Maka bentuk input:

```text
X shape = (jumlah_sample, 30, 4)
y shape = (jumlah_sample, 1)
```

---

## 11.2 Contoh Window

Untuk memprediksi suhu S2 pada t+5:

```text
Input:
t-29 sampai t
[
  [temperature_s1, humidity_s1, temperature_s2, humidity_s2],
  ...
  [temperature_s1, humidity_s1, temperature_s2, humidity_s2]
]

Output:
temperature_s2 pada t+5
```

---

## 11.3 Pseudocode Windowing

```python
def build_windows(features, target, window_size):
    X = []
    y = []

    for i in range(window_size, len(features)):
        X.append(features[i-window_size:i])
        y.append(target[i])

    return np.array(X), np.array(y)
```

Catatan: target sudah digeser sebelumnya sehingga `target[i]` merepresentasikan suhu S2 pada horizon prediksi.

---

## 12. Baseline Model

Baseline digunakan sebagai pembanding agar performa LSTM tidak dinilai sendirian.

## 12.1 Persistence Model

Persistence model menggunakan nilai suhu S2 terakhir sebagai prediksi masa depan.

```text
prediksi t+5 = temperature_s2 pada t
```

Pseudocode:

```python
y_pred_persistence = last_temperature_s2_in_window
```

Kelebihan:

1. Sangat sederhana.
2. Cocok sebagai baseline minimum.
3. Mudah dijelaskan.

---

## 12.2 Moving Average

Moving average menggunakan rata-rata beberapa suhu S2 terakhir.

Default window:

```text
5 data terakhir atau 10 data terakhir
```

Pseudocode:

```python
y_pred_ma = mean(last_n_temperature_s2)
```

Kelebihan:

1. Sederhana.
2. Mengurangi noise.
3. Cocok dibandingkan dengan LSTM.

---

## 12.3 Baseline Metrics

Baseline harus dievaluasi dengan metrik yang sama:

1. RMSE.
2. MAE.
3. MAPE.

Hasil baseline disimpan ke tabel:

```text
baseline_results
```

---

## 13. LSTM Model Architecture

## 13.1 Arsitektur Awal

Arsitektur awal yang disarankan:

```text
Input shape: (30, 4)
LSTM layer 1: 64 units, return_sequences=True
Dropout: 0.2
LSTM layer 2: 32 units
Dropout: 0.2
Dense layer: 16 units, activation=relu
Output layer: 1 unit
```

## 13.2 Contoh Keras Model

```python
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense, Dropout
from tensorflow.keras.optimizers import Adam

def build_lstm_model(window_size: int, feature_count: int):
    model = Sequential()
    model.add(LSTM(64, return_sequences=True, input_shape=(window_size, feature_count)))
    model.add(Dropout(0.2))
    model.add(LSTM(32))
    model.add(Dropout(0.2))
    model.add(Dense(16, activation="relu"))
    model.add(Dense(1))

    model.compile(
        optimizer=Adam(learning_rate=0.001),
        loss="mse",
        metrics=["mae"]
    )

    return model
```

---

## 13.3 Training Configuration

| Parameter | Nilai Awal |
|---|---:|
| Epoch | 50 |
| Batch size | 32 |
| Learning rate | 0.001 |
| Loss | MSE |
| Optimizer | Adam |
| Early stopping | Ya |
| Patience | 8 |
| Restore best weights | Ya |
| Validation | Chronological validation set |

---

## 13.4 Callback

Gunakan callback:

1. EarlyStopping.
2. ModelCheckpoint.
3. ReduceLROnPlateau opsional.

Contoh:

```python
from tensorflow.keras.callbacks import EarlyStopping, ModelCheckpoint

callbacks = [
    EarlyStopping(
        monitor="val_loss",
        patience=8,
        restore_best_weights=True
    ),
    ModelCheckpoint(
        filepath="models/lstm_model.keras",
        monitor="val_loss",
        save_best_only=True
    )
]
```

---

## 14. Evaluation Metrics

## 14.1 RMSE

Root Mean Square Error:

```text
RMSE = sqrt(mean((y_actual - y_pred)^2))
```

Keterangan:

1. Memberi penalti lebih besar pada error besar.
2. Satuan sama dengan target, yaitu °C.
3. Cocok untuk melihat sensitivity terhadap error tinggi.

---

## 14.2 MAE

Mean Absolute Error:

```text
MAE = mean(abs(y_actual - y_pred))
```

Keterangan:

1. Mudah dipahami.
2. Satuan °C.
3. Menunjukkan rata-rata selisih absolut.

---

## 14.3 MAPE

Mean Absolute Percentage Error:

```text
MAPE = mean(abs((y_actual - y_pred) / y_actual)) * 100
```

Keterangan:

1. Menampilkan error dalam persen.
2. Aman karena suhu server jauh dari nol.
3. Tetap harus mencegah pembagian nol secara teknis.

Implementasi aman:

```python
epsilon = 1e-8
mape = np.mean(np.abs((y_true - y_pred) / np.maximum(np.abs(y_true), epsilon))) * 100
```

---

## 14.4 Function Metrics

```python
import numpy as np
from sklearn.metrics import mean_squared_error, mean_absolute_error

def calculate_metrics(y_true, y_pred):
    rmse = np.sqrt(mean_squared_error(y_true, y_pred))
    mae = mean_absolute_error(y_true, y_pred)
    epsilon = 1e-8
    mape = np.mean(np.abs((y_true - y_pred) / np.maximum(np.abs(y_true), epsilon))) * 100
    return rmse, mae, mape
```

---

## 15. Model Output and Status Classification

## 15.1 Output Prediksi

Output model:

```text
predicted_temperature_s2
```

Contoh:

```json
{
  "predicted_temperature": 31.4,
  "predicted_for": "2026-05-23T14:35:00+07:00",
  "prediction_horizon_minutes": 5,
  "input_window_size": 30
}
```

---

## 15.2 Status Classification

Status termal ditentukan berdasarkan prediksi suhu S2.

Default threshold:

| Status | Rule |
|---|---|
| Normal | predicted_temperature_s2 < 30 |
| Waspada | 30 <= predicted_temperature_s2 <= 32 |
| Anomali | predicted_temperature_s2 > 32 |

Pseudocode:

```python
def classify_thermal_status(predicted_temperature, normal_max=30.0, anomaly_min=32.0):
    if predicted_temperature < normal_max:
        return "normal"
    elif predicted_temperature <= anomaly_min:
        return "waspada"
    return "anomali"
```

---

## 15.3 Catatan Threshold

Threshold ini digunakan sebagai threshold operasional penelitian pada server testbed. Threshold tidak diposisikan sebagai standar universal seluruh server/data center.

---

## 16. Inference Pipeline

## 16.1 Tujuan Inference

Inference digunakan untuk memprediksi suhu S2 menggunakan model yang sudah dilatih.

## 16.2 Alur Inference

```text
Load Latest 30 Data
    ↓
Validate Data Enough
    ↓
Merge S1 and S2
    ↓
Apply Same Preprocessing
    ↓
Load Feature Scaler
    ↓
Load Target Scaler
    ↓
Load LSTM Model
    ↓
Predict Scaled Target
    ↓
Inverse Transform to Celsius
    ↓
Classify Status
    ↓
Save Prediction
    ↓
Save Anomaly Event
    ↓
Trigger Notification if Waspada/Anomali
```

---

## 16.3 Input Inference

Minimal input:

```text
30 data terakhir S1 dan S2
```

Jika data kurang dari 30:

1. Jangan melakukan prediksi.
2. Catat system log.
3. Return status model not ready.

---

## 16.4 Output Inference

Disimpan ke tabel:

```text
predictions
anomaly_events
```

Contoh output:

```json
{
  "model_version": "v1.0.0",
  "target_sensor": "S2",
  "predicted_temperature": 31.4,
  "status": "waspada",
  "predicted_for": "2026-05-23T14:35:00+07:00"
}
```

---

## 17. Training Pipeline

## 17.1 Training Command

Rekomendasi command:

```bash
python src/train_lstm.py --from 2026-05-20T00:00:00+07:00 --to 2026-05-23T00:00:00+07:00
```

Atau:

```bash
python src/train_lstm.py --days 7
```

---

## 17.2 Training Steps

```text
1. Load configuration
2. Connect database
3. Load dataset
4. Validate data count
5. Merge S1 and S2
6. Resample data
7. Handle missing values
8. Create target column
9. Split chronological train/val/test
10. Fit scaler on train only
11. Transform train/val/test
12. Build windows
13. Train baseline
14. Train LSTM
15. Evaluate LSTM
16. Evaluate baseline
17. Save model and scaler
18. Insert model_version
19. Insert model_metrics
20. Insert baseline_results
21. Save evaluation artifacts
```

---

## 17.3 Important Rule: Fit Scaler on Train Only

Scaler tidak boleh fit pada seluruh dataset sebelum split karena dapat menyebabkan data leakage.

Benar:

```text
fit scaler pada train
transform train
transform validation
transform test
```

Salah:

```text
fit scaler pada seluruh dataset
lalu split
```

---

## 18. File Output ML

ML Worker harus menyimpan file output:

```text
ml-worker/models/
├── lstm_model_v1.0.0.keras
├── feature_scaler_v1.0.0.pkl
├── target_scaler_v1.0.0.pkl
└── metadata_v1.0.0.json
```

## 18.1 Metadata Model

Contoh:

```json
{
  "model_name": "ems_lstm_s2_temperature",
  "version": "v1.0.0",
  "feature_columns": [
    "temperature_s1",
    "humidity_s1",
    "temperature_s2",
    "humidity_s2"
  ],
  "target_column": "temperature_s2_future",
  "window_size": 30,
  "horizon_minutes": 5,
  "sampling_interval_seconds": 60,
  "trained_at": "2026-05-23T13:00:00+07:00",
  "metrics": {
    "rmse": 0.84,
    "mae": 0.62,
    "mape": 2.15
  }
}
```

---

## 19. Database Write Mapping

## 19.1 model_versions

Ditulis setelah training berhasil.

Wajib menyimpan:

1. model_name.
2. version.
3. feature_columns.
4. target_column.
5. window_size.
6. horizon_minutes.
7. sampling interval.
8. model_path.
9. scaler_path.
10. parameters.
11. trained_at.

---

## 19.2 model_metrics

Ditulis setelah evaluasi LSTM.

Wajib menyimpan:

1. model_version_id.
2. dataset_start_at.
3. dataset_end_at.
4. train_size.
5. test_size.
6. RMSE.
7. MAE.
8. MAPE.

---

## 19.3 baseline_results

Ditulis setelah baseline dievaluasi.

Wajib menyimpan:

1. baseline_type.
2. dataset range.
3. RMSE.
4. MAE.
5. MAPE.
6. baseline parameters.

---

## 19.4 predictions

Ditulis setelah inference.

Wajib menyimpan:

1. prediction_run_id.
2. model_version_id.
3. target_sensor_id = S2.
4. predicted_temperature.
5. horizon.
6. window.
7. input_start_at.
8. input_end_at.
9. predicted_for.
10. created_at.

---

## 19.5 anomaly_events

Ditulis setelah status diklasifikasi.

Wajib menyimpan:

1. prediction_id.
2. sensor_id = S2.
3. status.
4. predicted_temperature.
5. actual_temperature jika tersedia.
6. threshold_normal_max.
7. threshold_anomaly_min.
8. description.
9. detected_at.

---

## 20. ML Worker Folder Structure

```text
ml-worker/
├── src/
│   ├── config.py
│   ├── db.py
│   ├── load_dataset.py
│   ├── preprocess.py
│   ├── windowing.py
│   ├── baseline.py
│   ├── metrics.py
│   ├── model_lstm.py
│   ├── train_lstm.py
│   ├── evaluate.py
│   ├── inference.py
│   ├── classify_status.py
│   ├── write_results.py
│   └── system_log.py
│
├── models/
│   └── .gitkeep
│
├── artifacts/
│   ├── evaluation_predictions.csv
│   ├── training_history.csv
│   └── plots/
│
├── notebooks/
│   └── exploration.ipynb
│
├── tests/
│   ├── test_windowing.py
│   ├── test_metrics.py
│   └── test_classify_status.py
│
├── requirements.txt
├── .env.example
└── README.md
```

---

## 21. Environment Configuration

## 21.1 `.env.example`

```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=ems_user
DB_PASSWORD=ems_password
DB_NAME=ems_db
DB_SSLMODE=disable

MODEL_NAME=ems_lstm_s2_temperature
MODEL_VERSION=v1.0.0
MODEL_DIR=./models

WINDOW_SIZE=30
HORIZON_MINUTES=5
SAMPLING_INTERVAL_SECONDS=60

NORMAL_MAX_TEMPERATURE=30
ANOMALY_MIN_TEMPERATURE=32

TRAIN_RATIO=0.70
VAL_RATIO=0.15
TEST_RATIO=0.15

EPOCHS=50
BATCH_SIZE=32
LEARNING_RATE=0.001
EARLY_STOPPING_PATIENCE=8
```

---

## 22. Python Requirements

## 22.1 `requirements.txt`

```txt
numpy==1.26.4
pandas==2.2.2
scikit-learn==1.5.1
tensorflow==2.17.0
psycopg2-binary==2.9.9
SQLAlchemy==2.0.32
python-dotenv==1.0.1
joblib==1.4.2
matplotlib==3.9.2
```

Catatan:

1. Versi bisa disesuaikan dengan compatibility Python/TensorFlow saat implementasi.
2. AI agent harus memastikan versi Python kompatibel dengan TensorFlow yang dipilih.
3. Jika TensorFlow sulit berjalan pada environment tertentu, gunakan versi stabil yang kompatibel, tetapi tetap dokumentasikan perubahan.

---

## 23. CLI Commands

## 23.1 Train Model

```bash
python src/train_lstm.py --days 7
```

atau:

```bash
python src/train_lstm.py --from 2026-05-20T00:00:00+07:00 --to 2026-05-23T00:00:00+07:00
```

## 23.2 Run Baseline Only

```bash
python src/baseline.py --days 7
```

## 23.3 Evaluate Existing Model

```bash
python src/evaluate.py --model-version v1.0.0
```

## 23.4 Run Inference

```bash
python src/inference.py --model-version v1.0.0
```

## 23.5 Run Inference Loop

```bash
python src/inference.py --model-version v1.0.0 --loop --interval 300
```

## 23.6 Export Dataset

```bash
python src/load_dataset.py --days 7 --export artifacts/dataset.csv
```

---

## 24. Model Evaluation Output

## 24.1 Console Output

```text
Model: ems_lstm_s2_temperature v1.0.0
Dataset range: 2026-05-20 00:00:00 to 2026-05-23 00:00:00
Train size: 2500
Validation size: 500
Test size: 500

LSTM:
RMSE: 0.84
MAE : 0.62
MAPE: 2.15%

Baseline Persistence:
RMSE: 1.12
MAE : 0.88
MAPE: 3.01%

Baseline Moving Average:
RMSE: 1.05
MAE : 0.81
MAPE: 2.74%
```

## 24.2 Artifacts

```text
artifacts/
├── evaluation_predictions.csv
├── metrics_summary.json
├── training_history.csv
└── plots/
    ├── actual_vs_prediction.png
    ├── training_loss.png
    └── baseline_comparison.png
```

---

## 25. Status Classification Output

Contoh hasil inference:

```text
Latest window:
input_start_at = 2026-05-23 14:00:00
input_end_at   = 2026-05-23 14:30:00

Prediction:
predicted_for = 2026-05-23 14:35:00
predicted_temperature_s2 = 31.4°C
status = waspada
```

Jika status waspada/anomali, sistem menyimpan anomaly_event dan dapat memicu Telegram alert melalui backend.

---

## 26. Integration with Backend

Ada dua pendekatan integrasi.

## 26.1 Direct Database Write

ML Worker langsung menulis ke database.

Kelebihan:

1. Lebih sederhana untuk skripsi.
2. Cocok untuk pipeline training/evaluasi.
3. Tidak perlu banyak endpoint internal.

Kekurangan:

1. ML Worker perlu akses DB credential.
2. Perlu menjaga konsistensi schema.

Direkomendasikan untuk versi awal.

---

## 26.2 API Write

ML Worker menulis hasil prediksi melalui backend API.

Kelebihan:

1. Semua proses write terpusat di backend.
2. Backend dapat langsung emit SSE dan trigger Telegram.

Kekurangan:

1. Perlu endpoint internal tambahan.
2. Lebih banyak integrasi.

Boleh digunakan jika AI agent mampu membuatnya tanpa membuat sistem terlalu kompleks.

---

## 26.3 Rekomendasi Final

Untuk skripsi:

```text
Training dan evaluasi → direct database write
Inference prediction → boleh direct database write atau POST /predictions
Notification → backend yang mengirim Telegram
```

---

## 27. Model Readiness

Dashboard harus bisa menampilkan kondisi model:

| Status | Kondisi |
|---|---|
| `not_ready` | Data belum cukup atau model belum dilatih |
| `training` | Model sedang training |
| `ready` | Model tersedia dan bisa inference |
| `failed` | Training/inference gagal |

ML Worker harus mencatat status ini melalui system log atau tabel model/prediction run.

---

## 28. Data Quality Report

Setelah preprocessing, ML Worker sebaiknya menghasilkan ringkasan kualitas data:

```json
{
  "total_rows": 3000,
  "missing_rows": 12,
  "invalid_rows": 2,
  "interpolated_rows": 8,
  "dropped_rows": 6,
  "final_rows": 2994
}
```

Data quality report dapat disimpan di `metadata` pada `model_metrics`.

---

## 29. Testing ML Worker

## 29.1 Unit Test

| Test | Expected Result |
|---|---|
| build_windows dengan data cukup | Menghasilkan X shape sesuai |
| build_windows dengan data kurang | Error/empty terkontrol |
| calculate_metrics | RMSE/MAE/MAPE benar |
| classify 29.9 | normal |
| classify 30.0 | waspada |
| classify 32.0 | waspada |
| classify 32.1 | anomali |
| persistence baseline | Menghasilkan prediksi |
| moving average baseline | Menghasilkan prediksi |

---

## 29.2 Integration Test

| Test | Expected Result |
|---|---|
| Load dataset dari DB | Data berhasil dibaca |
| Merge S1/S2 | Dataset gabungan terbentuk |
| Training dengan simulator data | Model tersimpan |
| Evaluation | Metrics tersimpan |
| Inference | Prediction tersimpan |
| Status waspada | anomaly_event dibuat |
| Status anomali | anomaly_event dibuat |
| Data kurang | system_log tercatat |

---

## 29.3 End-to-End Test

```text
Simulator kirim data
    ↓
Backend simpan sensor_readings
    ↓
ML Worker training
    ↓
ML Worker inference
    ↓
Prediction masuk database
    ↓
Anomaly event dibuat
    ↓
Dashboard menampilkan prediksi/status
    ↓
Telegram alert dikirim jika waspada/anomali
```

---

## 30. Common Pitfalls

## 30.1 Data Leakage

Masalah:

```text
Scaler fit pada seluruh dataset sebelum split.
```

Solusi:

```text
Split dulu secara kronologis, fit scaler hanya pada train.
```

---

## 30.2 Random Split

Masalah:

```text
Data time-series diacak.
```

Solusi:

```text
Gunakan chronological split.
```

---

## 30.3 Target Salah

Masalah:

```text
Model memprediksi suhu S1 atau suhu saat ini, bukan suhu S2 masa depan.
```

Solusi:

```text
Target harus temperature_s2 pada t+5 menit.
```

---

## 30.4 Baseline Tidak Dibuat

Masalah:

```text
LSTM tidak punya pembanding.
```

Solusi:

```text
Buat persistence dan moving average baseline.
```

---

## 30.5 Data Terlalu Sedikit

Masalah:

```text
LSTM tidak stabil.
```

Solusi:

```text
Gunakan simulator untuk development, kumpulkan data real, dan jelaskan keterbatasan.
```

---

## 30.6 MAPE Division by Zero

Masalah:

```text
MAPE error jika y_true mendekati nol.
```

Solusi:

```text
Gunakan epsilon.
```

---

## 30.7 Threshold Dianggap Standar Universal

Masalah:

```text
Threshold 30/32°C dianggap standar server global.
```

Solusi:

```text
Jelaskan bahwa threshold adalah batas operasional penelitian pada server testbed.
```

---

## 31. ML Worker Acceptance Criteria

ML Worker dianggap selesai apabila:

```text
[ ] ML Worker dapat membaca data dari PostgreSQL
[ ] ML Worker dapat menggabungkan data S1 dan S2 berdasarkan timestamp
[ ] ML Worker dapat melakukan preprocessing
[ ] ML Worker dapat menangani missing value
[ ] ML Worker dapat membentuk target suhu S2 t+5
[ ] ML Worker dapat melakukan normalisasi
[ ] ML Worker dapat membuat window input 30 data
[ ] ML Worker melakukan split kronologis
[ ] ML Worker memiliki persistence baseline
[ ] ML Worker memiliki moving average baseline
[ ] ML Worker dapat melatih model LSTM
[ ] ML Worker dapat menyimpan model
[ ] ML Worker dapat menyimpan scaler
[ ] ML Worker dapat menghitung RMSE
[ ] ML Worker dapat menghitung MAE
[ ] ML Worker dapat menghitung MAPE
[ ] ML Worker dapat menyimpan model_metrics
[ ] ML Worker dapat menyimpan baseline_results
[ ] ML Worker dapat melakukan inference
[ ] ML Worker dapat menyimpan prediction
[ ] ML Worker dapat menentukan status normal
[ ] ML Worker dapat menentukan status waspada
[ ] ML Worker dapat menentukan status anomali
[ ] ML Worker dapat menyimpan anomaly_event
[ ] ML Worker dapat menangani data tidak cukup dengan aman
[ ] ML Worker memiliki README dan command penggunaan
```

---

## 32. Instruksi Implementasi untuk AI Agent

AI agent harus mengikuti instruksi ini:

1. Buat ML Worker menggunakan Python.
2. Pisahkan modul menjadi dataset loader, preprocessing, windowing, baseline, model, training, evaluation, inference, dan writer.
3. Gunakan LSTM sebagai model utama.
4. Jangan mengganti model utama dengan algoritma lain.
5. Buat persistence baseline.
6. Buat moving average baseline.
7. Gunakan suhu dan kelembaban S1/S2 sebagai input.
8. Gunakan suhu S2 masa depan sebagai target.
9. Gunakan window size 30.
10. Gunakan horizon prediksi 5 menit.
11. Gunakan split kronologis.
12. Fit scaler hanya pada data training.
13. Simpan model dan scaler.
14. Simpan metrics ke database.
15. Simpan baseline result ke database.
16. Simpan prediction ke database.
17. Simpan anomaly_event ke database.
18. Jangan melakukan training di Raspberry Pi.
19. Jangan membuat PUE atau optimasi energi.
20. Jangan membuat kontrol pendingin otomatis.
21. Buat CLI command yang mudah dijalankan.
22. Buat README penggunaan ML Worker.
23. Pastikan ML Worker tetap bisa berjalan dengan data simulator.
24. Catat error ke system log.
25. Pastikan output mudah digunakan untuk Bab 4.

---

## 33. README ML Worker Minimum

File `ml-worker/README.md` minimal berisi:

1. Deskripsi ML Worker.
2. Feature dan target model.
3. Cara install dependency.
4. Cara konfigurasi `.env`.
5. Cara mengambil dataset.
6. Cara menjalankan baseline.
7. Cara training LSTM.
8. Cara evaluasi model.
9. Cara menjalankan inference.
10. Cara membaca output metrics.
11. Cara interpretasi status normal/waspada/anomali.
12. Troubleshooting umum.

---

## 34. Ringkasan Final ML

```text
Bahasa          : Python
Library utama   : TensorFlow/Keras, Pandas, NumPy, Scikit-learn
Data source     : PostgreSQL/TimescaleDB
Input feature   : temperature_s1, humidity_s1, temperature_s2, humidity_s2
Target          : temperature_s2 pada horizon 5 menit
Window          : 30 data terakhir
Sampling        : 1 menit
Model utama     : LSTM
Baseline        : Persistence dan moving average
Evaluasi        : RMSE, MAE, MAPE
Status          : normal, waspada, anomali
Output DB       : model_versions, model_metrics, baseline_results, predictions, anomaly_events
Batasan         : tidak PUE, tidak kontrol pendingin, tidak training di Raspberry Pi
```
