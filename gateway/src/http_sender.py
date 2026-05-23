"""http_sender.py — Send sensor payload to backend with retry."""

import json
import logging
import os
import time
from datetime import datetime
from typing import Optional

import requests

log = logging.getLogger("gateway.http_sender")


class HttpSender:
    def __init__(
        self,
        backend_url: str,
        api_token: str,
        timeout: int = 10,
        retry_attempts: int = 3,
        retry_delay: int = 5,
    ):
        self.url = backend_url.rstrip("/") + "/api/v1/readings"
        self.headers = {
            "Authorization": f"Bearer {api_token}",
            "Content-Type": "application/json",
        }
        self.timeout = timeout
        self.retry_attempts = retry_attempts
        self.retry_delay = retry_delay
        self.buffer_dir = os.path.join(os.path.dirname(__file__), "..", "data")
        os.makedirs(self.buffer_dir, exist_ok=True)

    def send(self, payload: dict) -> bool:
        """Send payload to backend. Returns True if successful."""
        for attempt in range(1, self.retry_attempts + 1):
            try:
                resp = requests.post(
                    self.url,
                    headers=self.headers,
                    json=payload,
                    timeout=self.timeout,
                )
                if resp.status_code in (200, 201):
                    log.debug(f"Payload sent OK (attempt {attempt})")
                    return True
                else:
                    log.warning(f"Backend responded {resp.status_code}: {resp.text[:200]}")
            except requests.exceptions.RequestException as e:
                log.warning(f"Send attempt {attempt} failed: {e}")
                if attempt < self.retry_attempts:
                    time.sleep(self.retry_delay)

        # Buffer failed payload locally
        self._buffer_payload(payload)
        return False

    def _buffer_payload(self, payload: dict):
        """Save failed payload to local file buffer."""
        ts = datetime.utcnow().strftime("%Y%m%d_%H%M%S_%f")
        path = os.path.join(self.buffer_dir, f"failed_{ts}.json")
        try:
            with open(path, "w") as f:
                json.dump(payload, f)
            log.info(f"Payload buffered: {path}")
        except Exception as e:
            log.error(f"Buffer write failed: {e}")
