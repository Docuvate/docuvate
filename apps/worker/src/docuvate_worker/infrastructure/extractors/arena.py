from __future__ import annotations

import random

from docuvate_worker.infrastructure.extractors.engine_availability import availability_by_id
from docuvate_worker.infrastructure.extractors.engine_catalog import ENGINE_CATALOG, engine_by_name


def list_arena_candidate_ids(mime_type: str) -> list[str]:
    available = availability_by_id()
    candidates: list[str] = []
    for meta in ENGINE_CATALOG:
        if not meta.arena_eligible:
            continue
        if not available.get(meta.id, False):
            continue
        engine = engine_by_name(meta.id)
        if engine.supports(mime_type):
            candidates.append(meta.id)
    return candidates


def pick_random_arena_engines(mime_type: str, count: int = 2) -> list[str]:
    candidates = list_arena_candidate_ids(mime_type)
    if not candidates:
        raise ValueError(
            "Keine Arena-Engines für dieses Dokument verfügbar. Worker-Abhängigkeiten prüfen."
        )
    if len(candidates) <= count:
        return list(candidates)
    return random.sample(candidates, count)
