# Gateway Simulator - EMS Thermal Anomaly

Folder ini hanya untuk simulator CLI. Gateway sensor fisik Raspberry Pi berada di `gateway-rpi/`.

## Setup

```bash
cp .env.example .env
pip install -r requirements.txt
```

## Jalankan Skenario

```bash
python src/main.py --mode simulator --scenario normal
python src/main.py --mode simulator --scenario warming
python src/main.py --mode simulator --scenario waspada
python src/main.py --mode simulator --scenario anomali
python src/main.py --mode simulator --scenario trouble
```

Simulator mengirim payload yang sama dengan gateway RPi ke `POST /api/v1/readings` memakai Bearer Token.

## Inject Data Historis

```bash
python inject_demo_data.py
```

`inject_demo_data.py` membaca `BACKEND_URL`, `GATEWAY_API_TOKEN`, dan `GATEWAY_ID` dari environment dengan fallback development lokal.
