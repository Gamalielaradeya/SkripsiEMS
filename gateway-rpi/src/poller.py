"""
Poller — background task baca sensor secara periodik.

MODE NORMAL (gather_data.enabled = false):
  → Baca sensor → Fire-and-forget POST ke EMS → selesai
  → Kalau EMS offline: log warning, lanjut ke interval berikutnya

MODE GATHER DATA (gather_data.enabled = true):
  → Baca sensor → Simpan ke SQLite lokal
  → TIDAK kirim ke EMS
  → Data bisa di-export CSV nanti untuk training LSTM
"""

import asyncio
import logging
from datetime import datetime, timezone

log = logging.getLogger("gateway.poller")

# State global — dibaca dari router untuk UI
poller_state = {
    "running": False,
    "last_run": None,
    "last_status": "Belum pernah jalan",
    "readings": [],
    "sent_count": 0,
    "skip_count": 0,     # EMS offline / timeout
    "error_count": 0,
    "gathered_count": 0, # Total row tersimpan di gather mode
    "mode": "forward",   # "forward" | "gather"
}

_task: asyncio.Task | None = None


async def _poll_loop(get_config_fn, reader_factory, sender_factory):
    log.info("Poller started")
    poller_state["running"] = True

    while poller_state["running"]:
        cfg = get_config_fn()
        interval    = cfg["polling"].get("interval_seconds", 60)
        gather_mode = cfg.get("gather_data", {}).get("enabled", False)
        poller_state["mode"] = "gather" if gather_mode else "forward"

        try:
            reader   = reader_factory(cfg)
            readings = reader.read_all_sensors(cfg["sensors"])

            # Simpan ke state untuk ditampilkan di UI
            poller_state["readings"] = [
                {
                    "id":          r.sensor_id,
                    "name":        r.name,
                    "temperature": r.temperature,
                    "humidity":    r.humidity,
                    "ok":          r.ok,
                    "error":       r.error,
                }
                for r in readings
            ]
            poller_state["last_run"] = datetime.now(timezone.utc).isoformat()

            ok_readings = [r for r in readings if r.ok]

            if len(ok_readings) != len(readings):
                poller_state["error_count"] += 1

            if gather_mode and not ok_readings:
                poller_state["last_status"] = "Semua sensor error - skip gather"
                log.warning("Semua sensor error, tidak ada data untuk gather")

            elif gather_mode:
                # ── GATHER MODE: simpan ke SQLite ──────────────────────────
                from local_db import save_readings
                db_path = None  # pakai default path
                await save_readings(ok_readings, cfg["gateway"]["id"], db_path)
                poller_state["gathered_count"] += len(ok_readings)
                poller_state["last_status"] = (
                    f"[GATHER] {len(ok_readings)} baris disimpan lokal — "
                    f"{datetime.now().strftime('%H:%M:%S')}"
                )
                log.info(f"[GATHER] {len(ok_readings)} readings saved to local DB")

            else:
                # ── FORWARD MODE: fire-and-forget ke EMS ──────────────────
                sender  = sender_factory(cfg)
                payload = sender.build_payload(readings, cfg["gateway"]["id"])
                ok, msg = await sender.send_async(payload)
                if ok:
                    poller_state["sent_count"] += 1
                    poller_state["last_status"] = (
                        f"[FWD] Sent OK — {datetime.now().strftime('%H:%M:%S')}"
                    )
                else:
                    poller_state["skip_count"] += 1
                    poller_state["last_status"] = f"[FWD] Skip — {msg}"
                    log.warning(f"EMS send failed ({msg}) — data discarded (fire-and-forget)")

        except Exception as e:
            log.error(f"Poller error: {e}")
            poller_state["error_count"] += 1
            poller_state["last_status"] = f"Error: {e}"

        await asyncio.sleep(interval)

    poller_state["running"] = False
    log.info("Poller stopped")


def start_poller(get_config_fn, reader_factory, sender_factory):
    global _task
    if _task and not _task.done():
        log.warning("Poller sudah running")
        return
    loop = asyncio.get_event_loop()
    _task = loop.create_task(
        _poll_loop(get_config_fn, reader_factory, sender_factory)
    )


def stop_poller():
    global _task
    poller_state["running"] = False
    if _task and not _task.done():
        _task.cancel()
    _task = None
