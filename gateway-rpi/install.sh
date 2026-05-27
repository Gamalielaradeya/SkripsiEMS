#!/bin/bash
# install.sh — Setup EMS Gateway di Raspberry Pi
# Jalankan: chmod +x install.sh && sudo ./install.sh

set -e

echo "=========================================="
echo "  EMS Gateway — RPi Setup Script"
echo "=========================================="

# Update & install Python
sudo apt-get update -y
sudo apt-get install -y python3 python3-pip python3-venv git

# Buat virtualenv (menggunakan path direktori saat ini)
cd "$(dirname "$0")"
python3 -m venv .venv
source .venv/bin/activate

# Install dependencies
pip install --upgrade pip
pip install -r requirements.txt

# Pastikan user saat ini punya akses ke serial port
sudo usermod -a -G dialout ${SUDO_USER:-$USER}
sudo usermod -a -G tty ${SUDO_USER:-$USER}

echo ""
echo "✅ Instalasi selesai!"
echo ""
echo "Cara menjalankan:"
echo "  source .venv/bin/activate"
echo "  cd src && uvicorn main:app --host 0.0.0.0 --port 8765"
echo ""
echo "Akses dari laptop: http://<IP-Raspberry-Pi>:8765"
