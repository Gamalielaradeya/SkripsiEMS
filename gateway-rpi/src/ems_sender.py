"""
EMS Sender — Fire-and-Forget ke EMS Backend Go.
Kalau gagal: log error, lanjut. Tidak ada retry, tidak ada buffer.
"""

import logging
import httpx
from datetime import datetime, timezone

log = logging.getLogger("gateway.sender")


class EMSSender:
    def __init__(self, url: str, api_token: str, timeout: int = 10, transport=None):
        self.url = url.rstrip("/")
        self.api_token = api_token
        self.timeout = timeout
        self.transport = transport

    def build_payload(self, readings: list, gateway_id: str) -> dict:
        return {
            "gateway_id": gateway_id,
            "recorded_at": datetime.now(timezone.utc).isoformat(),
            "source": "hardware",
            "readings": [
                {
                    "sensor_code": r.sensor_id,
                    "temperature": r.temperature if r.ok else -1.0,
                    "humidity": r.humidity if r.ok else -1.0,
                    "quality_status": "valid" if r.ok else "timeout",
                }
                for r in readings
            ]
        }

    async def send_async(self, payload: dict) -> tuple[bool, str]:
        """
        Fire-and-Forget: kirim sekali ke EMS.
        Kalau gagal (timeout/offline) → return False, lanjut polling.
        Tidak ada retry, tidak ada buffer.
        """
        endpoint = f"{self.url}/api/v1/readings"
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.api_token}",
        }
        try:
            async with httpx.AsyncClient(timeout=self.timeout, transport=self.transport) as client:
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
            async with httpx.AsyncClient(timeout=5, transport=self.transport) as client:
                resp = await client.get(f"{self.url}/api/v1/health")
                return resp.status_code < 500, f"HTTP {resp.status_code}"
        except Exception as e:
            return False, str(e)
