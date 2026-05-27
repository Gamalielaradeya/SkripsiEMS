"""
Config Manager — baca dan tulis config.yaml
"""

import yaml
import copy
from pathlib import Path

CONFIG_PATH = Path(__file__).parent.parent / "config.yaml"

_default: dict = {}


def load_config() -> dict:
    global _default
    if not CONFIG_PATH.exists():
        raise FileNotFoundError(f"config.yaml tidak ditemukan di {CONFIG_PATH}")
    with open(CONFIG_PATH, "r") as f:
        _default = yaml.safe_load(f)
    return copy.deepcopy(_default)


def save_config(cfg: dict) -> None:
    with open(CONFIG_PATH, "w") as f:
        yaml.dump(cfg, f, allow_unicode=True, default_flow_style=False)


def get_config() -> dict:
    """Ambil config terbaru dari disk (selalu fresh)."""
    return load_config()
