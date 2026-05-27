"""
Serial Scanner — tampilkan 4 port USB standar + port yang terdeteksi.
Pada RPi tidak ada yang tercolok pun tetap muncul di dropdown (user tinggal pilih).
"""

import glob
import sys


def scan_ports() -> list[dict]:
    """
    Return daftar port serial.
    - Di Linux/RPi: selalu tampilkan /dev/ttyUSB0-3 + /dev/ttyACM0-1
      Ditandai 'detected' kalau memang ada device-nya, 'available' kalau belum ada.
    - Di Windows: COM1-COM16
    """
    if sys.platform.startswith("linux"):
        return _scan_linux()
    elif sys.platform == "win32":
        return _scan_windows()
    return []


def _scan_linux() -> list[dict]:
    # Selalu tampilkan semua kemungkinan port USB (tidak perlu colok dulu)
    candidate_ports = (
        [f"/dev/ttyUSB{i}" for i in range(4)] +   # USB-to-RS485 adapter
        [f"/dev/ttyACM{i}" for i in range(2)]       # USB CDC (Arduino, dll)
    )

    # Port yang benar-benar terdeteksi di sistem saat ini
    try:
        import serial.tools.list_ports
        detected = {p.device: p.description for p in serial.tools.list_ports.comports()}
    except ImportError:
        detected = {dev: "Detected" for dev in glob.glob("/dev/ttyUSB*") + glob.glob("/dev/ttyACM*")}

    ports = []
    for dev in candidate_ports:
        if dev in detected:
            ports.append({
                "device": dev,
                "description": detected[dev],
                "status": "detected",   # ada device tercolok
            })
        else:
            ports.append({
                "device": dev,
                "description": "Belum tercolok",
                "status": "available",  # port ada tapi belum ada device
            })

    # Tambahkan port lain yang terdeteksi tapi di luar kandidat di atas
    for dev, desc in detected.items():
        if dev not in candidate_ports:
            ports.append({"device": dev, "description": desc, "status": "detected"})

    return ports


def _scan_windows() -> list[dict]:
    try:
        import serial.tools.list_ports
        return [
            {"device": p.device, "description": p.description or p.device, "status": "detected"}
            for p in serial.tools.list_ports.comports()
        ]
    except ImportError:
        return [
            {"device": f"COM{i}", "description": f"COM{i}", "status": "available"}
            for i in range(1, 9)
        ]
