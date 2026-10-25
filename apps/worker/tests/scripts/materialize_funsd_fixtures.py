#!/usr/bin/env python3
# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

"""Materialize FUNSD evaluation pages into a local cache (evaluation-only; not for training).

FUNSD images are research/non-commercial — do not commit them to the public CE repo.
The committed manifest under fixtures/ocr_eval/funsd/ holds baseline metrics only.
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

import urllib.request

HF_ROWS = (
    "https://datasets-server.huggingface.co/rows?"
    "dataset=nielsr%2Ffunsd&config=default&split=train&offset={offset}&length=1"
)
DEFAULT_CACHE = Path(__file__).resolve().parents[1] / ".cache" / "funsd_ocr_eval"
PAGE_COUNT = 5


def _fetch_row(offset: int) -> dict[str, object]:
    with urllib.request.urlopen(HF_ROWS.format(offset=offset), timeout=60) as response:
        payload = json.loads(response.read().decode("utf-8"))
    rows = payload.get("rows")
    if not isinstance(rows, list) or not rows:
        msg = f"no FUNSD row at offset {offset}"
        raise RuntimeError(msg)
    row = rows[0].get("row")
    if not isinstance(row, dict):
        msg = "unexpected FUNSD row shape"
        raise RuntimeError(msg)
    return row


def _download_image(image_field: object, dest: Path) -> None:
    if not isinstance(image_field, dict):
        msg = "FUNSD image field missing"
        raise RuntimeError(msg)
    src = image_field.get("src")
    if not isinstance(src, str):
        msg = "FUNSD image src missing"
        raise RuntimeError(msg)
    with urllib.request.urlopen(src, timeout=120) as response:
        dest.write_bytes(response.read())


def materialize(cache_dir: Path) -> None:
    cache_dir.mkdir(parents=True, exist_ok=True)
    manifest: list[dict[str, object]] = []
    for offset in range(PAGE_COUNT):
        row = _fetch_row(offset)
        page_id = str(row.get("id") or offset)
        words_raw = row.get("words")
        if not isinstance(words_raw, list):
            msg = f"FUNSD words missing for page {page_id}"
            raise RuntimeError(msg)
        words = [str(word) for word in words_raw]
        reference = " ".join(words)
        image_path = cache_dir / f"{page_id}.jpg"
        _download_image(row.get("image"), image_path)
        manifest.append(
            {
                "page_id": page_id,
                "image": image_path.name,
                "reference": reference,
            }
        )
    payload = {
        "source": "nielsr/funsd train split (eval only)",
        "pages": manifest,
    }
    (cache_dir / "manifest.json").write_text(json.dumps(payload, indent=2), encoding="utf-8")


def main() -> int:
    parser = argparse.ArgumentParser(description="Download FUNSD OCR eval pages into a cache dir")
    parser.add_argument(
        "--cache-dir",
        type=Path,
        default=DEFAULT_CACHE,
        help="Directory for JPGs and cache manifest.json (default: tests/.cache/funsd_ocr_eval)",
    )
    args = parser.parse_args()
    materialize(args.cache_dir.resolve())
    print(f"Wrote {PAGE_COUNT} FUNSD pages to {args.cache_dir}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
