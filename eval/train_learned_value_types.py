#!/usr/bin/env python3
# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

"""Train character n-gram value-type models on CORD (CC-BY-4.0) plus synthetic receipts."""

from __future__ import annotations

import argparse
import json
import random
import sys
from collections import defaultdict
from dataclasses import dataclass
from pathlib import Path
from typing import Final

ROOT = Path(__file__).resolve().parents[1]
WORKER_SRC = ROOT / "apps" / "worker" / "src"
if str(WORKER_SRC) not in sys.path:
    sys.path.insert(0, str(WORKER_SRC))

from docuvate_worker.infrastructure.ml.value_types.model import (  # noqa: E402
    ValueTypeArtifactPayload,
    ValueTypeCounts,
    char_ngrams,
)

DEFAULT_ORDER: Final = 4
DEFAULT_SMOOTHING: Final = 0.5

# Cluster CORD menu/field keys into shared value types (commercially clean labels only).
CORD_FIELD_TO_TYPE: dict[str, str] = {
    "sub_total": "money",
    "subtotal_price": "money",
    "service_price": "money",
    "tax_price": "money",
    "total": "money",
    "total_price": "money",
    "cashprice": "money",
    "changeprice": "money",
    "creditcardprice": "money",
    "menu_price": "money",
    "unit_price": "money",
    "discount_price": "money",
    "date": "date",
    "time": "date",
    "tel": "identifier",
    "num": "identifier",
    "menu_num": "identifier",
    "store_name": "organization",
    "company": "organization",
    "menu_nm": "free_text",
    "menu": "free_text",
    "item": "free_text",
    "addr": "address",
    "address": "address",
}


@dataclass(frozen=True)
class LabeledValue:
    text: str
    type_name: str


def _synthetic_labeled_values(seed: int) -> list[LabeledValue]:
    rng = random.Random(seed)
    out: list[LabeledValue] = []
    org_names = [
        "Acme GmbH",
        "Demo Nord GmbH",
        "Nordbeispiel Beratung GmbH",
        "Muster AG",
        "Beispiel UG",
        "Sample Ltd.",
        "Example Inc.",
    ]
    for name in org_names:
        out.append(LabeledValue(name, "organization"))
    for _ in range(40):
        out.append(LabeledValue(f"{rng.choice(org_names)} & Co. KG", "organization"))

    money_values = [
        "99,00",
        "99.00",
        "1.240,00",
        "12.500,00",
        "1240.00",
        "EUR 99,00",
        "€ 1.240,00",
        "1.240,00 EUR",
        "12.500,00 EUR",
        "0,50",
        "240,00",
    ]
    for value in money_values:
        out.append(LabeledValue(value, "money"))

    dates = [
        "01.02.2024",
        "15.03.2024",
        "31/12/2023",
        "2024-01-15",
        "07.08.24",
        "1.1.2025",
    ]
    for value in dates:
        out.append(LabeledValue(value, "date"))

    ids = ["2024-001", "INV-12345", "RE-998877", "T-001", "+49 30 1234567"]
    for value in ids:
        out.append(LabeledValue(value, "identifier"))

    addresses = [
        "Hauptstraße 1 12345 Berlin",
        "Musterweg 12 80331 München",
        "Ring 5 10115 Berlin",
    ]
    for value in addresses:
        out.append(LabeledValue(value, "address"))

    free = [
        "QUERFORMAT-FIXTURE 842x595",
        "Synthetic layout regression document with enough words to classify as born digital.",
        "Coffee Latte",
        "Table 4",
    ]
    for value in free:
        out.append(LabeledValue(value, "free_text"))
    return out


def _walk_gt_parse(obj: object, out: list[LabeledValue]) -> None:
    if isinstance(obj, dict):
        for key, value in obj.items():
            type_name = CORD_FIELD_TO_TYPE.get(str(key))
            if type_name is not None and isinstance(value, str) and value.strip():
                out.append(LabeledValue(value.strip(), type_name))
            else:
                _walk_gt_parse(value, out)
    elif isinstance(obj, list):
        for item in obj:
            _walk_gt_parse(item, out)


