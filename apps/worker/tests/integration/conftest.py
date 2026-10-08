"""Shared Testcontainers fixtures for worker adapter integration tests."""

from __future__ import annotations

import os
from collections.abc import Generator

import pytest
from testcontainers.core.container import DockerContainer
from testcontainers.core.waiting_utils import wait_for_logs
from testcontainers.postgres import PostgresContainer


@pytest.fixture(scope="session")
def postgres_url() -> Generator[str, None, None]:
    """Postgres 18.6 (same image as production Compose)."""
    with PostgresContainer(
        "postgres:18.6-alpine@sha256:77f585114c32fbca283dc835b0596f4e52b51b4c6662d7810b2f4084f60a1873"
    ) as postgres:
        url = postgres.get_connection_url()
        os.environ["DATABASE_URL"] = url
        yield url


@pytest.fixture(scope="session")
def valkey_url() -> Generator[str, None, None]:
    """Valkey 8 for Redis-protocol clients."""
    with DockerContainer(
        "valkey/valkey:8-alpine@sha256:081c2f5cb575efc901aa80ff9cdbd1ec6a301682fd35e1ebb4b0990a4a4a8507"
    ).with_exposed_ports(6379) as container:
        wait_for_logs(container, "Ready to accept connections", timeout=60)
        host = container.get_container_host_ip()
        port = int(container.get_exposed_port(6379))
        url = f"redis://{host}:{port}"
        os.environ["VALKEY_URL"] = url
        yield url


@pytest.fixture(scope="session")
def mailpit_smtp_url() -> Generator[str, None, None]:
    """Mailpit SMTP endpoint."""
    with DockerContainer(
        "axllent/mailpit:v1.31.4@sha256:b68349e3a014b90c5610bfb26b2ae36f3892d7b8cf25ee140c6c71c98d2fcf48"
    ).with_exposed_ports(1025) as container:
        wait_for_logs(container, "accessible via", timeout=60)
        host = container.get_container_host_ip()
        port = int(container.get_exposed_port(1025))
        url = f"smtp://{host}:{port}"
        os.environ["SMTP_URL"] = url
        yield url
