"""config.py — Load ML Worker environment configuration."""

import os
from dotenv import load_dotenv

load_dotenv()

PROJECT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def project_path(env_name: str, default: str) -> str:
    value = os.getenv(env_name, default)
    if os.path.isabs(value):
        return value
    return os.path.join(PROJECT_DIR, value)


class Config:
    # Database
    DB_HOST     = os.getenv("DB_HOST", "localhost")
    DB_PORT     = int(os.getenv("DB_PORT", "5432"))
    DB_NAME     = os.getenv("DB_NAME", "ems_db")
    DB_USER     = os.getenv("DB_USER", "ems_user")
    DB_PASSWORD = os.getenv("DB_PASSWORD", "ems_password")

    # Backend
    BACKEND_URL         = os.getenv("BACKEND_URL", "http://localhost:8080")
    ML_WORKER_API_TOKEN = os.getenv(
        "ML_WORKER_API_TOKEN",
        os.getenv("BACKEND_API_TOKEN", "dev-ml-worker-token-change-in-production"),
    )

    # ML Hyperparams
    WINDOW_SIZE               = int(os.getenv("WINDOW_SIZE", "30"))
    HORIZON_MINUTES           = int(os.getenv("HORIZON_MINUTES", "5"))
    SAMPLING_INTERVAL_SECONDS = int(os.getenv("SAMPLING_INTERVAL_SECONDS", "60"))
    EPOCHS                    = int(os.getenv("EPOCHS", "100"))
    BATCH_SIZE                = int(os.getenv("BATCH_SIZE", "32"))
    VALIDATION_SPLIT          = float(os.getenv("VALIDATION_SPLIT", "0.1"))
    EARLY_STOPPING_PATIENCE   = int(os.getenv("EARLY_STOPPING_PATIENCE", "10"))

    # Thresholds
    THRESHOLD_NORMAL_MAX  = float(os.getenv("THRESHOLD_NORMAL_MAX", "30.0"))
    THRESHOLD_ANOMALY_MIN = float(os.getenv("THRESHOLD_ANOMALY_MIN", "32.0"))

    # Paths
    MODEL_DIR  = project_path("MODEL_DIR", "models/")
    SCALER_DIR = project_path("SCALER_DIR", "models/")

    @property
    def DSN(self):
        return f"postgresql://{self.DB_USER}:{self.DB_PASSWORD}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"
