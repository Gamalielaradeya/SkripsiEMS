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
from windowing import FEATURE_COLS
from classify_status import classify

import joblib
import requests

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
log = logging.getLogger("ml.inference")


def load_model_and_scaler(cfg: Config):
    """Load saved LSTM model dan scaler."""
    model_path  = os.path.join(cfg.MODEL_DIR, "lstm_model.keras")
    feature_scaler_path = os.path.join(cfg.SCALER_DIR, "feature_scaler.pkl")
    target_scaler_path = os.path.join(cfg.SCALER_DIR, "target_scaler.pkl")

    if not os.path.exists(model_path):
        raise FileNotFoundError(f"Model tidak ditemukan: {model_path}. Jalankan train_lstm.py dulu.")
    if not os.path.exists(feature_scaler_path):
        raise FileNotFoundError(f"Feature scaler tidak ditemukan: {feature_scaler_path}.")
    if not os.path.exists(target_scaler_path):
        raise FileNotFoundError(f"Target scaler tidak ditemukan: {target_scaler_path}.")

    from tensorflow.keras.models import load_model
    model  = load_model(model_path)
    feature_scaler = joblib.load(feature_scaler_path)
    target_scaler = joblib.load(target_scaler_path)
    log.info(f"Model loaded: {model_path}")
    return model, feature_scaler, target_scaler


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


def parse_runtime_thresholds(rows, default_normal, default_anomaly):
    """Parse settings rows and reject an invalid threshold ordering."""
    values = dict(rows)
    threshold_normal = float(values.get("threshold_normal_max", default_normal))
    threshold_anomaly = float(values.get("threshold_anomaly_min", default_anomaly))
    if threshold_normal >= threshold_anomaly:
        raise ValueError("threshold_normal_max must be lower than threshold_anomaly_min")
    return threshold_normal, threshold_anomaly


def load_runtime_thresholds(cfg: Config):
    """Read editable thresholds from DB, with env defaults as fallback."""
    defaults = (float(cfg.THRESHOLD_NORMAL_MAX), float(cfg.THRESHOLD_ANOMALY_MIN))
    conn = None
    cur = None
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("""
            SELECT key, value
            FROM settings
            WHERE key IN ('threshold_normal_max', 'threshold_anomaly_min')
        """)
        return parse_runtime_thresholds(cur.fetchall(), *defaults)
    except Exception as exc:
        log.warning(f"Runtime thresholds unavailable, using env defaults: {exc}")
        return defaults
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()



def run_inference():
    cfg = Config()
    log.info("=== EMS LSTM Inference ===")

    # Load model
    try:
        model, feature_scaler, target_scaler = load_model_and_scaler(cfg)
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
    window_scaled = feature_scaler.transform(window_raw)
    X = window_scaled[np.newaxis, :, :]  # shape: (1, window_size, 4)

    # Predict
    pred_scaled = model.predict(X, verbose=0).reshape(-1, 1)
    pred_temp = target_scaler.inverse_transform(pred_scaled)[0][0]

    # Clamp nilai yang tidak masuk akal (model masih baru, mungkin overfit)
    pred_temp = float(np.clip(pred_temp, 15.0, 60.0))

    # Threshold editable dari DB, fallback ke env.
    threshold_normal, threshold_anomaly = load_runtime_thresholds(cfg)

    status = classify(pred_temp, threshold_normal, threshold_anomaly)
    predicted_for = last_ts + timedelta(minutes=cfg.HORIZON_MINUTES) if last_ts else datetime.now(timezone.utc) + timedelta(minutes=cfg.HORIZON_MINUTES)

    log.info(f"Prediksi S2: {pred_temp:.2f}C -> Status: {status} (untuk {cfg.HORIZON_MINUTES} menit ke depan)")

    # Simpan ke database
    result = save_prediction_to_db(
        cfg, pred_temp, status, threshold_normal, threshold_anomaly, last_ts, predicted_for
    )
    if result:
        notify_backend(cfg, result["prediction_id"], result["anomaly_event_id"])
    return result


def notify_backend(cfg, prediction_id: int, anomaly_event_id: int) -> bool:
    """Notify backend after DB commit so SSE and Telegram are processed."""
    endpoint = f"{cfg.BACKEND_URL.rstrip('/')}/api/v1/ml/inference-events"
    headers = {
        "Authorization": f"Bearer {cfg.ML_WORKER_API_TOKEN}",
        "Content-Type": "application/json",
    }
    payload = {
        "prediction_id": prediction_id,
        "anomaly_event_id": anomaly_event_id,
    }
    try:
        response = requests.post(endpoint, headers=headers, json=payload, timeout=10)
        if response.status_code in (200, 202):
            log.info(f"Backend callback OK: prediction_id={prediction_id}")
            return True
        log.warning(f"Backend callback failed: HTTP {response.status_code} {response.text[:200]}")
    except requests.RequestException as exc:
        log.warning(f"Backend callback unavailable: {exc}")
    return False


def save_prediction_to_db(
    cfg, pred_temp, status, threshold_normal, threshold_anomaly, input_end_at, predicted_for
):
    """Simpan prediksi dan anomaly event ke DB."""
    conn = None
    cur = None
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
              threshold_normal, threshold_anomaly,
              f"Prediksi suhu S2: {pred_temp:.2f}C ({status})", now))
        anomaly_id = cur.fetchone()[0]

        conn.commit()
        log.info(f"Saved: prediction_id={pred_id}, anomaly_id={anomaly_id}, status={status}")

        return {
            "prediction_id": pred_id,
            "anomaly_event_id": anomaly_id,
            "predicted_temperature": round(pred_temp, 4),
            "status": status,
            "predicted_for": predicted_for.isoformat(),
        }

    except Exception as e:
        log.error(f"Save prediction failed: {e}")
        import traceback; traceback.print_exc()
        return None
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()


if __name__ == "__main__":
    result = run_inference()
    if result:
        log.info(f"Inference selesai: {result}")
    else:
        log.error("Inference gagal.")
