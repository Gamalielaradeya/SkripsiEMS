"""preprocess.py — Preprocessing dan feature engineering untuk LSTM."""

import pandas as pd
import numpy as np
import logging

log = logging.getLogger("ml.preprocess")


def preprocess(df: pd.DataFrame, horizon_minutes: int = 5) -> pd.DataFrame:
    """
    Steps:
    1. Pivot S1/S2 columns.
    2. Resample ke 1 menit.
    3. Handle missing values.
    4. Create target: temperature_s2 at t + horizon_minutes.
    5. Drop rows with NaN target.
    """
    if df.empty:
        raise ValueError("Dataset kosong.")

    df["recorded_at"] = pd.to_datetime(df["recorded_at"], utc=True)

    # Pivot: buat kolom per sensor
    s1 = df[df["sensor_code"] == "S1"].copy()
    s2 = df[df["sensor_code"] == "S2"].copy()

    s1 = s1.rename(columns={"temperature": "temperature_s1", "humidity": "humidity_s1"})
    s2 = s2.rename(columns={"temperature": "temperature_s2", "humidity": "humidity_s2"})

    s1 = s1[["recorded_at", "temperature_s1", "humidity_s1"]].set_index("recorded_at")
    s2 = s2[["recorded_at", "temperature_s2", "humidity_s2"]].set_index("recorded_at")

    merged = s1.join(s2, how="inner")

    # Resample ke 1 menit
    merged = merged.resample("1min").mean()

    # Forward fill untuk missing values kecil
    merged = merged.ffill(limit=5)

    # Drop rows yang masih NaN setelah fill
    before = len(merged)
    merged = merged.dropna()
    after = len(merged)
    if before > after:
        log.warning(f"Dropped {before - after} rows with NaN after resample.")

    # Buat target: temperature_s2 at t + horizon_minutes
    merged["target_temp_s2"] = merged["temperature_s2"].shift(-horizon_minutes)

    # Drop NaN target (baris terakhir tidak ada ground truth masa depan)
    merged = merged.dropna(subset=["target_temp_s2"])

    log.info(f"Preprocessed dataset: {len(merged)} rows, columns={list(merged.columns)}")
    return merged.reset_index()


def remove_outliers(df: pd.DataFrame) -> pd.DataFrame:
    """Remove temperature/humidity outliers menggunakan IQR."""
    numeric_cols = ["temperature_s1", "humidity_s1", "temperature_s2", "humidity_s2"]
    before = len(df)
    for col in numeric_cols:
        if col not in df.columns:
            continue
        Q1 = df[col].quantile(0.01)
        Q3 = df[col].quantile(0.99)
        df = df[(df[col] >= Q1) & (df[col] <= Q3)]
    after = len(df)
    if before > after:
        log.info(f"Outlier removal: {before - after} rows removed.")
    return df
