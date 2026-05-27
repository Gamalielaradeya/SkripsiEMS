"""
EMS Gateway Web App
FastAPI + Jinja2 + HTMX — akses dari laptop via http://<rpi-ip>:8765

Jalankan:
  python -m uvicorn main:app --host 0.0.0.0 --port 8765 --reload
"""

import asyncio
import logging
import socket
from datetime import datetime, timezone
from pathlib import Path

from fastapi import FastAPI, Form, Request
from fastapi.responses import HTMLResponse, RedirectResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

from config_manager import get_config, save_config
from ems_sender import EMSSender
from modbus_reader import ModbusReader
from poller import poller_state, start_poller, stop_poller
from serial_scanner import scan_ports
import local_db
import network_manager as nm

# ── Setup ──────────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(name)s] %(levelname)s: %(message)s"
)
log = logging.getLogger("gateway.app")

BASE_DIR    = Path(__file__).parent
STATIC_DIR  = BASE_DIR.parent / "static"
TEMPLATES_DIR = BASE_DIR / "templates"

app = FastAPI(title="EMS Gateway", docs_url=None, redoc_url=None)
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")
templates = Jinja2Templates(directory=TEMPLATES_DIR)
templates.env.globals["enumerate"] = enumerate


# ── Startup: init local DB ─────────────────────────────────────────────────────
@app.on_event("startup")
async def on_startup():
    await local_db.init_db()


# ── Factories ──────────────────────────────────────────────────────────────────

def make_reader(cfg: dict) -> ModbusReader:
    m = cfg["modbus"]
    return ModbusReader(
        port=m["port"], baudrate=m["baudrate"], bytesize=m["bytesize"],
        parity=m["parity"], stopbits=m["stopbits"], timeout=m["timeout"],
    )

def make_sender(cfg: dict) -> EMSSender:
    e = cfg["ems_server"]
    return EMSSender(
        url=e["url"], api_token=e["api_token"],
        timeout=e.get("timeout", 10),
    )


# ── Common context ─────────────────────────────────────────────────────────────

def base_ctx(active: str):
    cfg = get_config()
    return {
        "cfg": cfg,
        "gateway_name": cfg["gateway"].get("name", "EMS Gateway"),
        "active": active,
        "poller": poller_state,
        "ports": scan_ports(),
    }


# ── Pages ──────────────────────────────────────────────────────────────────────

@app.get("/", response_class=HTMLResponse)
async def page_overview(request: Request):
    ctx = base_ctx("overview")
    ctx["request"] = request
    ctx["row_count"] = await local_db.count_rows()
    return templates.TemplateResponse("overview.html", ctx)


@app.get("/serial", response_class=HTMLResponse)
async def page_serial(request: Request, msg: str = "", msg_type: str = ""):
    ctx = base_ctx("serial")
    ctx.update({"request": request, "msg": msg, "msg_type": msg_type})
    return templates.TemplateResponse("serial.html", ctx)


@app.post("/serial")
async def save_serial(request: Request):
    form = await request.form()
    cfg  = get_config()

    cfg["modbus"]["port"]     = form.get("port", cfg["modbus"]["port"])
    cfg["modbus"]["baudrate"] = int(form.get("baudrate", 9600))
    cfg["modbus"]["bytesize"] = int(form.get("bytesize", 8))
    cfg["modbus"]["parity"]   = form.get("parity", "N")
    cfg["modbus"]["stopbits"] = int(form.get("stopbits", 1))
    cfg["modbus"]["timeout"]  = int(form.get("timeout", 3))
    cfg["polling"]["interval_seconds"] = int(form.get("interval_seconds", 60))

    for i, s in enumerate(cfg["sensors"]):
        prefix = f"sensor_{i}_"
        s["enabled"]           = form.get(f"{prefix}enabled") == "on"
        s["slave_id"]          = int(form.get(f"{prefix}slave_id",          s["slave_id"]))
        s["temp_register"]     = int(form.get(f"{prefix}temp_register",     s["temp_register"]))
        s["humidity_register"] = int(form.get(f"{prefix}humidity_register", s["humidity_register"]))
        s["temp_scale"]        = float(form.get(f"{prefix}temp_scale",      s["temp_scale"]))
        s["humidity_scale"]    = float(form.get(f"{prefix}humidity_scale",  s["humidity_scale"]))
        s["name"]              = form.get(f"{prefix}name", s["name"])

    save_config(cfg)
    return RedirectResponse(
        "/serial?msg=Konfigurasi+serial+berhasil+disimpan&msg_type=success",
        status_code=303
    )


