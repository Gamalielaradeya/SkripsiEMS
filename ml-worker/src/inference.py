"""
inference.py — LSTM Inference: prediksi suhu S2 berikutnya dari N data terakhir.
Dijalankan secara periodik oleh scheduler atau manual:
    python inference.py
"""

import os
import sys
import logging
import numpy as np
from datetime import datetime, timezone, timedelta

sys.path.insert(0, os.path.dirname(__file__))

from config import Config
from db import get_connection
from load_dataset import load_sensor_readings
from preprocess import preprocess
from windowing import FEATURE_COLS, TARGET_COL
from classify_status import classify

import joblib
import requests

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
log = logging.getLogger("ml.inference")


def load_model_and_scaler(cfg: Config):
    """Load saved LSTM model dan scaler."""
    model_path  = os.path.join(cfg.MODEL_DIR, "lstm_model.keras")
    scaler_path = os.path.join(cfg.SCALER_DIR, "scaler.pkl")

    if not os.path.exists(model_path):
        raise FileNotFoundError(f"Model tidak ditemukan: {model_path}. Jalankan train_lstm.py dulu.")
    if not os.path.exists(scaler_path):
        raise FileNotFoundError(f"Scaler tidak ditemukan: {scaler_path}.")

    from tensorflow.keras.models import load_model
    model  = load_model(model_path)
    scaler = joblib.load(scaler_path)
    log.info(f"Model loaded: {model_path}")
    return model, scaler


def get_latest_window(cfg: Config):
    """Ambil window_size data terakhir dari DB, return array (window_size, 4)."""
    import pandas as pd

    # Ambil data mentah (lebih banyak untuk buffer resample)
    df_raw = load_sensor_readings(limit=cfg.WINDOW_SIZE * 10)
    if df_raw.empty:
        raise ValueError("Tidak ada data sensor di database.")

    df_raw["recorded_at"] = pd.to_datetime(df_raw["recorded_at"], utc=True)

    # Pivot S1/S2
    s1 = df_raw[df_raw["sensor_code"] == "S1"].rename(
        columns={"temperature": "temperature_s1", "humidity": "humidity_s1"})
    s2 = df_raw[df_raw["sensor_code"] == "S2"].rename(
        columns={"temperature": "temperature_s2", "humidity": "humidity_s2"})

    s1 = s1[["recorded_at", "temperature_s1", "humidity_s1"]].set_index("recorded_at")
    s2 = s2[["recorded_at", "temperature_s2", "humidity_s2"]].set_index("recorded_at")

    merged = s1.join(s2, how="inner").resample("1min").mean().ffill(limit=5).dropna()

    if len(merged) < cfg.WINDOW_SIZE:
        raise ValueError(f"Data tidak cukup untuk window {cfg.WINDOW_SIZE}: hanya {len(merged)} rows.")

    # Ambil window_size terakhir (hanya 4 feature cols)
    feature_data = merged[FEATURE_COLS].values[-cfg.WINDOW_SIZE:]
    last_ts = merged.index[-1]
    return feature_data, last_ts



