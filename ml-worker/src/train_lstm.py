"""train_lstm.py — Full training pipeline LSTM."""

import os
import sys
import logging
import numpy as np
from datetime import datetime, timezone

sys.path.insert(0, os.path.dirname(__file__))

from config import Config
from db import get_connection
from load_dataset import load_sensor_readings
from preprocess import preprocess, remove_outliers
from windowing import normalize_and_window, chronological_split
from baseline import persistence_model, moving_average_model
from metrics import evaluate
from model_lstm import build_lstm, train, save_model

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
log = logging.getLogger("ml.train")


def run():
    cfg = Config()
    os.makedirs(cfg.MODEL_DIR, exist_ok=True)
    model_path  = os.path.join(cfg.MODEL_DIR, "lstm_model.keras")
    scaler_path = os.path.join(cfg.SCALER_DIR, "scaler.pkl")

    log.info("=== EMS LSTM Training Pipeline ===")
    df = load_sensor_readings()
    if len(df) < cfg.WINDOW_SIZE + cfg.HORIZON_MINUTES + 10:
        log.error("Data tidak cukup untuk training.")
        sys.exit(1)

    df = preprocess(df, horizon_minutes=cfg.HORIZON_MINUTES)
    df = remove_outliers(df)
    X, y, scaler = normalize_and_window(df, window_size=cfg.WINDOW_SIZE, scaler_path=scaler_path, fit_scaler=True)
    X_train, X_test, y_train, y_test = chronological_split(X, y, test_ratio=0.2)

    log.info("--- Evaluating Baselines ---")
    baseline_metrics = {
        "persistence":    evaluate(y_test, persistence_model(y_test), "Persistence"),
        "moving_average": evaluate(y_test, moving_average_model(y_test), "Moving Average"),
    }

    log.info("--- Training LSTM ---")
    model = build_lstm(window_size=cfg.WINDOW_SIZE, n_features=4)
    train(model, X_train, y_train, epochs=cfg.EPOCHS, batch_size=cfg.BATCH_SIZE,
          validation_split=cfg.VALIDATION_SPLIT, patience=cfg.EARLY_STOPPING_PATIENCE,
          checkpoint_path=model_path)

    log.info("--- Evaluating LSTM ---")
    y_pred_lstm = model.predict(X_test, verbose=0).flatten()
    lstm_metrics = evaluate(y_test, y_pred_lstm, "LSTM")
    save_model(model, model_path)

    _save_metrics_to_db(cfg, lstm_metrics, baseline_metrics, len(X_train), len(X_test))
    log.info("=== Training Selesai ===")


def _save_metrics_to_db(cfg, lstm_metrics, baseline_metrics, train_size, test_size):
    try:
        conn = get_connection()
        cur = conn.cursor()
        now = datetime.now(timezone.utc)
        cur.execute("SELECT id FROM model_versions ORDER BY created_at DESC LIMIT 1")
        row = cur.fetchone()
        if not row:
            log.warning("Tidak ada model_version, skip save metrics.")
            return
        mv_id = row[0]
        cur.execute("UPDATE model_versions SET trained_at = %s WHERE id = %s", (now, mv_id))
        cur.execute(
            "INSERT INTO model_metrics (model_version_id, train_size, test_size, rmse, mae, mape) VALUES (%s,%s,%s,%s,%s,%s)",
            (mv_id, train_size, test_size, lstm_metrics["rmse"], lstm_metrics["mae"], lstm_metrics["mape"])
        )
        for btype, bm in baseline_metrics.items():
            cur.execute(
                "INSERT INTO baseline_results (model_version_id, baseline_type, rmse, mae, mape) VALUES (%s,%s,%s,%s,%s)",
                (mv_id, btype, bm["rmse"], bm["mae"], bm["mape"])
            )
        conn.commit()
        log.info("Metrics saved to database.")
    except Exception as e:
        log.error(f"Save metrics failed: {e}")
    finally:
        try: cur.close()
        except: pass
        try: conn.close()
        except: pass


if __name__ == "__main__":
    run()