@app.get("/test", response_class=HTMLResponse)
async def page_test(request: Request):
    ctx = base_ctx("test")
    ctx["request"] = request
    return templates.TemplateResponse("test.html", ctx)


@app.get("/settings", response_class=HTMLResponse)
async def page_settings(request: Request, msg: str = "", msg_type: str = ""):
    ctx = base_ctx("settings")
    ctx.update({"request": request, "msg": msg, "msg_type": msg_type})
    return templates.TemplateResponse("settings.html", ctx)


@app.post("/settings")
async def save_settings(request: Request):
    form = await request.form()
    cfg  = get_config()

    cfg["ems_server"]["url"]       = form.get("ems_url",         cfg["ems_server"]["url"])
    cfg["ems_server"]["api_token"] = form.get("api_token",       cfg["ems_server"]["api_token"])
    cfg["ems_server"]["timeout"]   = int(form.get("ems_timeout", 10))
    cfg["gateway"]["id"]           = form.get("gateway_id",      cfg["gateway"]["id"])
    cfg["gateway"]["name"]         = form.get("gateway_name",    cfg["gateway"]["name"])
    cfg["gateway"]["location"]     = form.get("gateway_location","")

    save_config(cfg)
    return RedirectResponse(
        "/settings?msg=Pengaturan+berhasil+disimpan&msg_type=success",
        status_code=303
    )


# ── HTMX: Status ──────────────────────────────────────────────────────────────

@app.get("/api/ems-ping", response_class=HTMLResponse)
async def api_ems_ping():
    cfg = get_config()
    ok, _ = await make_sender(cfg).ping()
    cls   = "status-online" if ok else "status-offline"
    dot   = "dot-green"     if ok else "dot-red"
    label = "EMS Online"    if ok else "EMS Offline"
    return (
        f'<span id="ems-ping" hx-get="/api/ems-ping" hx-trigger="every 30s" '
        f'hx-swap="outerHTML" class="status-badge {cls}">'
        f'<span class="dot {dot}"></span> {label}</span>'
    )


@app.get("/api/network-status", response_class=HTMLResponse)
async def api_network_status():
    try:
        socket.setdefaulttimeout(2)
        socket.socket(socket.AF_INET, socket.SOCK_STREAM).connect(("8.8.8.8", 53))
        connected = True
    except Exception:
        connected = False
    cls   = "status-online" if connected else "status-offline"
    dot   = "dot-green"     if connected else "dot-red"
    label = "Connected"     if connected else "No Network"
    return (
        f'<span id="net-status" hx-get="/api/network-status" hx-trigger="every 15s" '
        f'hx-swap="outerHTML" class="status-badge {cls}">'
        f'<span class="dot {dot}"></span> {label}</span>'
    )


@app.get("/api/ems-status", response_class=HTMLResponse)
async def api_ems_status():
    cfg = get_config()
    ok, _ = await make_sender(cfg).ping()
    cls   = "status-online"   if ok else "status-offline"
    dot   = "dot-green"       if ok else "dot-red"
    label = "Accessible"      if ok else "Unreachable"
    return (
        f'<span id="ems-status" hx-get="/api/ems-status" hx-trigger="every 15s" '
        f'hx-swap="outerHTML" class="status-badge {cls}">'
        f'<span class="dot {dot}"></span> {label}</span>'
    )


@app.get("/api/poller-status", response_class=HTMLResponse)
async def api_poller_status():
    p  = poller_state
    sc = "status-online" if p["running"] else "status-offline"
    row_count = await local_db.count_rows()
    mode_badge = (
        '<span class="status-badge" style="background:rgba(124,58,237,0.15);color:#7c3aed">📦 Gather Data</span>'
        if p["mode"] == "gather"
        else '<span class="status-badge" style="background:rgba(16,185,129,0.12);color:#059669">🚀 Forward ke EMS</span>'
    )
    return f"""
    <div id="poller-info" hx-get="/api/poller-status" hx-trigger="every 10s" hx-swap="outerHTML">
      <table class="info-table" style="margin-bottom:12px">
        <tr><td>Mode</td><td>{mode_badge}</td></tr>
        <tr><td>Status</td><td><span class="status-badge {sc}">{p['last_status']}</span></td></tr>
        <tr><td>Last Run</td><td>{p['last_run'] or '—'}</td></tr>
        <tr><td>Sent OK</td><td>{p['sent_count']}</td></tr>
        <tr><td>Skipped (EMS)</td><td>{p['skip_count']}</td></tr>
        <tr><td>Sensor Error</td><td>{p['error_count']}</td></tr>
        <tr><td>Gathered (local)</td><td>{row_count} baris</td></tr>
      </table>
    </div>
    """


