"""simulator.py — Generate sensor data for all scenarios."""

import random
import math
import time
from datetime import datetime, timezone
from typing import Dict


class Simulator:
    """
    Generates realistic sensor data for S1 (ambient) and S2 (hotspot).
    Scenarios:
        normal   → S2 ~25-29°C (aman)
        warming  → S2 ~29-30°C (mendekati batas)
        waspada  → S2 ~30-32°C (status waspada)
        anomali  → S2 ~32-36°C (status anomali)
        trouble  → Data tidak valid / sensor timeout
    """

    SCENARIOS = {
        "normal": {
            "s1_temp":  (24.0, 27.0),
            "s2_temp":  (26.0, 29.5),
            "s1_hum":   (60.0, 70.0),
            "s2_hum":   (50.0, 65.0),
        },
        "warming": {
            "s1_temp":  (25.0, 28.0),
            "s2_temp":  (29.0, 30.5),
            "s1_hum":   (58.0, 68.0),
            "s2_hum":   (48.0, 60.0),
        },
        "waspada": {
            "s1_temp":  (26.0, 28.5),
            "s2_temp":  (30.0, 32.0),
            "s1_hum":   (55.0, 66.0),
            "s2_hum":   (45.0, 60.0),
        },
        "anomali": {
            "s1_temp":  (27.0, 30.0),
            "s2_temp":  (32.1, 36.0),
            "s1_hum":   (50.0, 65.0),
            "s2_hum":   (40.0, 55.0),
        },
        "trouble": None,  # special — no valid data
    }

    def __init__(self, gateway_id: str, scenario: str = "normal", interval_seconds: int = 60):
        self.gateway_id = gateway_id
        self.scenario = scenario
        self.interval_seconds = interval_seconds
        self._tick = 0

    def _val(self, lo: float, hi: float) -> float:
        """Generate realistic value with small noise."""
        base = (lo + hi) / 2
        amplitude = (hi - lo) / 2
        noise = random.gauss(0, amplitude * 0.15)
        drift = amplitude * 0.3 * math.sin(self._tick * 0.1)
        return round(max(lo, min(hi, base + drift + noise)), 2)

    def generate_payload(self) -> dict:
        self._tick += 1
        now = datetime.now(timezone.utc).isoformat()

        if self.scenario == "trouble":
            return {
                "gateway_id": self.gateway_id,
                "recorded_at": now,
                "source": "simulator",
                "readings": [
                    {
                        "sensor_code": "S1",
                        "sensor_role": "ambient",
                        "temperature": -1.0,
                        "humidity": -1.0,
                        "quality_status": "timeout",
                    },
                    {
                        "sensor_code": "S2",
                        "sensor_role": "hotspot",
                        "temperature": -1.0,
                        "humidity": -1.0,
                        "quality_status": "timeout",
                    },
                ],
            }

        cfg = self.SCENARIOS[self.scenario]
        return {
            "gateway_id": self.gateway_id,
            "recorded_at": now,
            "source": "simulator",
            "readings": [
                {
                    "sensor_code": "S1",
                    "sensor_role": "ambient",
                    "temperature": self._val(*cfg["s1_temp"]),
                    "humidity":    self._val(*cfg["s1_hum"]),
                },
                {
                    "sensor_code": "S2",
                    "sensor_role": "hotspot",
                    "temperature": self._val(*cfg["s2_temp"]),
                    "humidity":    self._val(*cfg["s2_hum"]),
                },
            ],
        }
