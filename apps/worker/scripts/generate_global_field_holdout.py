#!/usr/bin/env python3
# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
"""Generate synthetic global-field holdout JSON (≥60 docs, multi genre)."""

from __future__ import annotations

import json
import random
from dataclasses import asdict, dataclass
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]
OUT_PATH = REPO_ROOT / "apps/worker/tests/fixtures/global_field_holdout.v1.json"

COMPANIES = (
    "Acme GmbH",
    "Demo Nord GmbH",
    "Nordbeispiel Beratung GmbH",
    "Contoso AG",
    "Fabrikam KG",
    "Muster Versicherung AG",
    "Finanzamt Mitte",
    "Landesamt für Steuern",
    "Krankenkasse Plus",
    "Tech Solutions UG",
)

STREETS = (
    "Musterstraße 12",
    "Hauptweg 4",
    "Industriering 88",
    "Am Markt 3",
)


@dataclass(frozen=True)
class HoldoutDoc:
    id: str
    category: str
    split: str
    text: str
    expected: dict[str, str]


def _amount(seed: random.Random) -> tuple[str, str]:
    euros = seed.randint(120, 98500)
    cents = seed.choice(["00", "50", "99"])
    raw = f"{euros:,}".replace(",", ".") + f",{cents}"
    norm = f"{euros}.{cents}"
    return raw, norm


def _date(seed: random.Random) -> tuple[str, str]:
    d = seed.randint(1, 28)
    m = seed.randint(1, 12)
    y = seed.choice([2023, 2024, 2025])
    return f"{d:02d}.{m:02d}.{y}", f"{d:02d}.{m:02d}.{y}"


def _letter(seed: random.Random, index: int) -> HoldoutDoc:
    company = seed.choice(COMPANIES)
    street = seed.choice(STREETS)
    plz = seed.randint(10000, 99999)
    city = seed.choice(["Berlin", "Hamburg", "Köln", "München"])
    date_raw, date_norm = _date(seed)
    layouts = [
        f"{company}\n{street}\n{plz} {city}\n\nDatum: {date_raw}\n\nSehr geehrte Damen und Herren,\nAnhang: Vertragsunterlagen.",
        f"Dokument {index:03d}\n\n{company}\n{street}, {plz} {city}\n\n{date_raw}\n\nBetreff: Projektupdate",
        f"{company}\n{street}\n{plz} {city}\n\nSchreiben vom {date_raw}\n\nMit freundlichen Grüßen",
    ]
    text = seed.choice(layouts)
    return HoldoutDoc(
        id=f"letter_{index:03d}",
        category="letter",
        split="calibration" if index < 10 else "eval",
        text=text,
        expected={"vendor": company, "date": date_norm},
    )


def _tax_notice(seed: random.Random, index: int) -> HoldoutDoc:
    authority = seed.choice(["Finanzamt Mitte", "Landesamt für Steuern"])
    company = seed.choice(COMPANIES)
    amount_raw, amount_norm = _amount(seed)
    date_raw, date_norm = _date(seed)
    layouts = [
        f"{authority}\nSteuerbescheid\n\nEmpfänger: {company}\n\nFestgesetzter Betrag: {amount_raw} EUR\n\nDatum: {date_raw}",
        f"{authority}\n\n{company}\n\nBescheid vom {date_raw}\n\nSumme: EUR {amount_raw}",
    ]
    text = seed.choice(layouts)
    return HoldoutDoc(
        id=f"tax_{index:03d}",
        category="tax_notice",
        split="calibration" if index < 9 else "eval",
        text=text,
        expected={"vendor": authority, "amount": amount_norm, "date": date_norm},
    )


