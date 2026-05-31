"""load_dataset.py — Load sensor readings dari database."""

import pandas as pd
import logging
from db import get_connection, get_dict_cursor

log = logging.getLogger("ml.load_dataset")


def _build_query(limit: int = None) -> tuple[str, tuple]:
    base_query = """
        SELECT
            sr.recorded_at,
            s.sensor_code,
            sr.temperature,
            sr.humidity,
            sr.quality_status
        FROM sensor_readings sr
        JOIN sensors s ON sr.sensor_id = s.id
        WHERE sr.quality_status IN ('valid', 'simulated')
    """
    if limit:
        return (
            f"""
                SELECT *
                FROM ({base_query} ORDER BY sr.recorded_at DESC LIMIT %s) recent
                ORDER BY recorded_at ASC
            """,
            (int(limit),),
        )
    return base_query + " ORDER BY sr.recorded_at ASC", ()


def load_sensor_readings(limit: int = None) -> pd.DataFrame:
    """
    Load sensor readings dari tabel sensor_readings.
    Return DataFrame dengan kolom:
        recorded_at, sensor_code, temperature, humidity
    """
    conn = get_connection()
    cur = get_dict_cursor(conn)
    try:
        query, params = _build_query(limit)
        cur.execute(query, params)
        rows = cur.fetchall()
        df = pd.DataFrame(rows)
        log.info(f"Loaded {len(df)} sensor readings from database.")
        return df
    finally:
        cur.close()
        conn.close()
