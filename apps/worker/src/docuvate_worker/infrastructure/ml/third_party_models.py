# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

"""Third-party ML model manifest load and CI enforcement helpers."""

from __future__ import annotations

import ast
import json
import re
from pathlib import Path
from typing import Literal

from pydantic import BaseModel, Field

_HF_MODEL_ID = re.compile(r"^[\w.-]+/[\w.-]+$")


def _is_huggingface_model_id(token: str) -> bool:
    if token.startswith(".") or ".js" in token or token.count("/") != 1:
        return False
    org, _name = token.split("/", 1)
    if org.lower() in _NON_HF_FIRST_SEGMENT:
        return False
    return _HF_MODEL_ID.match(token) is not None
_OLLAMA_TAG = re.compile(r"^[\w.+-]+:[\w.+-]+$")
_NON_HF_FIRST_SEGMENT = frozenset(
    {
        "application",
        "image",
        "text",
        "multipart",
        "audio",
        "video",
        "health",
        "auth",
        "connectors",
        "recommendation-blocklist",
        "models",
        "retrain",
        "sftp-ingress",
        "better-auth",
    }
)
_PADDLE_BUNDLE = re.compile(r"^paddleocr:[\w.-]+$")
_DOCLING_KEY = re.compile(r"^docling:[\w.-]+$")
_TESSERACT_KEY = re.compile(r"^tesseract:[\w+]+$")
_YAML_MODEL_KEY = re.compile(
    r"^\s*(?:DOCUVATE_RERANKER_MODEL|OLLAMA_MODEL)\s*:\s*['\"]?([^'\"#\n]+)"
)


class ManifestPolicy(BaseModel):
    forbidden_training_datasets: list[str]
    forbidden_load_key_substrings: list[str]
    forbidden_substring_exceptions: list[str] = Field(default_factory=list)


class ManifestModelEntry(BaseModel):
    id: str
    display_name: str
    load_keys: list[str]
    source: str
    revision: str
    content_sha256: str | None
    license_spdx: str
    size_bytes_approx: int
    purpose: str
    shipped_in_default_cpu_image: bool
    training_data_summary: str
    allow_forbidden_substrings: bool = False


class ManifestScanConfig(BaseModel):
    python_globs: list[str]
    typescript_paths: list[str]
    yaml_paths: list[str]
    exclude_path_substrings: list[str]


class ThirdPartyModelsManifest(BaseModel):
    version: Literal[1]
    policy: ManifestPolicy
    models: list[ManifestModelEntry]
    scan: ManifestScanConfig


def repo_root_from_here() -> Path:
    """Resolve monorepo root from this module (apps/worker/src/...)."""
    return Path(__file__).resolve().parents[6]


def default_manifest_path(root: Path | None = None) -> Path:
    base = root if root is not None else repo_root_from_here()
    return base / "third-party-models.manifest.json"


def load_manifest(path: Path) -> ThirdPartyModelsManifest:
    raw = json.loads(path.read_text(encoding="utf-8"))
    return ThirdPartyModelsManifest.model_validate(raw)


def allowed_load_keys(manifest: ThirdPartyModelsManifest) -> frozenset[str]:
    keys: set[str] = set()
    for entry in manifest.models:
        keys.update(entry.load_keys)
    return frozenset(keys)


def _path_excluded(rel_posix: str, manifest: ThirdPartyModelsManifest) -> bool:
    return any(part in rel_posix for part in manifest.scan.exclude_path_substrings)


def _is_model_load_key(token: str) -> bool:
    cleaned = token.strip().strip("'\"")
    if not cleaned or cleaned.startswith("http"):
        return False
    if _is_huggingface_model_id(cleaned):
        return True
    if _OLLAMA_TAG.match(cleaned):
        return True
    if _PADDLE_BUNDLE.match(cleaned):
        return True
    if _DOCLING_KEY.match(cleaned):
        return True
    return bool(_TESSERACT_KEY.match(cleaned))


def _collect_python_strings(path: Path) -> set[str]:
    tree = ast.parse(path.read_text(encoding="utf-8"), filename=str(path))
    found: set[str] = set()
    for node in ast.walk(tree):
        if (
            isinstance(node, ast.Constant)
            and isinstance(node.value, str)
            and _is_model_load_key(node.value)
        ):
            found.add(node.value.strip())
    return found


