import random

import pytest

from docuvate_worker.infrastructure.extractors.arena import pick_random_arena_engines
from docuvate_worker.infrastructure.extractors.engine_availability import (
    clear_availability_cache,
)


@pytest.fixture(autouse=True)
def _reset_availability_cache() -> None:
    clear_availability_cache()


def test_pick_random_arena_engines_samples_two_when_more_available(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(
        "docuvate_worker.infrastructure.extractors.arena.list_arena_candidate_ids",
        lambda _mime: ["pipeline", "paddle", "pdf_native"],
    )
    monkeypatch.setattr(random, "sample", lambda pool, k: pool[:k])
    picked = pick_random_arena_engines("application/pdf", count=2)
    assert picked == ["pipeline", "paddle"]


def test_pick_random_arena_engines_returns_all_when_only_two(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(
        "docuvate_worker.infrastructure.extractors.arena.list_arena_candidate_ids",
        lambda _mime: ["pipeline", "paddle"],
    )
    picked = pick_random_arena_engines("application/pdf", count=2)
    assert picked == ["pipeline", "paddle"]
