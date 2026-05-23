"""metrics.py — Evaluasi RMSE, MAE, MAPE."""

import numpy as np
import logging

log = logging.getLogger("ml.metrics")


def rmse(y_true: np.ndarray, y_pred: np.ndarray) -> float:
    return float(np.sqrt(np.mean((y_true - y_pred) ** 2)))


def mae(y_true: np.ndarray, y_pred: np.ndarray) -> float:
    return float(np.mean(np.abs(y_true - y_pred)))


def mape(y_true: np.ndarray, y_pred: np.ndarray) -> float:
    mask = y_true != 0
    return float(np.mean(np.abs((y_true[mask] - y_pred[mask]) / y_true[mask])) * 100)


def evaluate(y_true: np.ndarray, y_pred: np.ndarray, model_name: str = "Model") -> dict:
    r = rmse(y_true, y_pred)
    m = mae(y_true, y_pred)
    mp = mape(y_true, y_pred)
    log.info(f"[{model_name}] RMSE={r:.4f}  MAE={m:.4f}  MAPE={mp:.4f}%")
    return {"rmse": r, "mae": m, "mape": mp}