@app.get("/api/live-readings", response_class=HTMLResponse)
async def api_live_readings():
    readings = poller_state.get("readings", [])
    if not readings:
        return "<p class='text-muted text-sm'>Belum ada data. Jalankan poller atau cek Serial Test.</p>"
    html = ""
    for r in readings:
        if r["ok"]:
            html += f"""
            <div class="sensor-card">
              <div class="sensor-card-id">{r['id']}</div>
              <div class="sensor-card-name">{r['name']}</div>
              <div class="sensor-card-val">{r['temperature']}<span class="sensor-card-unit"> °C</span></div>
              <div class="text-muted text-sm">Humidity: {r['humidity']}%</div>
            </div>"""
        else:
            html += f"""
            <div class="sensor-card">
              <div class="sensor-card-id">{r['id']}</div>
              <div class="sensor-card-name">{r['name']}</div>
              <div class="sensor-card-val" style="color:var(--red);font-size:14px">Error</div>
              <div class="text-muted text-sm">{r.get('error','Unknown')}</div>
            </div>"""
    return html


@app.get("/api/scan-ports", response_class=HTMLResponse)
async def api_scan_ports():
    ports   = scan_ports()
    options = "".join(
        f'<option value="{p["device"]}">{p["device"]} — {p["description"]}</option>'
        for p in ports
    )
    return options


# ── HTMX: Serial Test ─────────────────────────────────────────────────────────

@app.post("/api/test-read", response_class=HTMLResponse)
async def api_test_read(
    test_port:     str = Form(...),
    test_slave:    int = Form(...),
    test_temp_reg: int = Form(...),
    test_hum_reg:  int = Form(...),
    test_baud:     int = Form(...),
):
    reader = ModbusReader(port=test_port, baudrate=test_baud, bytesize=8,
                          parity="N", stopbits=1, timeout=3)
    r  = reader.read_sensor(
        sensor_id="TEST", name="Test Read", slave_id=test_slave,
        temp_register=test_temp_reg, humidity_register=test_hum_reg,
        temp_scale=10.0, humidity_scale=10.0,
    )
    ts = datetime.now().strftime("%H:%M:%S")
    if r.ok:
        return f"""
        <div class="alert alert-success">
          ✅ [{ts}] Slave ID {test_slave} respond<br>
          🌡️ <strong>{r.temperature}°C</strong> | 💧 <strong>{r.humidity}%RH</strong><br>
          <span class="text-sm text-muted">Raw: temp={r.raw_temp}, hum={r.raw_humidity}</span>
        </div>"""
    return f'<div class="alert alert-error">❌ [{ts}] Gagal baca Slave ID {test_slave}<br>{r.error}</div>'


@app.post("/api/scan-slaves", response_class=HTMLResponse)
async def api_scan_slaves(
    test_port:  str = Form(...),
    test_baud:  int = Form(...),
    scan_start: int = Form(...),
    scan_end:   int = Form(...),
    scan_reg:   int = Form(...),
):
    reader = ModbusReader(port=test_port, baudrate=test_baud, bytesize=8,
                          parity="N", stopbits=1, timeout=2)
    found = reader.scan_slaves(start=scan_start, end=scan_end, register=scan_reg)
    if not found:
        return '<div class="alert alert-error">❌ Tidak ada slave yang merespons.</div>'
    rows = "".join(f"<tr><td>{f['slave_id']}</td><td>{f['raw']}</td></tr>" for f in found)
    return f"""
    <div class="alert alert-success">✅ Ditemukan {len(found)} slave</div>
    <table class="sensor-table">
      <tr><th>Slave ID</th><th>Raw Reg[{scan_reg}]</th></tr>
      {rows}
    </table>"""


