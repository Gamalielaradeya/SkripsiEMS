"""
Gateway Simulator — EMS LSTM Thermal Anomaly
Entry point utama. Jalankan dengan:
  python src/main.py --mode simulator --scenario normal
  python src/main.py --mode simulator --scenario waspada

Untuk sensor fisik gunakan program mandiri gateway-rpi/.
"""

import argparse
import logging
import sys
import time

from config_loader import load_config
from simulator import Simulator
from http_sender import HttpSender
from local_logger import setup_logging


def main():
    parser = argparse.ArgumentParser(description="EMS Gateway")
    parser.add_argument("--mode",     choices=["simulator"], default="simulator")
    parser.add_argument("--scenario", choices=["normal", "warming", "waspada", "anomali", "trouble"], default="normal")
    parser.add_argument("--config",   default="config.yaml")
    args = parser.parse_args()

    config = load_config(args.config)
    setup_logging(config.get("logging", {}).get("level", "info"))
    log = logging.getLogger("gateway.main")

    log.info(f"Gateway starting — mode={args.mode} scenario={args.scenario}")
    log.info(f"Backend URL: {config['backend']['url']}")

    sender = HttpSender(
        backend_url=config["backend"]["url"],
        api_token=config["backend"]["api_token"],
        timeout=config["backend"].get("timeout_seconds", 10),
        retry_attempts=config["backend"].get("retry_attempts", 3),
        retry_delay=config["backend"].get("retry_delay_seconds", 5),
    )

    if args.mode == "simulator":
        sim = Simulator(
            gateway_id=config["gateway"]["id"],
            scenario=args.scenario,
            interval_seconds=config["simulator"].get("interval_seconds", 60),
        )
        log.info(f"Simulator mode aktif. Skenario: {args.scenario}")
        log.info("Tekan Ctrl+C untuk berhenti.")

        try:
            while True:
                payload = sim.generate_payload()
                log.info(f"[SIM] S1={payload['readings'][0]['temperature']:.1f}°C/{payload['readings'][0]['humidity']:.1f}% "
                         f"S2={payload['readings'][1]['temperature']:.1f}°C/{payload['readings'][1]['humidity']:.1f}%")
                ok = sender.send(payload)
                if ok:
                    log.info("[SIM] Data sent OK")
                else:
                    log.warning("[SIM] Send failed — buffered locally")
                time.sleep(sim.interval_seconds)
        except KeyboardInterrupt:
            log.info("Gateway stopped.")
            sys.exit(0)


if __name__ == "__main__":
    main()
