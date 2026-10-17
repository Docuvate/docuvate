#!/usr/bin/env python3
# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
"""Generate synthetic global-field holdout (300+ docs, four disjoint splits)."""

from __future__ import annotations

import json
import random
from collections import defaultdict
from dataclasses import asdict, dataclass
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]
OUT_PATH = REPO_ROOT / "apps/worker/tests/fixtures/global_field_holdout.v1.json"

SPLIT_ORDER = ("train", "threshold", "confirm", "eval")
SPLIT_FRACTIONS = (0.50, 0.15, 0.15, 0.20)

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
    "Alpen Consulting GmbH",
    "Rhein Logistik AG",
    "Baltic Data UG",
    "Südportal Consulting GmbH",
    "Zenith Systems KG",
)

STREETS = (
    "Musterstraße 12",
    "Hauptweg 4",
    "Industriering 88",
    "Am Markt 3",
    "Uferpromenade 21",
)


@dataclass(frozen=True)
class HoldoutDoc:
    id: str
    category: str
    template_family: str
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
    city = seed.choice(["Berlin", "Hamburg", "Köln", "München", "Leipzig"])
    date_raw, date_norm = _date(seed)
    layouts = [
        f"{company}\n{street}\n{plz} {city}\n\nDatum: {date_raw}\n\nSehr geehrte Damen und Herren,\nAnhang: Vertragsunterlagen.",
        f"Dokument {index:04d}\n\n{company}\n{street}, {plz} {city}\n\n{date_raw}\n\nBetreff: Projektupdate",
        f"{company}\n{street}\n{plz} {city}\n\nSchreiben vom {date_raw}\n\nMit freundlichen Grüßen",
        f"{company}\nAbteilung Zentrale\n{street}\n{plz} {city}\n\nIhr Schreiben vom {date_raw}",
    ]
    text = seed.choice(layouts)
    return HoldoutDoc(
        id=f"letter_{index:04d}",
        category="letter",
        template_family="letter",
        split="train",
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
        f"{authority}\nReference {index:05d}\n{company}\n\nHauptforderung {amount_raw} EUR\nDatum {date_raw}",
    ]
    text = seed.choice(layouts)
    return HoldoutDoc(
        id=f"tax_{index:04d}",
        category="tax_notice",
        template_family="tax_notice",
        split="train",
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
        f"Rahmenvertrag {index:04d}\n\n"
        f"Auftragnehmer: {party_a}\n"
        f"Auftraggeber: {party_b}\n\n"
        f"Vertragswert: {amount_raw} EUR\n"
        f"Unterzeichnet am {date_raw}"
    )
    return HoldoutDoc(
        id=f"contract_{index:04d}",
        category="contract",
        template_family="contract",
        split="train",
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
    ]
    text = seed.choice(layouts)
    return HoldoutDoc(
        id=f"receipt_{index:04d}",
        category="receipt",
        template_family="receipt_plain",
        split="train",
        text=text,
        expected={"vendor": company, "amount": amount_norm, "date": date_norm},
    )


def _receipt_kurzer_absender(seed: random.Random, index: int) -> HoldoutDoc:
    company = seed.choice(COMPANIES)
    amount_raw, amount_norm = _amount(seed)
    date_raw, date_norm = _date(seed)
    text = (
        f"Beleg {index:04d}\n"
        f"Kurzer Absender: {company}\n"
        f"Bruttobetrag: {amount_raw} EUR\n"
        f"Leistungsdatum {date_raw}"
    )
    return HoldoutDoc(
        id=f"receipt_kurzer_{index:04d}",
        category="receipt",
        template_family="receipt_kurzer",
        split="train",
        text=text,
        expected={"vendor": company, "amount": amount_norm, "date": date_norm},
    )