@app.post("/api/read-all", response_class=HTMLResponse)
async def api_read_all():
    cfg      = get_config()
    reader   = make_reader(cfg)
    readings = reader.read_all_sensors(cfg["sensors"])
    ts       = datetime.now().strftime("%H:%M:%S")
    lines    = [f'<span class="line-info">[{ts}] Read All — {len(readings)} sensor</span>']
    for r in readings:
        if r.ok:
            lines.append(
                f'<span class="line-ok">[{ts}] ✓ {r.sensor_id} (SID={r.slave_id}): '
                f'{r.temperature}°C / {r.humidity}%RH | raw T={r.raw_temp} H={r.raw_humidity}</span>'
            )
        else:
            lines.append(
                f'<span class="line-err">[{ts}] ✗ {r.sensor_id} (SID={r.slave_id}): {r.error}</span>'
            )
    return "\n".join(f"<div>{l}</div>" for l in lines)


# ── HTMX: Poller control ──────────────────────────────────────────────────────

@app.post("/api/poller/start", response_class=HTMLResponse)
async def api_poller_start():
    start_poller(get_config, make_reader, make_sender)
    await asyncio.sleep(0.5)
    return await api_poller_status()


@app.post("/api/poller/stop", response_class=HTMLResponse)
async def api_poller_stop():
    stop_poller()
    await asyncio.sleep(0.3)
    return await api_poller_status()


# ── HTMX: Gather Data mode toggle ─────────────────────────────────────────────

@app.post("/api/gather/toggle", response_class=HTMLResponse)
async def api_gather_toggle():
    cfg = get_config()
    current = cfg.get("gather_data", {}).get("enabled", False)
    cfg.setdefault("gather_data", {})["enabled"] = not current
    save_config(cfg)
    enabled = cfg["gather_data"]["enabled"]
    label   = "Mode: 📦 Gather Data (Local)" if enabled else "Mode: 🚀 Forward ke EMS"
    color   = "#7c3aed" if enabled else "#059669"
    return f"""
    <div id="gather-toggle-block">
      <div class="alert {'alert-info' if enabled else 'alert-success'}" style="margin-bottom:8px">
        {'📦 Gather Data AKTIF — data disimpan lokal, TIDAK dikirim ke EMS'
         if enabled
         else '🚀 Forward Mode AKTIF — data langsung dikirim ke EMS (fire-and-forget)'}
      </div>
      <button class="btn" style="background:{color};color:#fff"
              hx-post="/api/gather/toggle"
              hx-target="#gather-toggle-block"
              hx-swap="outerHTML">
        {'🔄 Switch ke Forward (EMS)' if enabled else '🔄 Switch ke Gather Data (Lokal)'}
      </button>
    </div>"""


# ── Gather Data: export & clear ───────────────────────────────────────────────

