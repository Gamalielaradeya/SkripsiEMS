"""
Network Manager — WiFi scan/connect, IP static/DHCP, reboot.
Semua via nmcli (NetworkManager) yang sudah built-in di Raspberry Pi OS.
"""

import subprocess
import json
import logging
import re

log = logging.getLogger("gateway.network")


# ── WiFi ──────────────────────────────────────────────────────────────────────

def scan_wifi() -> list[dict]:
    """Scan WiFi menggunakan nmcli. Return list SSID + signal + security."""
    try:
        result = subprocess.run(
            ["nmcli", "-t", "-f", "SSID,SIGNAL,SECURITY,IN-USE", "dev", "wifi", "list", "--rescan", "yes"],
            capture_output=True, text=True, timeout=15
        )
        networks = []
        seen = set()
        for line in result.stdout.strip().splitlines():
            parts = line.split(":")
            if len(parts) < 3:
                continue
            ssid     = parts[0].strip()
            signal   = parts[1].strip()
            security = parts[2].strip() or "Open"
            in_use   = len(parts) > 3 and parts[3].strip() == "*"
            if ssid and ssid not in seen:
                seen.add(ssid)
                networks.append({
                    "ssid":     ssid,
                    "signal":   int(signal) if signal.isdigit() else 0,
                    "security": security,
                    "in_use":   in_use,
                })
        # Urutkan: connected dulu, lalu signal tertinggi
        networks.sort(key=lambda x: (not x["in_use"], -x["signal"]))
        return networks
    except Exception as e:
        log.error(f"WiFi scan error: {e}")
        return []


def connect_wifi(ssid: str, password: str) -> tuple[bool, str]:
    """Konek ke WiFi menggunakan nmcli."""
    try:
        cmd = ["nmcli", "dev", "wifi", "connect", ssid]
        if password:
            cmd += ["password", password]
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
        if result.returncode == 0:
            return True, f"Berhasil konek ke '{ssid}'"
        err = result.stderr.strip() or result.stdout.strip()
        return False, f"Gagal: {err}"
    except subprocess.TimeoutExpired:
        return False, "Timeout — pastikan SSID dan password benar"
    except Exception as e:
        return False, str(e)


def disconnect_wifi() -> tuple[bool, str]:
    """Disconnect dari WiFi aktif."""
    try:
        result = subprocess.run(
            ["nmcli", "dev", "disconnect", "wlan0"],
            capture_output=True, text=True, timeout=10
        )
        if result.returncode == 0:
            return True, "WiFi diputus"
        return False, result.stderr.strip()
    except Exception as e:
        return False, str(e)


# ── Network Info ──────────────────────────────────────────────────────────────

def get_network_info() -> dict:
    """Ambil info IP saat ini (eth0 dan wlan0)."""
    info = {
        "eth0":  {"ip": "—", "gateway": "—", "method": "—"},
        "wlan0": {"ip": "—", "gateway": "—", "method": "—", "ssid": "—"},
    }
    try:
        result = subprocess.run(
            ["ip", "-j", "addr", "show"],
            capture_output=True, text=True, timeout=5
        )
        data = json.loads(result.stdout)
        for iface in data:
            name = iface.get("ifname", "")
            if name in ("eth0", "wlan0"):
                addrs = [
                    f"{a['local']}/{a['prefixlen']}"
                    for a in iface.get("addr_info", [])
                    if a.get("family") == "inet"
                ]
                info[name]["ip"] = addrs[0] if addrs else "—"
    except Exception:
        pass

    # Gateway
    try:
        result = subprocess.run(
            ["ip", "route", "show", "default"],
            capture_output=True, text=True, timeout=5
        )
        for line in result.stdout.splitlines():
            if "default via" in line:
                parts = line.split()
                gw    = parts[2]
                iface = parts[4] if len(parts) > 4 else ""
                if iface in info:
                    info[iface]["gateway"] = gw
    except Exception:
        pass

    # WiFi SSID
    try:
        result = subprocess.run(
            ["nmcli", "-t", "-f", "SSID", "dev", "wifi"],
            capture_output=True, text=True, timeout=5
        )
        lines = [l.strip() for l in result.stdout.splitlines() if l.strip()]
        if lines:
            info["wlan0"]["ssid"] = lines[0]
    except Exception:
        pass

    # IP method (dhcp / static)
    for iface in ("eth0", "wlan0"):
        try:
            result = subprocess.run(
                ["nmcli", "-t", "-f", "IP4.METHOD", "con", "show", iface],
                capture_output=True, text=True, timeout=5
            )
            for line in result.stdout.splitlines():
                if "IP4.METHOD" in line:
                    method = line.split(":")[-1].strip()
                    info[iface]["method"] = "DHCP" if method == "auto" else "Static"
        except Exception:
            pass

    return info


