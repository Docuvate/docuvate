#!/usr/bin/env python3
# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

"""Generate licence-clean German chat gate fixtures (seeded synthetic)."""

from __future__ import annotations

import json
import random
from pathlib import Path

from bench.model_gates.json_models import ChatCaseModel, ChatDocumentModel, ChatFieldModel, ChatFixturesFile

OUT = Path(__file__).resolve().parent / "chat_extractive_cases.json"
SEED = 20261011
TARGET_CASES = 170


def _pad_paragraph(rng: random.Random, topic: str, distractors: list[str]) -> str:
    lines = [
        f"Dokumenttyp: {topic}.",
        "Hinweis: Dieser Text ist ein synthetisches Eval-Fixture ohne personenbezogene Daten.",
    ]
    for item in distractors:
        lines.append(item)
    filler = (
        "Die nachfolgenden Absätze enthalten bewusst ähnliche Formulierungen, "
        "OCR-Artefakte und Randnotizen, um Retrieval zu erschweren. "
        "Bitte nur exakte Werte aus dem angefragten Feld verwenden."
    )
    while len("\n".join(lines)) < 820:
        lines.append(filler + f" Absatz {rng.randint(1000, 9999)}.")
    return "\n".join(lines)


def _invoice_doc(rng: random.Random, vendor: str, total: str, invoice_no: str) -> ChatDocumentModel:
    body = _pad_paragraph(
        rng,
        "Rechnung",
        [
            f"Rechnungsnummer: {invoice_no}",
            f"Lieferant: {vendor}",
            f"Gesamtsumme: {total} EUR",
            "Zwischensumme: 99,00 EUR",
            "Skonto bei Zahlung bis 10 Tage: 2 %",
            "USt-IdNr.: DE000000000",
            "Fälligkeitsdatum: 15.03.2026",
        ],
    )
    return ChatDocumentModel(
        title=f"Rechnung {vendor}",
        filename=f"rechnung-{invoice_no}.pdf",
        text=body,
        fields=[
            ChatFieldModel(key="vendor", value=vendor),
            ChatFieldModel(key="amount", value=f"{total} EUR"),
        ],
    )


def _tax_doc(rng: random.Random, fee: str, year: str) -> ChatDocumentModel:
    body = _pad_paragraph(
        rng,
        "Bescheid",
        [
            f"Jahresgebühr Hundesteuer {year}: {fee} EUR",
            "Nebenkosten Wasser: 88,00 EUR",
            "Grundsteuer B: 210,00 EUR",
        ],
    )
    return ChatDocumentModel(
        title="Hundesteuerbescheid",
        filename=f"hund-{year}.pdf",
        text=body,
        fields=[ChatFieldModel(key="fee", value=f"{fee} EUR")],
    )


def _rent_doc(rng: random.Random, due_day: str) -> ChatDocumentModel:
    body = _pad_paragraph(
        rng,
        "Mietvertrag",
        [
            f"Die Miete ist bis zum {due_day} Werktag des Monats fällig.",
            "Kaution: 1.500,00 EUR",
            "Kündigungsfrist: drei Monate zum Quartalsende.",
        ],
    )
    return ChatDocumentModel(
        title="Mietvertrag Lindenweg",
        filename="miete-lindenweg.pdf",
        text=body,
        fields=[],
    )


def generate() -> ChatFixturesFile:
    rng = random.Random(SEED)
    cases: list[ChatCaseModel] = []
    vendors = ["Nordwind GmbH", "Südlicht AG", "Bergwerk KG", "Rhein IT GmbH", "Musterstadt GmbH"]
    for i in range(80):
        vendor = vendors[i % len(vendors)]
        total = f"{rng.randint(100, 9999)},{rng.randint(10, 99):02d}"
        inv = f"RN-{1000 + i}"
        doc = _invoice_doc(rng, vendor, total, inv)
        cases.append(
            ChatCaseModel(
                id=f"ans-inv-{i:03d}",
                kind="answerable",
                question="Welche Gesamtsumme steht auf der Rechnung?",
                documents=[doc],
                answer_must_contain=[f"Gesamtsumme: {total} EUR"],
                evidence_in_retrieval=["Gesamtsumme"],
            )
        )

    for i in range(20):
        fee = f"{rng.randint(80, 240)},{rng.randint(0, 99):02d}"
        year = str(2024 + (i % 2))
        doc = _tax_doc(rng, fee, year)
        cases.append(
            ChatCaseModel(
                id=f"ans-tax-{i:03d}",
                kind="answerable",
                question="Was kostet die Hundesteuer im Bescheid?",
                documents=[doc],
                answer_must_contain=[fee],
                evidence_in_retrieval=["Hundesteuer"],
            )
        )

    for i in range(10):
        due = str(1 + (i % 5))
        doc = _rent_doc(rng, due)
        cases.append(
            ChatCaseModel(
                id=f"ans-rent-{i:03d}",
                kind="answerable",
                question="Bis zu welchem Werktag ist die Miete fällig?",
                documents=[doc],
                answer_must_contain=[f"{due}. Werktag"],
                evidence_in_retrieval=["Miete"],
            )
        )

    for i in range(40):  # 25% unanswerable of 160
        doc = _invoice_doc(rng, vendors[i % len(vendors)], "500,00", f"X-{i}")
        missing_questions = [
            "Welche Kündigungsfrist gilt in diesem Dokument?",
            "Wie hoch ist die Jahresmiete für die Wohnung?",
            "Welche IBAN hat der Empfänger für die Überweisung?",
            "Wann läuft die Gewährleistung für die Maschine ab?",
        ]
        q = missing_questions[i % len(missing_questions)]
        cases.append(
            ChatCaseModel(
                id=f"unans-{i:03d}",
                kind="unanswerable",
                question=q,
                documents=[doc],
            )
        )

    for i in range(12):
        inv_a = _invoice_doc(rng, "Nordwind GmbH", "1.234,56", f"ND-{i}")
        tax_b = _tax_doc(rng, "120,00", "2025")
        cases.append(
            ChatCaseModel(
                id=f"multi-{i:03d}",
                kind="multi_doc",
                question="Nenne Gesamtsumme der Rechnung Nordwind und die Hundesteuer.",
                documents=[inv_a, tax_b],
                answer_must_contain=["1.234,56", "120,00"],
                required_source_tags=["rechnung-ND", "hund-2025"],
            )
        )

    for i in range(8):
        doc = _rent_doc(rng, "3")
        cases.append(
            ChatCaseModel(
                id=f"open-{i:03d}",
                kind="open",
                question="Fasse die wichtigsten Zahlungsbedingungen kurz zusammen.",
                documents=[doc],
                acceptable_answers=["Miete", "fällig", "Kaution"],
            )
        )

    if len(cases) < 150:
        raise RuntimeError(f"expected >=150 cases, got {len(cases)}")
    return ChatFixturesFile(
        version=2,
        seed=SEED,
        provenance="Seeded synthetic German business documents (Docuvate CE, licence-clean).",
        cases=cases,
    )


def main() -> int:
    payload = generate()
    OUT.write_text(
        json.dumps(payload.model_dump(), indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )
    print(f"Wrote {len(payload.cases)} cases to {OUT.name}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
