#!/usr/bin/env python3
# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
"""Frozen eval v2: fresh seed/parties for final readout (never used for FN tuning)."""

from __future__ import annotations

import json
import random
from dataclasses import asdict, dataclass
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]
OUT_PATH = REPO_ROOT / "apps/worker/tests/fixtures/global_field_holdout_frozen_eval_v2.v1.json"

FROZEN_SEED = 88_442_110

PARTIES = (
    "Aurora MedTech GmbH",
    "Blaufeld Engineering AG",
    "Cedar Legal Partners KG",
    "Delta Harbor Logistics UG",
    "Eichenwald Finanz GmbH",
    "Fjord Analytics AG",
    "Granit Health Services GmbH",
    "Havelstrom IT KG",
    "Iris Compliance GmbH",
    "Jade Consulting AG",
)

STREETS = (
    "Uferweg 14",
    "Gartenstraße 6",
    "Industriepark 2",
    "Marktplatz 11",
)


@dataclass(frozen=True)
class HoldoutDoc:
    id: str
    category: str
    split: str
    text: str
    expected: dict[str, str]


def _amount(rng: random.Random) -> tuple[str, str]:
    euros = rng.randint(920, 91200)
    cents = rng.choice(["00", "50", "99"])
    raw = f"{euros:,}".replace(",", ".") + f",{cents}"
    norm = f"{euros}.{cents}"
    return raw, norm


def _date(rng: random.Random) -> tuple[str, str]:
    d = rng.randint(1, 28)
    m = rng.randint(1, 12)
    y = rng.choice([2024, 2025, 2026])
    return f"{d:02d}.{m:02d}.{y}", f"{d:02d}.{m:02d}.{y}"


def _service_invoice(rng: random.Random, index: int) -> HoldoutDoc:
    vendor = rng.choice(PARTIES)
    amount_raw, amount_norm = _amount(rng)
    date_raw, date_norm = _date(rng)
    layouts = [
        (
            f"Leistungsabrechnung {index:04d}\n"
            f"{vendor}\n"
            f"Fälliger Gesamtbetrag {amount_raw} EUR\n"
            f"Zahlbar bis {date_raw}"
        ),
        (
            f"{vendor}\n"
            f"Honorarnote Nr. {index:04d}\n"
            f"Endsumme: {amount_raw} EUR\n"
            f"Datum {date_raw}"
        ),
    ]
    text = rng.choice(layouts)
    return HoldoutDoc(
        id=f"frozen2_invoice_{index:04d}",
        category="invoice",
        split="frozen_eval_v2",
        text=text,
        expected={"vendor": vendor, "amount": amount_norm, "date": date_norm},
    )


def _letterhead_unlabeled(rng: random.Random, index: int) -> HoldoutDoc:
    vendor = rng.choice(PARTIES)
    street = rng.choice(STREETS)
    amount_raw, amount_norm = _amount(rng)
    date_raw, date_norm = _date(rng)
    text = (
        f"◆\n{vendor}\n{street}\n\n"
        f"Abrechnung {index:04d}\n"
        f"Brutto {amount_raw} EUR\n"
        f"Termin {date_raw}"
    )
    return HoldoutDoc(
        id=f"frozen2_letterhead_{index:04d}",
        category="invoice",
        split="frozen_eval_v2",
        text=text,
        expected={"vendor": vendor, "amount": amount_norm, "date": date_norm},
    )


def _footer_imprint(rng: random.Random, index: int) -> HoldoutDoc:
    vendor = rng.choice(PARTIES)
    street = rng.choice(STREETS)
    amount_raw, amount_norm = _amount(rng)
    date_raw, date_norm = _date(rng)
    text = (
        f"Statusbericht {index:04d}\n\n"
        f"Positionen laut Anhang.\n\n"
        f"Forderung {amount_raw} EUR\n"
        f"Frist {date_raw}\n\n"
        f"—\n{vendor}\n{street}"
    )
    return HoldoutDoc(
        id=f"frozen2_footer_{index:04d}",
        category="invoice",
        split="frozen_eval_v2",
        text=text,
        expected={"vendor": vendor, "amount": amount_norm, "date": date_norm},
    )


def _iban_block(rng: random.Random, index: int) -> HoldoutDoc:
    vendor = rng.choice(PARTIES)
    amount_raw, amount_norm = _amount(rng)
    date_raw, date_norm = _date(rng)
    suffix = rng.randint(1000, 9999)
    text = (
        f"Zahlungserinnerung {index:04d}\n\n"
        f"Saldo {amount_raw} EUR\n"
        f"Stichtag {date_raw}\n\n"
        f"DE12 5001 0517 0021 0489 {suffix:04d}\n"
        f"{vendor}"
    )
    return HoldoutDoc(
        id=f"frozen2_iban_{index:04d}",
        category="notice",
        split="frozen_eval_v2",
        text=text,
        expected={"vendor": vendor, "amount": amount_norm, "date": date_norm},
    )


def _purchase_order(rng: random.Random, index: int) -> HoldoutDoc:
    vendor = rng.choice(PARTIES)
    amount_raw, amount_norm = _amount(rng)
    date_raw, date_norm = _date(rng)
    text = (
        f"Bestellung PO-{index:05d}\n"
        f"Lieferant: {vendor}\n"
        f"Auftragswert {amount_raw} EUR\n"
        f"Bestellt am {date_raw}"
    )
    return HoldoutDoc(
        id=f"frozen2_po_{index:04d}",
        category="order",
        split="frozen_eval_v2",
        text=text,
        expected={"vendor": vendor, "amount": amount_norm, "date": date_norm},
    )


def generate_docs() -> list[HoldoutDoc]:
    rng = random.Random(FROZEN_SEED)
    docs: list[HoldoutDoc] = []
    for i in range(24):
        docs.append(_service_invoice(rng, i))
    for i in range(22):
        docs.append(_letterhead_unlabeled(rng, i))
    for i in range(18):
        docs.append(_footer_imprint(rng, i))
    for i in range(16):
        docs.append(_iban_block(rng, i))
    for i in range(20):
        docs.append(_purchase_order(rng, i))
    assert len(docs) >= 90  # noqa: PLR2004
    return docs


def main() -> None:
    docs = generate_docs()
    payload = {
        "version": 1,
        "frozen_seed": FROZEN_SEED,
        "doc_count": len(docs),
        "split": "frozen_eval_v2",
        "documents": [asdict(doc) for doc in docs],
    }
    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUT_PATH.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {OUT_PATH} ({len(docs)} docs, seed={FROZEN_SEED})")


if __name__ == "__main__":
    main()
