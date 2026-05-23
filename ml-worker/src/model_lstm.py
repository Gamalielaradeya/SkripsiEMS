"""model_lstm.py — Definisi arsitektur LSTM sesuai spesifikasi skripsi."""

import logging
import os
import tensorflow as tf
from tensorflow.keras.models import Sequential, load_model
from tensorflow.keras.layers import LSTM, Dense, Dropout
from tensorflow.keras.callbacks import EarlyStopping, ModelCheckpoint

log = logging.getLogger("ml.model_lstm")


def build_lstm(window_size: int = 30, n_features: int = 4) -> tf.keras.Model:
    """
    Arsitektur LSTM sesuai spesifikasi skripsi:
    - LSTM 64 units, return_sequences=True
    - Dropout 0.2
    - LSTM 32 units
    - Dropout 0.2
    - Dense 16 relu
    - Dense 1 output
    - Optimizer: Adam
    - Loss: MSE
    """
    model = Sequential([
        LSTM(64, return_sequences=True, input_shape=(window_size, n_features)),
        Dropout(0.2),
        LSTM(32, return_sequences=False),
        Dropout(0.2),
        Dense(16, activation="relu"),
        Dense(1),
    ])
    model.compile(optimizer="adam", loss="mse", metrics=["mae"])
    log.info(f"LSTM model built: input_shape=({window_size}, {n_features})")
    model.summary(print_fn=log.info)
    return model


def train(model, X_train, y_train,
          epochs: int = 100,
          batch_size: int = 32,
          validation_split: float = 0.1,
          patience: int = 10,
          checkpoint_path: str = None) -> tf.keras.callbacks.History:
    """Train LSTM dengan EarlyStopping."""
    callbacks = [
        EarlyStopping(monitor="val_loss", patience=patience, restore_best_weights=True, verbose=1),
    ]
    if checkpoint_path:
        os.makedirs(os.path.dirname(checkpoint_path), exist_ok=True)
        callbacks.append(ModelCheckpoint(checkpoint_path, save_best_only=True, verbose=0))

    history = model.fit(
        X_train, y_train,
        epochs=epochs,
        batch_size=batch_size,
        validation_split=validation_split,
        callbacks=callbacks,
        verbose=1,
    )
    log.info(f"Training done. Epochs ran: {len(history.history['loss'])}")
    return history


def save_model(model, path: str):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    model.save(path)
    log.info(f"Model saved: {path}")


def load_saved_model(path: str):
    model = load_model(path)
    log.info(f"Model loaded: {path}")
    return model
