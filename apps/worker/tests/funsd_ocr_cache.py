# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

"""FUNSD OCR eval cache (images + references; not committed — research license)."""

from __future__ import annotations

import json
import os
import subprocess
import sys
from pathlib import Path

_COMMITTED_MANIFEST = (
    Path(__file__).resolve().parent / "fixtures" / "ocr_eval" / "funsd" / "manifest.json"
)
_MATERIALIZE = Path(__file__).resolve().parent / "scripts" / "materialize_funsd_fixtures.py"


def funsd_cache_dir() -> Path:
    raw = os.environ.get("DOCUVATE_FUNSD_OCR_CACHE", "").strip()
    if raw:
        return Path(raw).expanduser()
    return Path(__file__).resolve().parent / ".cache" / "funsd_ocr_eval"


def funsd_cache_manifest_path() -> Path:
    return funsd_cache_dir() / "manifest.json"


def funsd_cache_ready() -> bool:
    manifest_path = funsd_cache_manifest_path()
    if not manifest_path.is_file():
        return False
    try:
        payload = json.loads(manifest_path.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return False
    pages = payload.get("pages")
    if not isinstance(pages, list) or not pages:
        return False
    cache_dir = funsd_cache_dir()
    for entry in pages:
        if not isinstance(entry, dict):
            return False
        image_name = str(entry.get("image") or "")
        reference = str(entry.get("reference") or "")
        if not image_name or not reference:
            return False
        if not (cache_dir / image_name).is_file():
            return False
    return True


def materialize_funsd_cache() -> bool:
    """Populate cache from HuggingFace. Returns True on success."""
    cache_dir = funsd_cache_dir()
    cache_dir.mkdir(parents=True, exist_ok=True)
    proc = subprocess.run(
        [
            sys.executable,
            str(_MATERIALIZE),
            "--cache-dir",
            str(cache_dir),
        ],
        check=False,
        capture_output=True,
        text=True,
    )
    if proc.returncode != 0:
        return False
    return funsd_cache_ready()


def committed_baseline_mean_cer() -> float | None:
    if not _COMMITTED_MANIFEST.is_file():
        return None
    payload = json.loads(_COMMITTED_MANIFEST.read_text(encoding="utf-8"))
    raw = payload.get("baseline_mean_cer")
    if isinstance(raw, (int, float)):
        return float(raw)
    return None


def load_funsd_eval_pages() -> list[dict[str, str]] | None:
    """Return page dicts with image_path and reference, or None if unavailable."""
    if not funsd_cache_ready() and not materialize_funsd_cache():
        return None
    payload = json.loads(funsd_cache_manifest_path().read_text(encoding="utf-8"))
    pages = payload.get("pages")
    if not isinstance(pages, list):
        return None
    cache_dir = funsd_cache_dir()
    out: list[dict[str, str]] = []
    for entry in pages:
        if not isinstance(entry, dict):
            continue
        image_name = str(entry.get("image") or "")
        reference = str(entry.get("reference") or "")
        image_path = cache_dir / image_name
        if image_path.is_file() and reference:
            out.append(
                {
                    "page_id": str(entry.get("page_id") or image_name),
                    "image_path": str(image_path),
                    "reference": reference,
                }
            )
    return out if out else None
