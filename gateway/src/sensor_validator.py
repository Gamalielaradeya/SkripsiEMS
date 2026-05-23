"""sensor_validator.py — Validate sensor data from XY-MD02."""

import logging
from typing import Optional

log = logging.getLogger("gateway.validator")

TEMP_MIN = 0.0
TEMP_MAX = 80.0
HUM_MIN  = 0.0
HUM_MAX  = 100.0


class SensorValidator:
    def validate(self, raw: Optional[dict], sensor_code: str) -> dict:
        """Return validated sensor dict with quality_status."""
        if raw is None:
            return self._trouble(sensor_code, "no data")

        temp = raw.get("temperature")
        hum  = raw.get("humidity")

        if temp is None or hum is None:
            return self._trouble(sensor_code, "missing fields")

        if not (TEMP_MIN <= temp <= TEMP_MAX):
            return self._trouble(sensor_code, f"temp out of range: {temp}")

        if not (HUM_MIN <= hum <= HUM_MAX):
            return self._trouble(sensor_code, f"humidity out of range: {hum}")

        return {
            "sensor_code":   sensor_code,
            "temperature":   round(float(temp), 2),
            "humidity":      round(float(hum), 2),
            "quality_status": "valid",
        }

    def _trouble(self, sensor_code: str, reason: str) -> dict:
        log.warning(f"Sensor {sensor_code} trouble: {reason}")
        return {
            "sensor_code":   sensor_code,
            "temperature":   -1.0,
            "humidity":      -1.0,
            "quality_status": "trouble",
        }
