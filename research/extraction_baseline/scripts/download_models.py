#!/usr/bin/env python3
# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
"""Download benchmark models into gitignored cache and print SHA-256 manifests."""

from __future__ import annotations

import hashlib
import json
import sys
from pathlib import Path

from huggingface_hub import hf_hub_download, model_info

from common import CACHE_DIR, REPO_ROOT

E5_ID = "intfloat/multilingual-e5-small"
E5_REVISION = "614241f622f53c4eeff9890bdc4f31cfecc418b3"
E5_ONNX_FILES = (
    "onnx/model_qint8_avx512_vnni.onnx",
    "onnx/tokenizer.json",
    "onnx/config.json",
)

GLINER2_ID = "fastino/gliner2-base-v1"
GLINER2_FILES = ("model.safetensors", "config.json", "tokenizer.json")

HF_HOME_CACHE = CACHE_DIR / "huggingface"


def manifest_path(path: Path) -> str:
    rel = path.resolve().relative_to(HF_HOME_CACHE.resolve())
    return "${HF_HOME}/" + rel.as_posix()


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1 << 20), b""):
            digest.update(chunk)
    return digest.hexdigest()


def download_and_hash(repo: str, revision: str | None, files: tuple[str, ...]) -> list[dict]:
    rows: list[dict] = []
    HF_HOME_CACHE.mkdir(parents=True, exist_ok=True)
    for filename in files:
        path = Path(
            hf_hub_download(
                repo,
                filename,
                revision=revision,
                cache_dir=str(HF_HOME_CACHE),
            )
        )
        rows.append(
            {
                "repo": repo,
                "revision": revision,
                "file": filename,
                "path": manifest_path(path),
                "bytes": path.stat().st_size,
                "sha256": sha256_file(path),
            }
        )
    return rows


def main() -> int:
    manifest: dict[str, object] = {"models": []}

    e5_rows = download_and_hash(E5_ID, E5_REVISION, E5_ONNX_FILES)
    manifest["models"].append(
        {
            "id": E5_ID,
            "revision": E5_REVISION,
            "license": "MIT",
            "files": e5_rows,
        }
    )

    g_info = model_info(GLINER2_ID)
    g_rev = g_info.sha
    license_spdx = (g_info.card_data or {}).get("license", "apache-2.0")
    g_rows = download_and_hash(GLINER2_ID, g_rev, GLINER2_FILES)
    manifest["models"].append(
        {
            "id": GLINER2_ID,
            "revision": g_rev,
            "license": license_spdx,
            "repo_license_url": "https://github.com/fastino-ai/GLiNER2/blob/main/LICENSE",
            "files": g_rows,
        }
    )

    out_path = REPO_ROOT / "research" / "extraction_baseline" / "results" / "model_manifest.json"
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(manifest, indent=2))
    return 0


if __name__ == "__main__":
    sys.path.insert(0, str(Path(__file__).resolve().parent))
    raise SystemExit(main())
