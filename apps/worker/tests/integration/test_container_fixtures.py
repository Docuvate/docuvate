"""Smoke tests proving Testcontainers fixtures start (template for adapter integration tests)."""

from __future__ import annotations

import psycopg


def test_postgres_accepts_connections(postgres_url: str) -> None:
    # testcontainers returns SQLAlchemy-style URLs; psycopg expects postgresql://
    url = postgres_url.replace("postgresql+psycopg2://", "postgresql://", 1)
    with psycopg.connect(url) as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT 1")
            assert cur.fetchone() == (1,)


def test_valkey_fixture_exposes_url(valkey_url: str) -> None:
    assert valkey_url.startswith("redis://")


def test_mailpit_fixture_exposes_smtp(mailpit_smtp_url: str) -> None:
    assert mailpit_smtp_url.startswith("smtp://")
