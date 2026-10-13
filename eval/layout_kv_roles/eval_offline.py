# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

"""Offline linking eval on FUNSD / XFUND-de (evaluation only — never for training)."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
EVAL_DIR = ROOT / "eval"
WORKER_SRC = ROOT / "apps" / "worker" / "src"
sys.path.insert(0, str(WORKER_SRC))
sys.path.insert(0, str(EVAL_DIR))

from docuvate_worker.infrastructure.ml.layout_kv_roles.model import (  # noqa: E402
    load_layout_kv_role_head,
)
from layout_kv_roles.corpus import load_funsd_documents, load_xfund_de_documents  # noqa: E402
from layout_kv_roles.inference_eval import (  # noqa: E402
    linking_f1,
    linking_f1_oracle_roles,
    role_accuracy,
)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--max-docs", type=int, default=None, help="Limit docs per corpus")
    parser.add_argument(
        "--artifact",
        type=Path,
        default=WORKER_SRC
        / "docuvate_worker/infrastructure/ml/artifacts/layout-kv-role-head.v1.json",
    )
    args = parser.parse_args()
    model = load_layout_kv_role_head(args.artifact)
    funsd = load_funsd_documents(split="test", max_docs=args.max_docs)
    xfund = load_xfund_de_documents(split="validation", max_docs=args.max_docs)
    funsd_p, funsd_r, funsd_f1 = linking_f1(funsd, model)
    xfund_p, xfund_r, xfund_f1 = linking_f1(xfund, model)
    funsd_or_p, funsd_or_r, funsd_or_f1 = linking_f1_oracle_roles(funsd, model)
    xfund_or_p, xfund_or_r, xfund_or_f1 = linking_f1_oracle_roles(xfund, model)
    report = {
        "artifact": str(args.artifact),
        "training_manifest": list(model.training_data_manifest),
        "funsd_test": {
            "documents": len(funsd),
            "linking_precision": funsd_p,
            "linking_recall": funsd_r,
            "linking_f1": funsd_f1,
            "linking_f1_oracle_roles": funsd_or_f1,
            "linking_oracle_roles_precision": funsd_or_p,
            "linking_oracle_roles_recall": funsd_or_r,
            "role_accuracy_key_value": role_accuracy(funsd, model),
        },
        "xfund_de_validation": {
            "documents": len(xfund),
            "linking_precision": xfund_p,
            "linking_recall": xfund_r,
            "linking_f1": xfund_f1,
            "linking_f1_oracle_roles": xfund_or_f1,
            "linking_oracle_roles_precision": xfund_or_p,
            "linking_oracle_roles_recall": xfund_or_r,
            "role_accuracy_key_value": role_accuracy(xfund, model),
        },
    }
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
