"""windowing.py — Build sliding window input untuk LSTM."""

import numpy as np
import logging
from sklearn.preprocessing import MinMaxScaler
import joblib
import os

log = logging.getLogger("ml.windowing")

FEATURE_COLS = ["temperature_s1", "humidity_s1", "temperature_s2", "humidity_s2"]
TARGET_COL   = "target_temp_s2"


def build_windows(df, window_size: int = 30):
    """
    Buat sliding window mentah sebelum split dan scaling.
    Returns:
        X: ndarray shape (samples, window_size, 4)
        y: ndarray shape (samples,)
    """
    features = df[FEATURE_COLS].values
    targets  = df[TARGET_COL].values

    X, y = [], []
    for i in range(window_size, len(features)):
        X.append(features[i - window_size:i])
        y.append(targets[i])

    X = np.array(X)
    y = np.array(y)
    log.info(f"Window dataset: X={X.shape}, y={y.shape}")
    return X, y


def fit_and_scale_windows(
    X_train,
    X_test,
    y_train,
    y_test,
    feature_scaler_path: str = None,
    target_scaler_path: str = None,
):
    """Fit scalers pada train saja, lalu transform train dan test."""
    if len(X_train) == 0 or len(X_test) == 0:
        raise ValueError("Train dan test window harus berisi data.")
    n_features = X_train.shape[2]
    feature_scaler = MinMaxScaler()
    target_scaler = MinMaxScaler()

    X_train_scaled = feature_scaler.fit_transform(
        X_train.reshape(-1, n_features)
    ).reshape(X_train.shape)
    X_test_scaled = feature_scaler.transform(
        X_test.reshape(-1, n_features)
    ).reshape(X_test.shape)
    y_train_scaled = target_scaler.fit_transform(y_train.reshape(-1, 1)).reshape(-1)
    y_test_scaled = target_scaler.transform(y_test.reshape(-1, 1)).reshape(-1)

    if feature_scaler_path:
        os.makedirs(os.path.dirname(feature_scaler_path), exist_ok=True)
        joblib.dump(feature_scaler, feature_scaler_path)
        log.info(f"Feature scaler saved: {feature_scaler_path}")
    if target_scaler_path:
        os.makedirs(os.path.dirname(target_scaler_path), exist_ok=True)
        joblib.dump(target_scaler, target_scaler_path)
        log.info(f"Target scaler saved: {target_scaler_path}")

    return (
        X_train_scaled,
        X_test_scaled,
        y_train_scaled,
        y_test_scaled,
        feature_scaler,
        target_scaler,
    )


def chronological_split(X, y, test_ratio: float = 0.2):
    """Split X, y secara kronologis (TIDAK random)."""
    if len(X) < 2:
        raise ValueError("Minimal dua window diperlukan untuk chronological split.")
    split = int(len(X) * (1 - test_ratio))
    split = max(1, min(split, len(X) - 1))
    X_train, X_test = X[:split], X[split:]
    y_train, y_test = y[:split], y[split:]
    log.info(f"Train: {len(X_train)}, Test: {len(X_test)}")
    return X_train, X_test, y_train, y_test
