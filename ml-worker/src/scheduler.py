"""
scheduler.py — Periodic inference scheduler untuk EMS LSTM.
Jalankan inference setiap N menit (sesuai horizon_minutes di config).

Usage:
    python scheduler.py             # inference setiap 5 menit
    python scheduler.py --once      # satu kali saja (untuk testing)
    python scheduler.py --interval 1  # setiap 1 menit
"""

import os
import sys
import time
import logging
import argparse
from datetime import datetime

sys.path.insert(0, os.path.dirname(__file__))

from config import Config
from inference import run_inference

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
log = logging.getLogger("ml.scheduler")


def main():
    parser = argparse.ArgumentParser(description="EMS LSTM Inference Scheduler")
    parser.add_argument("--once",     action="store_true", help="Jalankan sekali saja")
    parser.add_argument("--interval", type=int, default=None,
                        help="Override interval dalam menit (default: dari config)")
    args = parser.parse_args()

    cfg = Config()
    interval_minutes = args.interval if args.interval else cfg.HORIZON_MINUTES
    interval_seconds = interval_minutes * 60

    log.info(f"=== EMS ML Inference Scheduler ===")
    log.info(f"Interval: {interval_minutes} menit | Window: {cfg.WINDOW_SIZE} | Horizon: {cfg.HORIZON_MINUTES} menit")

    if args.once:
        log.info("Mode: sekali saja (--once)")
        result = run_inference()
        if result:
            log.info(f"[OK] {result}")
        else:
            log.error("[FAIL] Inference gagal")
        return

    log.info(f"Mode: loop setiap {interval_minutes} menit. Tekan Ctrl+C untuk berhenti.")
    run_count = 0

    while True:
        run_count += 1
        log.info(f"--- Inference Run #{run_count} [{datetime.now().strftime('%H:%M:%S')}] ---")

        try:
            result = run_inference()
            if result:
                log.info(f"[OK] Prediksi S2={result['predicted_temperature']:.2f}C "
                         f"| Status={result['status']} "
                         f"| Untuk={result['predicted_for'][:16]}")
            else:
                log.warning("[SKIP] Inference tidak menghasilkan prediksi")
        except Exception as e:
            log.error(f"[ERROR] {e}")

        log.info(f"Tunggu {interval_minutes} menit hingga run berikutnya...")
        time.sleep(interval_seconds)


if __name__ == "__main__":
    main()
