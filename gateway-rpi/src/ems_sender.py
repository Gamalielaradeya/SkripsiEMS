"""
EMS Sender — Fire-and-Forget ke EMS Backend Go.
Kalau gagal: log error, lanjut. Tidak ada retry, tidak ada buffer.
"""

import logging
import httpx
from datetime import datetime, timezone

log = logging.getLogger("gateway.sender")


class EMSSender:
    def __init__(self, url: str, api_token: str, timeout: int = 10):
        self.url = url.rstrip("/")
        self.api_token = api_token
        self.timeout = timeout

    def build_payload(self, readings: list, gateway_id: str) -> dict:
        return {
            "gateway_id": gateway_id,
            "sent_at": datetime.now(timezone.utc).isoformat(),
            "readings": [
                {
                    "sensor_id": r.sensor_id,
                    "temperature": r.temperature,
                    "humidity": r.humidity,
                    "source": "hardware",
                }
                for r in readings if r.ok
            ]
        }

    async def send_async(self, payload: dict) -> tuple[bool, str]:
        """
        Fire-and-Forget: kirim sekali ke EMS.
        Kalau gagal (timeout/offline) → return False, lanjut polling.
        Tidak ada retry, tidak ada buffer.
        """
        endpoint = f"{self.url}/api/readings"
        headers = {
            "Content-Type": "application/json",
            "X-Gateway-Token": self.api_token,
        }
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                resp = await client.post(endpoint, json=payload, headers=headers)
                if resp.status_code in (200, 201):
                    log.info(f"✓ Sent OK → {endpoint} [{resp.status_code}]")
                    return True, f"OK ({resp.status_code})"
                else:
                    log.warning(f"✗ HTTP {resp.status_code} — skip")
                    return False, f"HTTP {resp.status_code}"
        except httpx.ConnectError:
            log.warning(f"✗ EMS offline ({self.url}) — skip, tidak disimpan")
            return False, "EMS offline"
        except httpx.TimeoutException:
            log.warning(f"✗ Timeout ({self.timeout}s) — skip")
            return False, f"Timeout"
        except Exception as e:
            log.error(f"✗ Send error: {e}")
            return False, str(e)

    async def ping(self) -> tuple[bool, str]:
        """Cek apakah EMS server bisa dihubungi."""
        try:
            async with httpx.AsyncClient(timeout=5) as client:
                resp = await client.get(f"{self.url}/health")
                return resp.status_code < 500, f"HTTP {resp.status_code}"
        except Exception as e:
            return False, str(e)
