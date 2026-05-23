"""config_loader.py — Load gateway config from YAML and .env"""

import os
import yaml
from dotenv import load_dotenv

load_dotenv()


def load_config(path: str = "config.yaml") -> dict:
    """Load config from YAML file, override with env vars."""
    if not os.path.exists(path):
        raise FileNotFoundError(f"Config file not found: {path}")

    with open(path, "r") as f:
        cfg = yaml.safe_load(f)

    # Override with environment variables if set
    backend_url   = os.getenv("BACKEND_URL")
    api_token     = os.getenv("GATEWAY_API_TOKEN")
    gateway_id    = os.getenv("GATEWAY_ID")

    if backend_url:
        cfg["backend"]["url"] = backend_url
    if api_token:
        cfg["backend"]["api_token"] = api_token
    if gateway_id:
        cfg["gateway"]["id"] = gateway_id

    return cfg
