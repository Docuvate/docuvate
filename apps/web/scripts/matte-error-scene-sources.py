#!/usr/bin/env python3
# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
"""One-off matting for error scene sources (isnet-general-use). Not a runtime dependency."""

from __future__ import annotations

import sys
from pathlib import Path

from PIL import Image
from rembg import new_session, remove

SOURCE_DIR = Path(__file__).resolve().parent.parent / "assets" / "error-scenes-source"
MODEL = "birefnet-general"


def main() -> int:
    only = sys.argv[1].strip() if len(sys.argv) > 1 else None
    if only:
        jpg_path = SOURCE_DIR / f"{only}.jpg"
        if not jpg_path.is_file():
            print(f"Missing source JPEG: {jpg_path}", file=sys.stderr)
            return 1
        jpgs = [jpg_path]
    else:
        jpgs = sorted(SOURCE_DIR.glob("*.jpg"))
    if not jpgs:
        print(f"No JPEG sources in {SOURCE_DIR}", file=sys.stderr)
        return 1

    session = new_session(MODEL)
    for jpg in jpgs:
        out = jpg.with_suffix(".png")
        print(f"Matting {jpg.name} -> {out.name}")
        raw = jpg.read_bytes()
        cutout = remove(raw, session=session)
        image = Image.open(__import__("io").BytesIO(cutout)).convert("RGBA")
        image.save(out, format="PNG", optimize=True)
    print(f"Wrote {len(jpgs)} PNG cutouts to {SOURCE_DIR}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
