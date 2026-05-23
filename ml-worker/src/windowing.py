"""windowing.py — Build sliding window input untuk LSTM."""

import numpy as np
import logging
from sklearn.preprocessing import MinMaxScaler
import joblib
import os

log = logging.getLogger("ml.windowing")

FEATURE_COLS = ["temperature_s1", "humidity_s1", "temperature_s2", "humidity_s2"]
TARGET_COL   = "target_temp_s2"


def normalize_and_window(df, window_size: int = 30, scaler_path: str = None, fit_scaler: bool = True):
    """
    Normalize features dan buat window input.
    Returns:
        X: ndarray shape (samples, window_size, 4)
        y: ndarray shape (samples,)
        scaler: MinMaxScaler fitted on training data
    """
    features = df[FEATURE_COLS].values
    targets  = df[TARGET_COL].values

    scaler = MinMaxScaler()
    if fit_scaler:
        features_scaled = scaler.fit_transform(features)
        if scaler_path:
            os.makedirs(os.path.dirname(scaler_path), exist_ok=True)
            joblib.dump(scaler, scaler_path)
            log.info(f"Scaler saved: {scaler_path}")
    else:
        if scaler_path and os.path.exists(scaler_path):
            scaler = joblib.load(scaler_path)
            log.info(f"Scaler loaded: {scaler_path}")
        features_scaled = scaler.transform(features)

    X, y = [], []
    for i in range(window_size, len(features_scaled)):
        X.append(features_scaled[i - window_size:i])
        y.append(targets[i])

    X = np.array(X)
    y = np.array(y)
    log.info(f"Window dataset: X={X.shape}, y={y.shape}")
    return X, y, scaler


def chronological_split(X, y, test_ratio: float = 0.2):
    """Split X, y secara kronologis (TIDAK random)."""
    split = int(len(X) * (1 - test_ratio))
    X_train, X_test = X[:split], X[split:]
    y_train, y_test = y[:split], y[split:]
    log.info(f"Train: {len(X_train)}, Test: {len(X_test)}")
    return X_train, X_test, y_train, y_test
