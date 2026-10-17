#!/usr/bin/env python3
# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
"""Generate untouched frozen eval holdout (new seed, templates not used in tuning)."""

from __future__ import annotations

import json
import random
from dataclasses import asdict, dataclass
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]
OUT_PATH = REPO_ROOT / "apps/worker/tests/fixtures/global_field_holdout_frozen_eval.v1.json"

FROZEN_SEED = 88_100_923

PARTIES = (
    "Helios Werk AG",
    "Südportal Consulting GmbH",
    "Westküste Medical UG",
    "Zenith Systems KG",
    "Polar Express Logistik AG",
    "Quellbach Steuerberatung GmbH",
    "NovaCare Versicherung AG",
    "Amt für Soziales Mitte",
)

STREETS = (
    "Seeweg 7",
    "Parkallee 22",
    "Fabrikhof 1",
    "Bahnhofsplatz 9",
)


@dataclass(frozen=True)
class HoldoutDoc:
    id: str
    category: str
    split: str
    text: str
    expected: dict[str, str]


def _amount(rng: random.Random) -> tuple[str, str]:
    euros = rng.randint(890, 87650)
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
        id=f"frozen_invoice_{index:04d}",
        category="invoice",
        split="frozen_eval",
        text=text,
        expected={"vendor": vendor, "amount": amount_norm, "date": date_norm},
    )


def _vat_block(rng: random.Random, index: int) -> HoldoutDoc:
    vendor = rng.choice(PARTIES)
    date_raw, date_norm = _date(rng)
    net = rng.randint(800, 42000)
    tax = round(net * 0.19, 2)
    total = round(net + tax, 2)
    net_s = f"{net:,}".replace(",", ".") + ",00"
    tax_s = f"{tax:.2f}".replace(".", ",")
    euros = int(total)
    cents = int(round((total - euros) * 100))
    total_s = f"{euros:,}".replace(",", ".") + f",{cents:02d}"
    total_norm = f"{total:.2f}"
    text = (
        f"Abrechnung {index:04d}\n{vendor}\n\n"
        f"Nettowert {net_s} EUR\n"
        f"USt 19%: {tax_s} EUR\n"
        f"Zu zahlen: {total_s} EUR\n"
        f"Leistungsdatum {date_raw}"
    )
    return HoldoutDoc(
        id=f"frozen_vat_{index:04d}",
        category="invoice",
        split="frozen_eval",
        text=text,
        expected={"vendor": vendor, "amount": total_norm, "date": date_norm},
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
        id=f"frozen_po_{index:04d}",
        category="order",
        split="frozen_eval",
        text=text,
        expected={"vendor": vendor, "amount": amount_norm, "date": date_norm},
    )


def _remittance_advice(rng: random.Random, index: int) -> HoldoutDoc:
    authority = rng.choice(["Amt für Soziales Mitte", "Quellbach Steuerberatung GmbH"])
    company = rng.choice(PARTIES)
    amount_raw, amount_norm = _amount(rng)
    date_raw, date_norm = _date(rng)
    text = (
        f"{authority}\n"
        f"Bescheid {index:04d}\n\n"
        f"Adressat: {company}\n"
        f"Hauptforderung: {amount_raw} EUR\n"
        f"Ausgestellt {date_raw}"
    )
    return HoldoutDoc(
        id=f"frozen_notice_{index:04d}",
        category="notice",
        split="frozen_eval",
        text=text,
        expected={"vendor": authority, "amount": amount_norm, "date": date_norm},
    )


def _policy_premium(rng: random.Random, index: int) -> HoldoutDoc:
    insurer = rng.choice(["NovaCare Versicherung AG", "Polar Express Logistik AG"])
    amount_raw, amount_norm = _amount(rng)
    date_raw, date_norm = _date(rng)
    text = (
        f"{insurer}\n"
        f"Police {index:04d}\n\n"
        f"Versicherungsnehmer: {rng.choice(PARTIES)}\n"
        f"Jahresprämie {amount_raw} EUR\n"
        f"Gültig ab {date_raw}"
    )
    return HoldoutDoc(
        id=f"frozen_policy_{index:04d}",
        category="insurance",
        split="frozen_eval",
        text=text,
        expected={"vendor": insurer, "amount": amount_norm, "date": date_norm},
    )


def _letter_only(rng: random.Random, index: int) -> HoldoutDoc:
    vendor = rng.choice(PARTIES)
    street = rng.choice(STREETS)
    date_raw, date_norm = _date(rng)
    text = (
        f"{vendor}\n{street}\n\n"
        f"Schreiben vom {date_raw}\n\n"
        f"Bitte senden Sie Unterlagen."
    )
    return HoldoutDoc(
        id=f"frozen_letter_{index:04d}",
        category="letter",
        split="frozen_eval",
        text=text,
        expected={"vendor": vendor, "date": date_norm},
    )


def generate_docs() -> list[HoldoutDoc]:
    rng = random.Random(FROZEN_SEED)
    docs: list[HoldoutDoc] = []
    for i in range(28):
        docs.append(_service_invoice(rng, i))
    for i in range(22):
        docs.append(_vat_block(rng, i))
    for i in range(18):
        docs.append(_purchase_order(rng, i))
    for i in range(12):
        docs.append(_remittance_advice(rng, i))
    for i in range(10):
        docs.append(_policy_premium(rng, i))
    for i in range(10):
        docs.append(_letter_only(rng, i))
    assert len(docs) >= 90  # noqa: PLR2004
    return docs


def main() -> None:
    docs = generate_docs()
    payload = {
        "version": 1,
        "frozen_seed": FROZEN_SEED,
        "doc_count": len(docs),
        "split": "frozen_eval",
        "documents": [asdict(doc) for doc in docs],
    }
    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUT_PATH.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {OUT_PATH} ({len(docs)} docs, seed={FROZEN_SEED})")


if __name__ == "__main__":
    main()
