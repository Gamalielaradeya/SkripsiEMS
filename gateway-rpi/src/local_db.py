"""
Local DB — SQLite untuk mode Gather Data.
Hanya aktif kalau gather_data.enabled = true di config.yaml.
Data disimpan untuk kebutuhan training dataset ML (LSTM).
"""

import aiosqlite
import logging
from datetime import datetime, timezone
from pathlib import Path

log = logging.getLogger("gateway.db")

DB_PATH = Path(__file__).parent.parent / "gather_data.db"


async def init_db(db_path: Path = None):
    path = db_path or DB_PATH
    async with aiosqlite.connect(path) as db:
        await db.execute("""
            CREATE TABLE IF NOT EXISTS gathered_readings (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                recorded_at TEXT    NOT NULL,
                sensor_id   TEXT    NOT NULL,
                sensor_name TEXT,
                slave_id    INTEGER,
                temperature REAL,
                humidity    REAL,
                gateway_id  TEXT
            )
        """)
        await db.commit()
    log.info(f"Gather DB initialized: {path}")


async def save_readings(readings: list, gateway_id: str, db_path: Path = None):
    """Simpan semua reading yang OK ke SQLite."""
    path = db_path or DB_PATH
    ts = datetime.now(timezone.utc).isoformat()
    rows = [
        (ts, r.sensor_id, r.name, r.slave_id, r.temperature, r.humidity, gateway_id)
        for r in readings if r.ok
    ]
    if not rows:
        return
    async with aiosqlite.connect(path) as db:
        await db.executemany(
            "INSERT INTO gathered_readings "
            "(recorded_at, sensor_id, sensor_name, slave_id, temperature, humidity, gateway_id) "
            "VALUES (?,?,?,?,?,?,?)",
            rows
        )
        await db.commit()
    log.info(f"Gather DB: {len(rows)} baris disimpan")


async def count_rows(db_path: Path = None) -> int:
    path = db_path or DB_PATH
    if not path.exists():
        return 0
    async with aiosqlite.connect(path) as db:
        cur = await db.execute("SELECT COUNT(*) FROM gathered_readings")
        row = await cur.fetchone()
        return row[0] if row else 0


async def export_csv(db_path: Path = None) -> str:
    """Export semua data ke format CSV string."""
    path = db_path or DB_PATH
    lines = ["recorded_at,sensor_id,sensor_name,slave_id,temperature,humidity,gateway_id"]
    async with aiosqlite.connect(path) as db:
        cur = await db.execute(
            "SELECT recorded_at, sensor_id, sensor_name, slave_id, "
            "temperature, humidity, gateway_id "
            "FROM gathered_readings ORDER BY recorded_at ASC"
        )
        async for row in cur:
            lines.append(",".join(str(v) if v is not None else "" for v in row))
    return "\n".join(lines)


async def clear_db(db_path: Path = None):
    path = db_path or DB_PATH
    async with aiosqlite.connect(path) as db:
        await db.execute("DELETE FROM gathered_readings")
        await db.commit()
    log.info("Gather DB: semua data dihapus")
