"""baseline.py — Persistence dan Moving Average baseline models."""

import numpy as np
import logging

log = logging.getLogger("ml.baseline")


def persistence_model(X_test: np.ndarray, temperature_s2_index: int = 2) -> np.ndarray:
    """
    Persistence model causal: prediksi horizon = S2 terakhir pada input window.
    """
    return X_test[:, -1, temperature_s2_index]


def moving_average_model(
    X_test: np.ndarray,
    window: int = 5,
    temperature_s2_index: int = 2,
) -> np.ndarray:
    """
    Moving Average causal: rata-rata S2 terakhir dari setiap input window.
    """
    return np.mean(X_test[:, -window:, temperature_s2_index], axis=1)
