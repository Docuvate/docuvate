# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

from __future__ import annotations

import json
from pathlib import Path

from docuvate_worker.infrastructure.ml.third_party_models import (
    allowed_load_keys,
    default_manifest_path,
    load_manifest,
    repo_root_from_here,
    verify_third_party_models,
)


def test_manifest_parses() -> None:
    manifest = load_manifest(default_manifest_path())
    assert manifest.version == 1
    assert len(manifest.models) >= 5


def test_production_tree_matches_manifest() -> None:
    root = repo_root_from_here()
    errors = verify_third_party_models(root)
    assert errors == [], "\n".join(errors)


def test_unlisted_model_reference_is_detected(tmp_path: Path) -> None:
    root = tmp_path / "repo"
    worker_src = root / "apps/worker/src/docuvate_worker/infrastructure"
    worker_src.mkdir(parents=True)
    (worker_src / "rogue_loader.py").write_text(
        'MODEL = "evil-corp/secret-model-not-in-manifest"\n',
        encoding="utf-8",
    )
    manifest_src = default_manifest_path(repo_root_from_here())
    manifest = json.loads(manifest_src.read_text(encoding="utf-8"))
    manifest["scan"]["python_globs"] = ["apps/worker/src/docuvate_worker/**/*.py"]
    manifest["scan"]["typescript_paths"] = []
    manifest["scan"]["yaml_paths"] = []
    for entry in manifest["models"]:
        entry["shipped_in_default_cpu_image"] = False
    (root / "third-party-models.manifest.json").write_text(
        json.dumps(manifest), encoding="utf-8"
    )
    errors = verify_third_party_models(root, root / "third-party-models.manifest.json")
    assert any("unlisted model load key" in err for err in errors)


def test_allowed_keys_cover_defaults() -> None:
    manifest = load_manifest(default_manifest_path())
    allowed = allowed_load_keys(manifest)
    assert "intfloat/multilingual-e5-small" in allowed
    assert "BAAI/bge-reranker-v2-m3-int8" in allowed
    assert "qwen2.5:3b" in allowed