def run_inference():
    cfg = Config()
    log.info("=== EMS LSTM Inference ===")

    # Load model
    try:
        model, scaler = load_model_and_scaler(cfg)
    except FileNotFoundError as e:
        log.error(str(e))
        return None

    # Get window
    try:
        window_raw, last_ts = get_latest_window(cfg)
    except (ValueError, Exception) as e:
        log.error(f"Get window error: {e}")
        return None

    # Normalize
    window_scaled = scaler.transform(window_raw)
    X = window_scaled[np.newaxis, :, :]  # shape: (1, window_size, 4)

    # Predict
    pred_scaled = model.predict(X, verbose=0)[0][0]

    # Cari index temperature_s2 di FEATURE_COLS
    s2_idx = FEATURE_COLS.index("temperature_s2")  # = 2

    # Inverse transform: set semua kolom ke mean scaled, lalu replace index s2
    # Cara yang benar: buat row dengan nilai median, replace kolom target, inverse
    dummy = np.zeros((1, len(FEATURE_COLS)))
    # Isi kolom lain dengan nilai mean dari window (scaled) supaya inverse stabil
    for i in range(len(FEATURE_COLS)):
        dummy[0, i] = float(np.mean(window_scaled[:, i]))
    dummy[0, s2_idx] = float(pred_scaled)
    pred_temp = scaler.inverse_transform(dummy)[0][s2_idx]

    # Clamp nilai yang tidak masuk akal (model masih baru, mungkin overfit)
    pred_temp = float(np.clip(pred_temp, 15.0, 60.0))

    # Threshold dari config
    threshold_normal = float(cfg.THRESHOLD_NORMAL_MAX)
    threshold_anomaly = float(cfg.THRESHOLD_ANOMALY_MIN)

    status = classify(pred_temp, threshold_normal, threshold_anomaly)
    predicted_for = last_ts + timedelta(minutes=cfg.HORIZON_MINUTES) if last_ts else datetime.now(timezone.utc) + timedelta(minutes=cfg.HORIZON_MINUTES)

    log.info(f"Prediksi S2: {pred_temp:.2f}C -> Status: {status} (untuk {cfg.HORIZON_MINUTES} menit ke depan)")

    # Simpan ke database
    result = save_prediction_to_db(cfg, pred_temp, status, last_ts, predicted_for)
    return result


def save_prediction_to_db(cfg, pred_temp, status, input_end_at, predicted_for):
    """Simpan prediksi dan anomaly event ke DB."""
    try:
        conn = get_connection()
        cur  = conn.cursor()
        now  = datetime.now(timezone.utc)

        # Get model version id
        cur.execute("SELECT id FROM model_versions ORDER BY created_at DESC LIMIT 1")
        row = cur.fetchone()
        if not row:
            log.warning("Tidak ada model_version di DB.")
            return None
        model_version_id = row[0]

        # Get sensor S2 id
        cur.execute("SELECT id FROM sensors WHERE sensor_code = 'S2' LIMIT 1")
        row = cur.fetchone()
        if not row:
            log.warning("Sensor S2 tidak ditemukan di DB.")
            return None
        sensor_s2_id = row[0]

        # Get prediction_run_id (buat baru)
        cur.execute("""
            INSERT INTO prediction_runs (model_version_id, run_type, status, finished_at)
            VALUES (%s, 'inference', 'success', NOW())
            RETURNING id
        """, (model_version_id,))
        run_id = cur.fetchone()[0]


        # Simpan prediction
        cur.execute("""
            INSERT INTO predictions
              (prediction_run_id, model_version_id, target_sensor_id,
               predicted_temperature, prediction_horizon_minutes,
               input_window_size, input_end_at, predicted_for)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id
        """, (run_id, model_version_id, sensor_s2_id,
              round(pred_temp, 4), cfg.HORIZON_MINUTES,
              cfg.WINDOW_SIZE, input_end_at, predicted_for))
        pred_id = cur.fetchone()[0]

        # Simpan anomaly event
        cur.execute("""
            INSERT INTO anomaly_events
              (prediction_id, sensor_id, status, predicted_temperature,
               threshold_normal_max, threshold_anomaly_min, description, detected_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id
        """, (pred_id, sensor_s2_id, status, round(pred_temp, 4),
              cfg.THRESHOLD_NORMAL_MAX, cfg.THRESHOLD_ANOMALY_MIN,
              f"Prediksi suhu S2: {pred_temp:.2f}C ({status})", now))
        anomaly_id = cur.fetchone()[0]

        conn.commit()
        log.info(f"Saved: prediction_id={pred_id}, anomaly_id={anomaly_id}, status={status}")

        return {
            "prediction_id": pred_id,
            "predicted_temperature": round(pred_temp, 4),
            "status": status,
            "predicted_for": predicted_for.isoformat(),
        }

    except Exception as e:
        log.error(f"Save prediction failed: {e}")
        import traceback; traceback.print_exc()
        return None
    finally:
        try: cur.close()
        except: pass
        try: conn.close()
        except: pass


if __name__ == "__main__":
    result = run_inference()
    if result:
        log.info(f"Inference selesai: {result}")
    else:
        log.error("Inference gagal.")
