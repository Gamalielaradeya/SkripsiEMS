# Gateway — EMS LSTM Thermal Anomaly

Gateway Python untuk membaca sensor XY-MD02 via Modbus RS485 atau simulator.

## Setup

```bash
pip install -r requirements.txt
cp .env.example .env
cp config.example.yaml config.yaml
# Edit config.yaml sesuai kebutuhan
```

## Mode

```bash
# Simulator - skenario normal
python src/main.py --mode simulator --scenario normal

# Simulator - skenario waspada
python src/main.py --mode simulator --scenario waspada

# Simulator - skenario anomali
python src/main.py --mode simulator --scenario anomali

# Hardware - sensor fisik
python src/main.py --mode hardware
```

## Skenario Simulator

| Skenario | Suhu S2 | Suhu S1 |
|---|---|---|
| normal | ~27°C | ~25°C |
| warming | ~29°C | ~26°C |
| waspada | ~31°C | ~27°C |
| anomali | ~34°C | ~28°C |
| trouble | timeout/error | — |