def _load_cord_jsonl(path: Path, max_records: int) -> list[LabeledValue]:
    if not path.is_file():
        return []
    out: list[LabeledValue] = []
    for line in path.read_text(encoding="utf-8").splitlines():
        if len(out) >= max_records:
            break
        if not line.strip():
            continue
        row = json.loads(line)
        text = str(row.get("text", "")).strip()
        type_name = str(row.get("type_name", "")).strip()
        if text and type_name:
            out.append(LabeledValue(text, type_name))
    return out


def _load_cord_parquet(path: Path, max_records: int) -> list[LabeledValue]:
    if not path.is_file():
        return []
    try:
        import pyarrow.parquet as pq  # type: ignore[import-untyped]
    except ImportError:
        return []
    table = pq.read_table(path, columns=["ground_truth"])
    out: list[LabeledValue] = []
    for index in range(table.num_rows):
        if len(out) >= max_records:
            break
        raw = table["ground_truth"][index].as_py()
        if not isinstance(raw, str):
            continue
        gt = json.loads(raw)
        if isinstance(gt, dict):
            _walk_gt_parse(gt.get("gt_parse", {}), out)
    return out


def _train_counts(
    labeled: list[LabeledValue],
    *,
    order: int,
) -> tuple[dict[str, ValueTypeCounts], int]:
    type_ngrams: dict[str, dict[str, int]] = defaultdict(lambda: defaultdict(int))
    global_ngrams: dict[str, int] = defaultdict(int)
    type_totals: dict[str, int] = defaultdict(int)

    for item in labeled:
        grams = char_ngrams(item.text, order)
        type_totals[item.type_name] += len(grams)
        for gram in grams:
            type_ngrams[item.type_name][gram] += 1
            global_ngrams[gram] += 1

    vocab_size = max(len(global_ngrams), 1)
    payload_types: dict[str, ValueTypeCounts] = {}
    for type_name, total in type_totals.items():
        payload_types[type_name] = ValueTypeCounts(
            total=total,
            ngrams=dict(type_ngrams[type_name]),
        )
    return payload_types, vocab_size


def build_artifact(
    labeled: list[LabeledValue],
    *,
    order: int,
    smoothing: float,
    version: str,
) -> ValueTypeArtifactPayload:
    types_raw, vocab_size = _train_counts(labeled, order=order)
    return ValueTypeArtifactPayload(
        version=version,
        order=order,
        smoothing=smoothing,
        types=types_raw,
        vocab_size=vocab_size,
    )


def main() -> int:
    parser = argparse.ArgumentParser(description="Train learned value-type n-gram tables")
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--order", type=int, default=DEFAULT_ORDER)
    parser.add_argument("--smoothing", type=float, default=DEFAULT_SMOOTHING)
    parser.add_argument("--cord-max", type=int, default=8000, help="Max CORD labeled values")
    parser.add_argument(
        "--cord-jsonl",
        type=Path,
        default=ROOT / "eval" / "data" / "cord_labeled_values.jsonl",
        help="CC-BY-4.0 CORD field values (committed extract)",
    )
    parser.add_argument(
        "--cord-parquet",
        type=Path,
        default=None,
        help="Optional extra CORD parquet shard (gt_parse walk)",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=ROOT / "apps" / "worker" / "models" / "value_types_v1.json",
    )
    parser.add_argument("--version-tag", default="cord-synth-v1")
    args = parser.parse_args()

    labeled = _synthetic_labeled_values(args.seed)
    labeled.extend(_load_cord_jsonl(args.cord_jsonl, args.cord_max))
    if args.cord_parquet is not None:
        labeled.extend(_load_cord_parquet(args.cord_parquet, args.cord_max))
    if not labeled:
        print("No training rows", file=sys.stderr)
        return 1

    artifact = build_artifact(
        labeled,
        order=args.order,
        smoothing=args.smoothing,
        version=args.version_tag,
    )
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(artifact, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Wrote {args.output} ({len(labeled)} labeled values, {len(artifact['types'])} types)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
