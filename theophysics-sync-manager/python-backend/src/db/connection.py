import os
from typing import Optional

import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv

load_dotenv()


def get_connection():
    return psycopg2.connect(
        host=os.getenv("POSTGRES_HOST", "localhost"),
        port=int(os.getenv("POSTGRES_PORT", "5432")),
        dbname=os.getenv("POSTGRES_DB", "theophysics"),
        user=os.getenv("POSTGRES_USER", "postgres"),
        password=os.getenv("POSTGRES_PASSWORD", ""),
        cursor_factory=RealDictCursor,
    )


def fetch_one(query: str, params: Optional[tuple] = None):
    with get_connection() as conn:
        with conn.cursor() as cursor:
            cursor.execute(query, params)
            return cursor.fetchone()


def fetch_all(query: str, params: Optional[tuple] = None):
    with get_connection() as conn:
        with conn.cursor() as cursor:
            cursor.execute(query, params)
            return cursor.fetchall()


def execute(query: str, params: Optional[tuple] = None) -> None:
    with get_connection() as conn:
        with conn.cursor() as cursor:
            cursor.execute(query, params)
        conn.commit()
