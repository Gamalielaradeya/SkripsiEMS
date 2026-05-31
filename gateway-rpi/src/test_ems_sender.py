import json
import unittest
from dataclasses import dataclass

import httpx

from ems_sender import EMSSender


@dataclass
class Reading:
    sensor_id: str
    temperature: float | None
    humidity: float | None
    ok: bool


class EMSSenderTest(unittest.IsolatedAsyncioTestCase):
    def test_build_payload_matches_backend_v1_contract(self):
        sender = EMSSender("http://ems.local:8080", "secret")
        payload = sender.build_payload(
            [
                Reading("S1", 25.1, 61.2, True),
                Reading("S2", None, None, False),
            ],
            "raspi-gateway-01",
        )

        self.assertEqual(payload["gateway_id"], "raspi-gateway-01")
        self.assertEqual(payload["source"], "hardware")
        self.assertIn("recorded_at", payload)
        self.assertNotIn("sent_at", payload)
        self.assertEqual(payload["readings"][0]["sensor_code"], "S1")
        self.assertEqual(payload["readings"][0]["quality_status"], "valid")
        self.assertEqual(payload["readings"][1]["sensor_code"], "S2")
        self.assertEqual(payload["readings"][1]["quality_status"], "timeout")

    async def test_send_async_uses_v1_endpoint_and_bearer_token(self):
        async def handler(request: httpx.Request):
            self.assertEqual(request.url.path, "/api/v1/readings")
            self.assertEqual(request.headers["Authorization"], "Bearer secret")
            body = json.loads(request.content)
            self.assertEqual(body["gateway_id"], "raspi-gateway-01")
            return httpx.Response(201, json={"message": "ok"})

        sender = EMSSender(
            "http://ems.local:8080",
            "secret",
            transport=httpx.MockTransport(handler),
        )
        payload = sender.build_payload([Reading("S1", 25.1, 61.2, True)], "raspi-gateway-01")
        ok, message = await sender.send_async(payload)

        self.assertTrue(ok)
        self.assertEqual(message, "OK (201)")

    async def test_ping_uses_v1_health_endpoint(self):
        async def handler(request: httpx.Request):
            self.assertEqual(request.url.path, "/api/v1/health")
            return httpx.Response(200, json={"status": "ok"})

        sender = EMSSender(
            "http://ems.local:8080",
            "secret",
            transport=httpx.MockTransport(handler),
        )
        ok, message = await sender.ping()

        self.assertTrue(ok)
        self.assertEqual(message, "HTTP 200")


if __name__ == "__main__":
    unittest.main()
