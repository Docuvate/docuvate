# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

from docuvate_worker.infrastructure.extract_memory.model_residency import (
    extract_keep_models_resident,
)


def test_keep_models_defaults_on_child_loop(monkeypatch) -> None:
    monkeypatch.delenv("DOCUVATE_EXTRACT_KEEP_MODELS", raising=False)
    monkeypatch.setenv("DOCUVATE_EXTRACT_CHILD_LOOP", "1")
    assert extract_keep_models_resident() is True


def test_keep_models_env_override(monkeypatch) -> None:
    monkeypatch.setenv("DOCUVATE_EXTRACT_CHILD_LOOP", "1")
    monkeypatch.setenv("DOCUVATE_EXTRACT_KEEP_MODELS", "0")
    assert extract_keep_models_resident() is False