def _collect_typescript_strings(path: Path) -> set[str]:
    found: set[str] = set()
    text = path.read_text(encoding="utf-8")
    for match in re.finditer(r"['\"]([\w.-]+/[\w.-]+)['\"]", text):
        candidate = match.group(1)
        if _is_huggingface_model_id(candidate):
            found.add(candidate)
    for match in re.finditer(r"['\"]([\w.+-]+:[\w.+-]+)['\"]", text):
        candidate = match.group(1)
        if _OLLAMA_TAG.match(candidate):
            found.add(candidate)
    return found


def _collect_yaml_keys(path: Path) -> set[str]:
    found: set[str] = set()
    for line in path.read_text(encoding="utf-8").splitlines():
        match = _YAML_MODEL_KEY.match(line)
        if match is None:
            continue
        candidate = match.group(1).strip()
        if _is_model_load_key(candidate):
            found.add(candidate)
    return found


def _expand_globs(root: Path, patterns: list[str]) -> list[Path]:
    paths: list[Path] = []
    for pattern in patterns:
        paths.extend(root.glob(pattern))
    return sorted({p.resolve() for p in paths})


def collect_referenced_load_keys(
    root: Path, manifest: ThirdPartyModelsManifest
) -> dict[str, set[str]]:
    by_file: dict[str, set[str]] = {}
    for path in _expand_globs(root, manifest.scan.python_globs):
        rel = path.relative_to(root).as_posix()
        if _path_excluded(rel, manifest):
            continue
        keys = _collect_python_strings(path)
        if keys:
            by_file[rel] = keys
    for rel_ts in manifest.scan.typescript_paths:
        path = root / rel_ts
        if not path.is_file():
            continue
        keys = _collect_typescript_strings(path)
        if keys:
            by_file[rel_ts] = keys
    for rel_yaml in manifest.scan.yaml_paths:
        path = root / rel_yaml
        if not path.is_file():
            continue
        keys = _collect_yaml_keys(path)
        if keys:
            by_file[rel_yaml] = keys
    return by_file


def _entry_for_load_key(
    key: str, manifest: ThirdPartyModelsManifest
) -> ManifestModelEntry | None:
    for entry in manifest.models:
        if key in entry.load_keys:
            return entry
    return None


def _forbidden_substring_violations(
    key: str, manifest: ThirdPartyModelsManifest
) -> list[str]:
    entry = _entry_for_load_key(key, manifest)
    if entry is not None and entry.allow_forbidden_substrings:
        return []
    lowered = key.lower()
    if any(exc in lowered for exc in manifest.policy.forbidden_substring_exceptions):
        return []
    errors: list[str] = []
    for forbidden in manifest.policy.forbidden_load_key_substrings:
        if forbidden.lower() in lowered:
            errors.append(f"load key {key!r} matches forbidden substring {forbidden!r}")
    return errors


def verify_third_party_models(root: Path, manifest_path: Path | None = None) -> list[str]:
    """Return human-readable errors; empty list means the tree matches the manifest."""
    manifest_file = manifest_path if manifest_path is not None else default_manifest_path(root)
    manifest = load_manifest(manifest_file)
    allowed = allowed_load_keys(manifest)
    referenced = collect_referenced_load_keys(root, manifest)
    errors: list[str] = []

    seen_keys: set[str] = set()
    for rel_path, keys in sorted(referenced.items()):
        for key in sorted(keys):
            seen_keys.add(key)
            if key not in allowed:
                errors.append(f"{rel_path}: unlisted model load key {key!r}")
            errors.extend(
                f"{rel_path}: {msg}" for msg in _forbidden_substring_violations(key, manifest)
            )

    for entry in manifest.models:
        if not entry.shipped_in_default_cpu_image:
            continue
        if any(key in seen_keys for key in entry.load_keys):
            continue
        if entry.id in {"docling-layout-optional", "tesseract-ocr-optional"}:
            continue
        errors.append(
            f"manifest entry {entry.id!r} is marked shipped_in_default_cpu_image "
            f"but no load key from {entry.load_keys!r} was found in scan paths"
        )

    return errors


def main() -> None:
    root = repo_root_from_here()
    errors = verify_third_party_models(root)
    if errors:
        for line in errors:
            print(line)
        raise SystemExit(1)
    model_count = len(load_manifest(default_manifest_path(root)).models)
    print(f"third-party model manifest OK ({model_count} models)")


if __name__ == "__main__":
    main()
