"""baseline.py — Persistence dan Moving Average baseline models."""

import numpy as np
import logging

log = logging.getLogger("ml.baseline")


def persistence_model(y_test: np.ndarray) -> np.ndarray:
    """
    Persistence model: prediksi = nilai sebelumnya.
    y_pred[i] = y_test[i-1]
    """
    y_pred = np.roll(y_test, 1)
    y_pred[0] = y_test[0]
    return y_pred


def moving_average_model(y_test: np.ndarray, window: int = 5) -> np.ndarray:
    """
    Moving Average model dengan window tertentu.
    """
    y_pred = np.convolve(y_test, np.ones(window) / window, mode="same")
    # Perbaiki awal window yang terpotong
    for i in range(window - 1):
        y_pred[i] = np.mean(y_test[:i + 1])
    return y_pred
