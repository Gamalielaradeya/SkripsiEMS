"""
Modbus RTU Reader — baca holding registers dari sensor XY-MD02 atau kompatibel.
Semua parameter configurable (tidak hardcode register).
"""

import logging
from dataclasses import dataclass
from typing import Optional

log = logging.getLogger("gateway.modbus")


@dataclass
class SensorReading:
    sensor_id: str
    name: str
    slave_id: int
    temperature: Optional[float]
    humidity: Optional[float]
    raw_temp: Optional[int]
    raw_humidity: Optional[int]
    ok: bool
    error: Optional[str] = None


class ModbusReader:
    def __init__(self, port: str, baudrate: int, bytesize: int,
                 parity: str, stopbits: int, timeout: int):
        self.port = port
        self.baudrate = baudrate
        self.bytesize = bytesize
        self.parity = parity
        self.stopbits = stopbits
        self.timeout = timeout
        self._client = None

    def _get_client(self):
        """Buat client baru tiap panggilan — pastikan koneksi segar."""
        from pymodbus.client import ModbusSerialClient
        client = ModbusSerialClient(
            port=self.port,
            baudrate=self.baudrate,
            bytesize=self.bytesize,
            parity=self.parity,
            stopbits=self.stopbits,
            timeout=self.timeout,
        )
        return client

    def read_sensor(
        self,
        sensor_id: str,
        name: str,
        slave_id: int,
        temp_register: int,
        humidity_register: int,
        temp_scale: float,
        humidity_scale: float,
    ) -> SensorReading:
        """Baca satu sensor dari Modbus RTU. Return SensorReading."""
        client = self._get_client()
        try:
            if not client.connect():
                return SensorReading(
                    sensor_id=sensor_id, name=name, slave_id=slave_id,
                    temperature=None, humidity=None,
                    raw_temp=None, raw_humidity=None,
                    ok=False, error=f"Gagal connect ke port {self.port}"
                )

            # Baca temperature register
            r_temp = client.read_holding_registers(
                address=temp_register, count=1, slave=slave_id
            )
            # Baca humidity register
            r_hum = client.read_holding_registers(
                address=humidity_register, count=1, slave=slave_id
            )

            if r_temp.isError() or r_hum.isError():
                err = str(r_temp) if r_temp.isError() else str(r_hum)
                return SensorReading(
                    sensor_id=sensor_id, name=name, slave_id=slave_id,
                    temperature=None, humidity=None,
                    raw_temp=None, raw_humidity=None,
                    ok=False, error=f"Modbus error: {err}"
                )

            raw_t = r_temp.registers[0]
            raw_h = r_hum.registers[0]

            # Handle nilai negatif (signed 16-bit untuk suhu di bawah 0)
            if raw_t > 32767:
                raw_t -= 65536

            temp = round(raw_t / temp_scale, 1)
            hum  = round(raw_h / humidity_scale, 1)

            log.info(f"[{sensor_id}] SID={slave_id} T={temp}°C H={hum}%")
            return SensorReading(
                sensor_id=sensor_id, name=name, slave_id=slave_id,
                temperature=temp, humidity=hum,
                raw_temp=raw_t, raw_humidity=raw_h,
                ok=True
            )

        except Exception as e:
            log.error(f"[{sensor_id}] Exception: {e}")
            return SensorReading(
                sensor_id=sensor_id, name=name, slave_id=slave_id,
                temperature=None, humidity=None,
                raw_temp=None, raw_humidity=None,
                ok=False, error=str(e)
            )
        finally:
            try:
                client.close()
            except Exception:
                pass

    def read_all_sensors(self, sensors_config: list) -> list[SensorReading]:
        """Baca semua sensor yang enabled dari config."""
        results = []
        for s in sensors_config:
            if not s.get("enabled", True):
                continue
            reading = self.read_sensor(
                sensor_id=s["id"],
                name=s.get("name", s["id"]),
                slave_id=s["slave_id"],
                temp_register=s["temp_register"],
                humidity_register=s["humidity_register"],
                temp_scale=s.get("temp_scale", 10.0),
                humidity_scale=s.get("humidity_scale", 10.0),
            )
            results.append(reading)
        return results

    def scan_slaves(self, start: int = 1, end: int = 20,
                    register: int = 1) -> list[dict]:
        """
        Scan slave ID dari start ke end.
        Return list slave yang merespons.
        """
        found = []
        client = self._get_client()
        try:
            client.connect()
            for sid in range(start, end + 1):
                try:
                    r = client.read_holding_registers(address=register, count=1, slave=sid)
                    if not r.isError():
                        found.append({"slave_id": sid, "raw": r.registers[0]})
                        log.info(f"Slave {sid} respond: {r.registers[0]}")
                except Exception:
                    pass
        finally:
            try:
                client.close()
            except Exception:
                pass
        return found
