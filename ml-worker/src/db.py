"""db.py — Database connection untuk ML Worker."""

import psycopg2
import psycopg2.extras
from config import Config


def get_connection():
    """Return psycopg2 connection."""
    cfg = Config()
    conn = psycopg2.connect(
        host=cfg.DB_HOST,
        port=cfg.DB_PORT,
        dbname=cfg.DB_NAME,
        user=cfg.DB_USER,
        password=cfg.DB_PASSWORD,
    )
    return conn


def get_dict_cursor(conn):
    return conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