def _contract(seed: random.Random, index: int) -> HoldoutDoc:
    party_a = seed.choice(COMPANIES)
    party_b = seed.choice(COMPANIES)
    while party_b == party_a:
        party_b = seed.choice(COMPANIES)
    date_raw, date_norm = _date(seed)
    amount_raw, amount_norm = _amount(seed)
    text = (
        f"Rahmenvertrag {index:03d}\n\n"
        f"Auftragnehmer: {party_a}\n"
        f"Auftraggeber: {party_b}\n\n"
        f"Vertragswert: {amount_raw} EUR\n"
        f"Unterzeichnet am {date_raw}"
    )
    return HoldoutDoc(
        id=f"contract_{index:03d}",
        category="contract",
        split="calibration" if index < 7 else "eval",
        text=text,
        expected={"vendor": party_a, "amount": amount_norm, "date": date_norm},
    )


def _receipt(seed: random.Random, index: int) -> HoldoutDoc:
    company = seed.choice(COMPANIES)
    amount_raw, amount_norm = _amount(seed)
    date_raw, date_norm = _date(seed)
    layouts = [
        (
            f"Rechnung {index:04d}\n{company}\n"
            f"Betrag: {amount_raw} EUR\nFälligkeit: {date_raw}"
        ),
        f"{company}\nRechnung\nEUR {amount_raw}\nDatum {date_raw}",
        (
            f"Beleg {index:03d}\n"
            f"Kurzer Absender: {company}\n"
            f"Bruttobetrag: {amount_raw} EUR\n"
            f"Leistungsdatum {date_raw}"
        ),
    ]
    text = seed.choice(layouts)
    return HoldoutDoc(
        id=f"receipt_{index:03d}",
        category="receipt",
        split="calibration" if index < 8 else "eval",
        text=text,
        expected={"vendor": company, "amount": amount_norm, "date": date_norm},
    )


def _insurance(seed: random.Random, index: int) -> HoldoutDoc:
    insurer = seed.choice(["Muster Versicherung AG", "Krankenkasse Plus"])
    company = seed.choice(COMPANIES)
    date_raw, date_norm = _date(seed)
    amount_raw, amount_norm = _amount(seed)
    layouts = [
        f"{insurer}\nVersicherungsschein\n\nVersicherungsnehmer: {company}\n\nPrämie: {amount_raw} EUR\nGültig ab {date_raw}",
        f"{insurer}\n\n{company}\nSchadensmeldung\nDatum {date_raw}\nSchadenhöhe EUR {amount_raw}",
    ]
    text = seed.choice(layouts)
    expected: dict[str, str] = {"date": date_norm}
    if seed.random() > 0.35:
        expected["vendor"] = insurer
    if "Schadenhöhe" in text:
        expected["amount"] = amount_norm
    return HoldoutDoc(
        id=f"insurance_{index:03d}",
        category="insurance",
        split="calibration" if index < 5 else "eval",
        text=text,
        expected=expected,
    )


def _negative_title(seed: random.Random, index: int) -> HoldoutDoc:
    text = "\n".join(
        [
            "Synthetic Nine Word Academic Title Case Example Heading",
            "Second Line Author Names Only",
            f"Footnote marker {index}",
        ]
    )
    return HoldoutDoc(
        id=f"negative_{index:03d}",
        category="letter",
        split="calibration" if index < 3 else "eval",
        text=text,
        expected={},
    )


def generate() -> list[HoldoutDoc]:
    seed = random.Random(19_071_017)
    docs: list[HoldoutDoc] = []
    for i in range(15):
        docs.append(_letter(seed, i))
    for i in range(15):
        docs.append(_tax_notice(seed, i))
    for i in range(12):
        docs.append(_contract(seed, i))
    for i in range(13):
        docs.append(_receipt(seed, i))
    for i in range(10):
        docs.append(_insurance(seed, i))
    for i in range(5):
        docs.append(_negative_title(seed, i))
    assert len(docs) >= 60  # noqa: PLR2004
    return docs


def main() -> None:
    docs = generate()
    payload = {
        "version": 1,
        "doc_count": len(docs),
        "documents": [asdict(doc) for doc in docs],
    }
    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUT_PATH.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    cal = sum(1 for doc in docs if doc.split == "calibration")
    ev = sum(1 for doc in docs if doc.split == "eval")
    print(f"Wrote {OUT_PATH} ({len(docs)} docs, cal={cal}, eval={ev})")


if __name__ == "__main__":
    main()