@app.get("/api/gather/export-csv")
async def api_gather_export():
    csv_str = await local_db.export_csv()
    filename = f"ems_gather_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
    return StreamingResponse(
        iter([csv_str]),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@app.post("/api/gather/clear", response_class=HTMLResponse)
async def api_gather_clear():
    await local_db.clear_db()
    return '<div class="alert alert-success">✅ Data lokal berhasil dihapus.</div>'


# ── App settings: test connection ─────────────────────────────────────────────

@app.post("/api/test-connection", response_class=HTMLResponse)
async def api_test_connection(ems_url: str = Form(...)):
    sender = EMSSender(url=ems_url, api_token="", timeout=5)
    ok, msg = await sender.ping()
    if ok:
        return f'<span class="alert alert-success" style="display:inline-flex;padding:4px 10px">✅ {msg}</span>'
    return f'<span class="alert alert-error" style="display:inline-flex;padding:4px 10px">❌ {msg}</span>'


# ── Network Page ──────────────────────────────────────────────────────────────

@app.get("/network", response_class=HTMLResponse)
async def page_network(request: Request, msg: str = "", msg_type: str = ""):
    ctx = base_ctx("network")
    ctx.update({"request": request, "msg": msg, "msg_type": msg_type})
    return templates.TemplateResponse("network.html", ctx)


# ── Network API: Info ─────────────────────────────────────────────────────────

@app.get("/api/network-info", response_class=HTMLResponse)
async def api_network_info():
    info = nm.get_network_info()
    rows = ""
    for iface, d in info.items():
        label = "🔌 Ethernet" if iface == "eth0" else "📶 WiFi"
        ssid_row = f"<tr><td>SSID</td><td>{d.get('ssid','—')}</td></tr>" if iface == "wlan0" else ""
        rows += f"""
        <tr><td colspan="2" style="padding:8px 14px;font-size:11px;font-weight:700;
            text-transform:uppercase;letter-spacing:.05em;color:var(--text-muted);
            background:var(--bg)">{label} ({iface})</td></tr>
        <tr><td>IP Address</td><td><code>{d['ip']}</code></td></tr>
        <tr><td>Gateway</td><td>{d['gateway']}</td></tr>
        <tr><td>Mode</td><td>{d['method']}</td></tr>
        {ssid_row}
        """
    return f"<table class='info-table'>{rows}</table>"


# ── Network API: WiFi ─────────────────────────────────────────────────────────

@app.get("/api/wifi-scan", response_class=HTMLResponse)
async def api_wifi_scan():
    networks = nm.scan_wifi()
    if not networks:
        return "<p class='text-muted text-sm'>Tidak ada WiFi terdeteksi. Klik Scan lagi.</p>"

    def signal_bars(sig: int) -> str:
        if sig >= 75: return "📶"
        if sig >= 50: return "📶"
        if sig >= 25: return "▂▄__"
        return "▂___"

    html = ""
    for n in networks:
        connected_class = "wifi-connected" if n["in_use"] else ""
        connected_badge = '<span class="status-badge status-online" style="font-size:10px">✓ Connected</span>' if n["in_use"] else ""
        lock = "🔒" if n["security"] and n["security"] != "Open" else "🔓"
        onclick = f"document.getElementById('wifi-ssid').value='{n['ssid']}'"
        html += f"""
        <div class="wifi-item {connected_class}" onclick="{onclick}" title="Klik untuk isi SSID">
          <div>
            <div class="wifi-ssid">{n['ssid']}</div>
            <div class="wifi-signal">{lock} {n['security']} · {n['signal']}%</div>
          </div>
          <div class="wifi-meta">
            {connected_badge}
            <span class="wifi-bars">{signal_bars(n['signal'])}</span>
          </div>
        </div>"""
    return html


@app.post("/api/wifi-connect", response_class=HTMLResponse)
async def api_wifi_connect(
    wifi_ssid: str = Form(...),
    wifi_pass: str = Form(""),
):
    if not wifi_ssid.strip():
        return '<div class="alert alert-error">❌ SSID tidak boleh kosong</div>'
    ok, msg = nm.connect_wifi(wifi_ssid.strip(), wifi_pass)
    cls = "alert-success" if ok else "alert-error"
    icon = "✅" if ok else "❌"
    return f'<div class="alert {cls}">{icon} {msg}</div>'


@app.post("/api/wifi-disconnect", response_class=HTMLResponse)
async def api_wifi_disconnect():
    ok, msg = nm.disconnect_wifi()
    cls = "alert-success" if ok else "alert-error"
    return f'<div class="alert {cls}">{"✅" if ok else "❌"} {msg}</div>'


# ── Network API: IP Settings ──────────────────────────────────────────────────

@app.post("/api/ip-set", response_class=HTMLResponse)
async def api_ip_set(
    ip_iface:   str = Form(...),
    mode:       str = Form(...),
    ip_addr:    str = Form(""),
    ip_prefix:  str = Form("24"),
    ip_gateway: str = Form(""),
    ip_dns:     str = Form("8.8.8.8"),
):
    if mode == "dhcp":
        ok, msg = nm.set_dhcp(ip_iface)
    else:
        if not ip_addr or not ip_gateway:
            return '<div class="alert alert-error">❌ IP Address dan Gateway wajib diisi untuk mode Static</div>'
        ok, msg = nm.set_static_ip(ip_iface, ip_addr, ip_prefix, ip_gateway, ip_dns)
    cls = "alert-success" if ok else "alert-error"
    return f'<div class="alert {cls}">{"✅" if ok else "❌"} {msg}</div>'


# ── Network API: Reboot ───────────────────────────────────────────────────────

@app.post("/api/reboot", response_class=HTMLResponse)
async def api_reboot():
    nm.reboot_system()
    return '<div class="alert alert-warning">🔄 Raspberry Pi sedang reboot... Tunggu ~30 detik lalu refresh halaman ini.</div>'


# ── Entry ──────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8765, reload=True)
