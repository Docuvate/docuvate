# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

"""Offline linking eval on FUNSD / XFUND-de (evaluation only — never for training)."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
WORKER_SRC = ROOT / "apps" / "worker" / "src"
sys.path.insert(0, str(WORKER_SRC))

from docuvate_worker.infrastructure.ml.layout_kv_roles.model import (  # noqa: E402
    load_layout_kv_role_head,
)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--max-docs", type=int, default=50)
    parser.add_argument(
        "--artifact",
        type=Path,
        default=WORKER_SRC
        / "docuvate_worker/infrastructure/ml/artifacts/layout-kv-role-head.v1.json",
    )
    args = parser.parse_args()
    model = load_layout_kv_role_head(args.artifact)
    # FUNSD/XFUND loaders are intentionally not bundled (license + size). Nightly operators
    # mount corpora locally and extend this script; PR CI never trains or gates on them.
    report = {
        "status": "skipped",
        "reason": "corpus not mounted",
        "model_training_manifest": list(model.training_data_manifest),
        "max_docs": args.max_docs,
        "expected_re_f1_note": "train on CORD+synthetic only; FUNSD/XFUND-de eval ~0.46/0.55 RE",
    }
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