# ── IP Static / DHCP ──────────────────────────────────────────────────────────

def set_static_ip(iface: str, ip: str, prefix: str, gateway: str, dns: str) -> tuple[bool, str]:
    """
    Set IP statis pada interface (eth0 / wlan0).
    Contoh: ip=192.168.1.100, prefix=24, gateway=192.168.1.1, dns=8.8.8.8
    """
    try:
        conn_name = _get_active_connection(iface)
        if not conn_name:
            return False, f"Tidak ada koneksi aktif di {iface}"
        cmds = [
            ["nmcli", "con", "mod", conn_name, "ipv4.method", "manual"],
            ["nmcli", "con", "mod", conn_name, "ipv4.addresses", f"{ip}/{prefix}"],
            ["nmcli", "con", "mod", conn_name, "ipv4.gateway", gateway],
            ["nmcli", "con", "mod", conn_name, "ipv4.dns", dns or "8.8.8.8"],
            ["nmcli", "con", "up", conn_name],
        ]
        for cmd in cmds:
            r = subprocess.run(cmd, capture_output=True, text=True, timeout=10)
            if r.returncode != 0:
                return False, f"Gagal: {r.stderr.strip()}"
        return True, f"IP statis {ip}/{prefix} berhasil diset di {iface}"
    except Exception as e:
        return False, str(e)


def set_dhcp(iface: str) -> tuple[bool, str]:
    """Ganti interface ke DHCP."""
    try:
        conn_name = _get_active_connection(iface)
        if not conn_name:
            return False, f"Tidak ada koneksi aktif di {iface}"
        cmds = [
            ["nmcli", "con", "mod", conn_name, "ipv4.method", "auto"],
            ["nmcli", "con", "mod", conn_name, "ipv4.addresses", ""],
            ["nmcli", "con", "mod", conn_name, "ipv4.gateway", ""],
            ["nmcli", "con", "mod", conn_name, "ipv4.dns", ""],
            ["nmcli", "con", "up", conn_name],
        ]
        for cmd in cmds:
            subprocess.run(cmd, capture_output=True, text=True, timeout=10)
        return True, f"{iface} diubah ke DHCP — tunggu IP baru dari router"
    except Exception as e:
        return False, str(e)


def _get_active_connection(iface: str) -> str | None:
    """Cari nama koneksi aktif untuk interface tertentu."""
    try:
        result = subprocess.run(
            ["nmcli", "-t", "-f", "NAME,DEVICE", "con", "show", "--active"],
            capture_output=True, text=True, timeout=5
        )
        for line in result.stdout.splitlines():
            parts = line.split(":")
            if len(parts) >= 2 and parts[1].strip() == iface:
                return parts[0].strip()
    except Exception:
        pass
    return None


# ── Reboot ────────────────────────────────────────────────────────────────────

def reboot_system():
    """Reboot Raspberry Pi."""
    log.warning("Reboot diminta via Web UI")
    subprocess.Popen(["sudo", "reboot"])