def _receipt_with_tax_breakdown(seed: random.Random, index: int) -> HoldoutDoc:
    company = seed.choice(COMPANIES)
    date_raw, date_norm = _date(seed)
    net = seed.randint(500, 40000)
    tax = round(net * 0.19, 2)
    total = round(net + tax, 2)
    net_s = f"{net:,}".replace(",", ".") + ",00"
    tax_s = f"{tax:.2f}".replace(".", ",")
    euros = int(total)
    cents = int(round((total - euros) * 100))
    total_s = f"{euros:,}".replace(",", ".") + f",{cents:02d}"
    total_norm = f"{total:.2f}"
    text = (
        f"Rechnung {index:04d}\n{company}\n\n"
        f"Zwischensumme: {net_s} EUR\n"
        f"MwSt 19%: {tax_s} EUR\n"
        f"Gesamtbetrag: {total_s} EUR\n"
        f"Fälligkeit: {date_raw}"
    )
    return HoldoutDoc(
        id=f"receipt_vat_{index:04d}",
        category="receipt",
        template_family="receipt_vat",
        split="train",
        text=text,
        expected={"vendor": company, "amount": total_norm, "date": date_norm},
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
    expected: dict[str, str] = {"date": date_norm, "vendor": insurer}
    if "Schadenhöhe" in text or "Prämie:" in text:
        expected["amount"] = amount_norm
    return HoldoutDoc(
        id=f"insurance_{index:04d}",
        category="insurance",
        template_family="insurance",
        split="train",
        text=text,
        expected=expected,
    )


def _purchase_order(seed: random.Random, index: int) -> HoldoutDoc:
    vendor = seed.choice(COMPANIES)
    amount_raw, amount_norm = _amount(seed)
    date_raw, date_norm = _date(seed)
    text = (
        f"Bestellung PO-{index:05d}\n"
        f"Lieferant: {vendor}\n"
        f"Auftragswert {amount_raw} EUR\n"
        f"Bestellt am {date_raw}"
    )
    return HoldoutDoc(
        id=f"po_{index:04d}",
        category="order",
        template_family="purchase_order",
        split="train",
        text=text,
        expected={"vendor": vendor, "amount": amount_norm, "date": date_norm},
    )


def _service_invoice(seed: random.Random, index: int) -> HoldoutDoc:
    vendor = seed.choice(COMPANIES)
    amount_raw, amount_norm = _amount(seed)
    date_raw, date_norm = _date(seed)
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
    text = seed.choice(layouts)
    return HoldoutDoc(
        id=f"svc_inv_{index:04d}",
        category="invoice",
        template_family="service_invoice",
        split="train",
        text=text,
        expected={"vendor": vendor, "amount": amount_norm, "date": date_norm},
    )


def _remittance_advice(seed: random.Random, index: int) -> HoldoutDoc:
    authority = seed.choice(["Finanzamt Mitte", "Landesamt für Steuern", "Krankenkasse Plus"])
    company = seed.choice(COMPANIES)
    amount_raw, amount_norm = _amount(seed)
    date_raw, date_norm = _date(seed)
    text = (
        f"{authority}\n"
        f"Bescheid {index:04d}\n\n"
        f"Adressat: {company}\n"
        f"Hauptforderung: {amount_raw} EUR\n"
        f"Ausgestellt {date_raw}"
    )
    return HoldoutDoc(
        id=f"remit_{index:04d}",
        category="notice",
        template_family="remittance",
        split="train",
        text=text,
        expected={"vendor": authority, "amount": amount_norm, "date": date_norm},
    )


def _policy_premium(seed: random.Random, index: int) -> HoldoutDoc:
    insurer = seed.choice(["Muster Versicherung AG", "Krankenkasse Plus"])
    amount_raw, amount_norm = _amount(seed)
    date_raw, date_norm = _date(seed)
    text = (
        f"{insurer}\n"
        f"Police {index:04d}\n\n"
        f"Versicherungsnehmer: {seed.choice(COMPANIES)}\n"
        f"Jahresprämie {amount_raw} EUR\n"
        f"Gültig ab {date_raw}"
    )
    return HoldoutDoc(
        id=f"policy_{index:04d}",
        category="insurance",
        template_family="policy_premium",
        split="train",
        text=text,
        expected={"vendor": insurer, "amount": amount_norm, "date": date_norm},
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
        id=f"negative_{index:04d}",
        category="letter",
        template_family="negative_title",
        split="train",
        text=text,
        expected={},
    )


def generate_docs() -> list[HoldoutDoc]:
    seed = random.Random(19_071_017)
    docs: list[HoldoutDoc] = []
    for i in range(60):
        docs.append(_letter(seed, i))
    for i in range(40):
        docs.append(_tax_notice(seed, i))
    for i in range(35):
        docs.append(_contract(seed, i))
    for i in range(45):
        docs.append(_receipt(seed, i))
    for i in range(35):
        docs.append(_receipt_kurzer_absender(seed, i))
    for i in range(40):
        docs.append(_receipt_with_tax_breakdown(seed, i))
    for i in range(30):
        docs.append(_insurance(seed, i))
    for i in range(35):
        docs.append(_purchase_order(seed, i))
    for i in range(30):
        docs.append(_service_invoice(seed, i))
    for i in range(25):
        docs.append(_remittance_advice(seed, i))
    for i in range(20):
        docs.append(_policy_premium(seed, i))
    for i in range(25):
        docs.append(_negative_title(seed, i))
    assert len(docs) >= 300  # noqa: PLR2004
    return docs


def _split_counts(total: int) -> list[int]:
    counts = [int(total * fraction) for fraction in SPLIT_FRACTIONS]
    while sum(counts) < total:
        counts[0] += 1
    while sum(counts) > total:
        counts[0] -= 1
    return counts


def assign_splits(docs: list[HoldoutDoc]) -> list[HoldoutDoc]:
    rng = random.Random(20261017)
    by_family: dict[str, list[HoldoutDoc]] = defaultdict(list)
    for doc in docs:
        by_family[doc.template_family].append(doc)
    out: list[HoldoutDoc] = []
    for family in sorted(by_family):
        family_docs = by_family[family]
        rng.shuffle(family_docs)
        counts = _split_counts(len(family_docs))
        cursor = 0
        for split_name, count in zip(SPLIT_ORDER, counts, strict=True):
            for doc in family_docs[cursor : cursor + count]:
                out.append(
                    HoldoutDoc(
                        id=doc.id,
                        category=doc.category,
                        template_family=doc.template_family,
                        split=split_name,
                        text=doc.text,
                        expected=doc.expected,
                    )
                )
            cursor += count
    rng.shuffle(out)
    return out


def main() -> None:
    docs = assign_splits(generate_docs())
    payload = {
        "version": 3,
        "doc_count": len(docs),
        "splits": list(SPLIT_ORDER),
        "template_families": sorted({doc.template_family for doc in docs}),
        "documents": [asdict(doc) for doc in docs],
    }
    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUT_PATH.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    counts = {name: sum(1 for doc in docs if doc.split == name) for name in SPLIT_ORDER}
    families = {name: sum(1 for doc in docs if doc.template_family == name) for name in payload["template_families"]}
    print(f"Wrote {OUT_PATH} ({len(docs)} docs, splits={counts}, families={families})")


if __name__ == "__main__":
    main()
