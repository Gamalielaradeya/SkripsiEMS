"""
inject_demo_data.py — Inject data historis demo ke backend
Kirim 200 data points dengan variasi skenario untuk demo dashboard.
Jalankan: python inject_demo_data.py
"""

import sys
import time
import math
import random
import requests
from datetime import datetime, timezone, timedelta

BACKEND_URL = "http://localhost:8080"
API_TOKEN   = "dev-token-change-in-production"
GATEWAY_ID  = "raspi-gateway-01"

HEADERS = {
    "Authorization": f"Bearer {API_TOKEN}",
    "Content-Type": "application/json",
}

def send(payload):
    try:
        r = requests.post(f"{BACKEND_URL}/api/v1/readings", json=payload, headers=HEADERS, timeout=5)
        return r.status_code in (200, 201)
    except Exception as e:
        print(f"[ERROR] {e}")
        return False

def gen_reading(t: int, scenario: str, recorded_at: datetime) -> dict:
    """Generate one reading. t = tick index."""
    noise   = lambda s: random.gauss(0, s)
    drift   = lambda a: a * math.sin(t * 0.08)

    if scenario == "normal":
        s1_temp = 25.5 + drift(1.5) + noise(0.3)
        s1_hum  = 63.0 + drift(4.0) + noise(1.5)
        s2_temp = 27.5 + drift(2.0) + noise(0.4)
        s2_hum  = 57.0 + drift(5.0) + noise(1.5)
    elif scenario == "warming":
        s1_temp = 26.5 + drift(1.0) + noise(0.3)
        s1_hum  = 61.0 + drift(3.0) + noise(1.0)
        s2_temp = 29.5 + drift(0.5) + noise(0.3) + t * 0.01
        s2_hum  = 54.0 + drift(3.0) + noise(1.0)
    elif scenario == "waspada":
        s1_temp = 27.0 + drift(1.0) + noise(0.3)
        s1_hum  = 60.0 + drift(3.0) + noise(1.0)
        s2_temp = 31.0 + drift(1.0) + noise(0.5)
        s2_hum  = 52.0 + drift(4.0) + noise(1.0)
    elif scenario == "anomali":
        s1_temp = 28.0 + drift(0.5) + noise(0.3)
        s1_hum  = 58.0 + drift(2.0) + noise(1.0)
        s2_temp = 33.5 + drift(1.5) + noise(0.6)
        s2_hum  = 48.0 + drift(4.0) + noise(1.5)
    else:
        s1_temp, s1_hum, s2_temp, s2_hum = 25.0, 63.0, 27.0, 57.0

    return {
        "gateway_id": GATEWAY_ID,
        "recorded_at": recorded_at.isoformat(),
        "source": "simulator",
        "readings": [
            {"sensor_code": "S1", "sensor_role": "ambient",
             "temperature": round(s1_temp, 2), "humidity": round(max(0, min(100, s1_hum)), 2)},
            {"sensor_code": "S2", "sensor_role": "hotspot",
             "temperature": round(s2_temp, 2), "humidity": round(max(0, min(100, s2_hum)), 2)},
        ]
    }


def main():
    print("=== EMS Demo Data Injector ===")
    print("Mengirim 300 data historis (simulasi 5 jam terakhir)...")

    # Skenario: 5 jam data, campuran skenario
    # 0-100: normal, 100-160: warming, 160-220: waspada, 220-260: anomali, 260-300: recovery normal
    total_points = 300
    start_time   = datetime.now(timezone.utc) - timedelta(minutes=total_points)
    success = 0

    for i in range(total_points):
        if i < 100:
            scenario = "normal"
        elif i < 160:
            scenario = "warming"
        elif i < 220:
            scenario = "waspada"
        elif i < 260:
            scenario = "anomali"
        else:
            scenario = "normal"

        recorded_at = start_time + timedelta(minutes=i)
        payload = gen_reading(i, scenario, recorded_at)

        ok = send(payload)
        if ok:
            success += 1
            if i % 30 == 0:
                s2 = payload["readings"][1]["temperature"]
                print(f"  [{i+1}/{total_points}] {scenario.upper():8s} | S2={s2:.1f}C | {recorded_at.strftime('%H:%M')}")
        else:
            print(f"  [{i+1}] FAILED")

        time.sleep(0.05)  # 50ms delay to avoid hammering backend

    print(f"\n✅ Selesai! {success}/{total_points} data berhasil dikirim.")
    print("Refresh dashboard untuk melihat grafik historis 5 jam.")


if __name__ == "__main__":
    main()
