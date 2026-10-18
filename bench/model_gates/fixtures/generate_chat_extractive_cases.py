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
SEED = 20261012

INVOICE_TOTAL_QUESTIONS = (
    "Wie viel muss ich insgesamt überweisen?",
    "Welcher Endbetrag ist auf der Rechnung fällig?",
    "Was ist der Rechnungsbetrag inklusive aller Positionen?",
    "Nenne mir den Gesamtbetrag in Euro.",
    "Wie hoch ist die Summe nach Skontoabzug nicht berücksichtigt?",
)

TAX_FEE_QUESTIONS = (
    "Was muss ich für den Hund an die Gemeinde zahlen?",
    "Wie hoch ist die jährliche Hundesteuer?",
    "Welcher Betrag ist im Bescheid für die Hundesteuer ausgewiesen?",
)

RENT_DUE_QUESTIONS = (
    "Bis wann muss die Miete eingehen?",
    "An welchem Tag im Monat ist die Zahlung spätestens fällig?",
    "Wie lautet die Fälligkeit der Monatsmiete?",
)

LEASE_NOTICE_QUESTIONS = (
    "Wie lange ist die Kündigungsfrist?",
    "Wann kann ich den Vertrag kündigen?",
    "Welche Frist gilt bei einer Kündigung?",
)

LEASE_RENT_QUESTIONS = (
    "Wie viel muss ich monatlich zahlen?",
    "Was beträgt die Kaltmiete?",
    "Welche monatliche Mietzahlung ist vereinbart?",
)


def _long_body(rng: random.Random, paragraphs: list[str]) -> str:
    lines = list(paragraphs)
    ocr = (
        "Randnotiz (OCR): Zahlungsverkehr, Vertragsänderungen und Mahnwesen werden getrennt geführt. "
        "Teilzahlungen können vom Restbetrag abweichen."
    )
    while len("\n".join(lines)) < 850:
        lines.append(ocr + f" Ref-{rng.randint(10000, 99999)}.")
    return "\n".join(lines)


def _invoice_doc(
    rng: random.Random,
    *,
    vendor: str,
    total: str,
    net: str,
    invoice_no: str,
    due_date: str,
) -> ChatDocumentModel:
    body = _long_body(
        rng,
        [
            f"Rechnung {invoice_no} an {vendor}.",
            f"Nettobetrag: {net} EUR. MwSt. 19 % separat ausgewiesen.",
            f"Gesamtsumme / Rechnungsbetrag: {total} EUR.",
            f"Restbetrag nach Anzahlung: {net} EUR (nicht der Endbetrag).",
            f"Zahlungsziel: 14 Tage, spätestens {due_date}.",
            "Skonto 2 % bei Zahlung innerhalb von 7 Tagen.",
            "Hinweis: Kündigung eines Wartungsvertrags ist hier nicht geregelt.",
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


def _tax_doc(rng: random.Random, *, fee: str, year: str, ref: str) -> ChatDocumentModel:
    body = _long_body(
        rng,
        [
            f"Steuerbescheid {year} ({ref}).",
            f"Festgesetzte Jahresgebühr Hundesteuer: {fee} EUR.",
            "Nebenkosten Wasser: 88,00 EUR (anderes Konto).",
            "Grundsteuer B: 210,00 EUR.",
            "Kündigung des Versicherungsvertrags: siehe Anlage (ohne Fristangabe).",
        ],
    )
    return ChatDocumentModel(
        title="Hundesteuerbescheid",
        filename=f"hund-{year}-{ref}.pdf",
        text=body,
        fields=[ChatFieldModel(key="fee", value=f"{fee} EUR")],
    )


def _lease_doc(
    rng: random.Random,
    *,
    cold_rent: str,
    due_day: str,
    notice: str,
    slug: str,
) -> ChatDocumentModel:
    body = _long_body(
        rng,
        [
            f"Mietvertrag {slug}.",
            f"Die Kaltmiete beträgt {cold_rent} EUR monatlich.",
            f"Kündigung mit {notice} zum Monatsende.",
            f"Miete zahlbar bis zum {due_day}. Werktag eines Monats.",
            "Kaution: 1.500,00 EUR, keine Jahresmiete pauschal genannt.",
        ],
    )
    return ChatDocumentModel(
        title=f"Mietvertrag {slug}",
        filename=f"miete-{slug}.pdf",
        text=body,
        fields=[],
    )


def _partner_only_doc(rng: random.Random, vendor: str, tag: str) -> ChatDocumentModel:
    body = _long_body(
        rng,
        [
            f"Rahmenvertrag: Auftragspartner {vendor}.",
            "Leistungszeitraum Q1. Einzelrechnungen folgen separat.",
            "Gesamtsumme siehe jeweilige Rechnungslegung.",
        ],
    )
    return ChatDocumentModel(
        title=f"Partner {vendor}",
        filename=f"partner-{tag}.pdf",
        text=body,
        fields=[],
    )


def _amount_only_doc(rng: random.Random, total: str, tag: str) -> ChatDocumentModel:
    body = _long_body(
        rng,
        [
            "Rechnungsstellung Februar.",
            f"Rechnungsbetrag / Gesamtsumme: {total} EUR.",
            "Nettobetrag 1.037,45 EUR, MwSt. ausgewiesen.",
            "Empfänger: wie im Rahmenvertrag genannt.",
        ],
    )
    return ChatDocumentModel(
        title="Einzelrechnung",
        filename=f"rechnung-{tag}.pdf",
        text=body,
        fields=[ChatFieldModel(key="amount", value=f"{total} EUR")],
    )


def generate() -> ChatFixturesFile:
    rng = random.Random(SEED)
    cases: list[ChatCaseModel] = []
    vendors = ["Nordwind GmbH", "Südlicht AG", "Bergwerk KG", "Rhein IT GmbH", "Musterstadt GmbH"]

    for i in range(80):
        vendor = vendors[i % len(vendors)]
        total = f"{rng.randint(100, 9999)},{rng.randint(10, 99):02d}"
        net = f"{rng.randint(50, 8000)},{rng.randint(10, 99):02d}"
        inv = f"RN-{1000 + i}"
        due = f"{rng.randint(1, 28):02d}.{(i % 12) + 1:02d}.2026"
        doc = _invoice_doc(rng, vendor=vendor, total=total, net=net, invoice_no=inv, due_date=due)
        q = INVOICE_TOTAL_QUESTIONS[i % len(INVOICE_TOTAL_QUESTIONS)]
        cases.append(
            ChatCaseModel(
                id=f"ans-inv-{i:03d}",
                kind="answerable",
                question=q,
                documents=[doc],
                answer_must_contain=[total],
                evidence_in_retrieval=["Gesamtsumme", total],
            )
        )

    for i in range(20):
        fee = f"{rng.randint(80, 240)},{rng.randint(0, 99):02d}"
        year = str(2024 + (i % 2))
        ref = f"ST-{i:03d}"
        doc = _tax_doc(rng, fee=fee, year=year, ref=ref)
        q = TAX_FEE_QUESTIONS[i % len(TAX_FEE_QUESTIONS)]
        cases.append(
            ChatCaseModel(
                id=f"ans-tax-{i:03d}",
                kind="answerable",
                question=q,
                documents=[doc],
                answer_must_contain=[fee],
                evidence_in_retrieval=["Hundesteuer"],
            )
        )

    for i in range(15):
        due = str(1 + (i % 5))
        notice = "drei Monaten Frist"
        cold = f"{rng.randint(600, 1200)},{rng.randint(0, 99):02d}"
        slug = f"lindenweg-{i}"
        doc = _lease_doc(rng, cold_rent=cold, due_day=due, notice=notice, slug=slug)
        if i % 3 == 0:
            q = RENT_DUE_QUESTIONS[i % len(RENT_DUE_QUESTIONS)]
            must = [f"{due}. Werktag"]
        elif i % 3 == 1:
            q = LEASE_NOTICE_QUESTIONS[i % len(LEASE_NOTICE_QUESTIONS)]
            must = ["drei Monaten", "Monatsende"]
        else:
            q = LEASE_RENT_QUESTIONS[i % len(LEASE_RENT_QUESTIONS)]
            must = [cold]
        cases.append(
            ChatCaseModel(
                id=f"ans-lease-{i:03d}",
                kind="answerable",
                question=q,
                documents=[doc],
                answer_must_contain=must,
                evidence_in_retrieval=["Mietvertrag", "Kaltmiete"] if "monatlich" in q else ["Miete"],
            )
        )

    def _on_topic_unanswerable_pair(index: int, base: ChatDocumentModel) -> tuple[str, ChatDocumentModel]:
        slot = index % 4
        if slot == 0:
            return ("Welche Kündigungsfrist gilt für diesen Rechnungsfall?", base)
        if slot == 1:
            return (
                "Wie hoch ist die Jahresmiete für die Wohnung?",
                _invoice_doc(
                    rng,
                    vendor=vendors[0],
                    total="500,00",
                    net="420,00",
                    invoice_no=f"U-{rng.randint(1, 99)}",
                    due_date="01.01.2026",
                ),
            )
        if slot == 2:
            return (
                "An welchem Datum endet die Gewährleistung für die gelieferte Maschine?",
                _lease_doc(
                    rng,
                    cold_rent="800,00",
                    due_day="3",
                    notice="ohne Einzelangabe der Frist im Vertragstext",
                    slug="gewaehr",
                ),
            )
        return (
            "Welche IBAN soll für die Überweisung verwendet werden?",
            _invoice_doc(
                rng,
                vendor=vendors[1],
                total="333,33",
                net="280,00",
                invoice_no=f"IB-{rng.randint(1, 99)}",
                due_date="15.06.2026",
            ),
        )

    off_topic_questions = (
        "Wie wird das Wetter am Wochenende in Reykjavik?",
        "Welches Fussballergebnis hatte die Bundesliga gestern Abend?",
        "Wann startet die naechste Mondmission der ESA?",
    )

    def _minimal_invoice(vendor: str, inv: str) -> ChatDocumentModel:
        return ChatDocumentModel(
            title=f"Rechnung {vendor}",
            filename=f"rechnung-{inv}.pdf",
            text=f"Rechnung {inv}. Lieferant {vendor}. Gesamtsumme 12,00 EUR.",
            fields=[],
        )

    for i in range(42):
        if i % 3 == 2:
            q = off_topic_questions[i % len(off_topic_questions)]
            doc = _minimal_invoice(vendors[i % len(vendors)], f"OFF-{i}")
        else:
            base = _invoice_doc(
                rng,
                vendor=vendors[i % len(vendors)],
                total="500,00",
                net="400,00",
                invoice_no=f"X-{i}",
                due_date="10.10.2026",
            )
            q, doc = _on_topic_unanswerable_pair(i, base)
        cases.append(
            ChatCaseModel(
                id=f"unans-{i:03d}",
                kind="unanswerable",
                question=q,
                documents=[doc],
            )
        )

    for i in range(12):
        total = f"1.234,{56 + (i % 3):02d}"
        wrong_total = "9.999,99"
        partner = _partner_only_doc(rng, "Nordwind GmbH", f"nd-{i}")
        amount = _amount_only_doc(rng, total, f"feb-{i}")
        distractor = _amount_only_doc(rng, wrong_total, f"dist-{i}")
        noise_docs = [
            _tax_doc(rng, fee="99,00", year="2025", ref=f"d-{i}-a"),
            _invoice_doc(
                rng,
                vendor="Südlicht AG",
                total=wrong_total,
                net="8000,00",
                invoice_no=f"ZZ-{i}",
                due_date="01.01.2026",
            ),
            _partner_only_doc(rng, "Bergwerk KG", f"bw-{i}"),
            _lease_doc(rng, cold_rent="700,00", due_day="5", notice="vier Wochen", slug=f"n-{i}"),
        ]
        q = (
            "Welche Gesamtsumme wurde für Nordwind in der Februar-Rechnung berechnet "
            "und welcher Partnername steht im Rahmenvertrag?"
        )
        cases.append(
            ChatCaseModel(
                id=f"multi-{i:03d}",
                kind="multi_doc",
                question=q,
                documents=[partner, amount, distractor, *noise_docs],
                answer_must_contain=[total, "Nordwind"],
                answer_must_not_contain=[wrong_total],
                required_source_tags=[f"partner-nd-{i}", f"rechnung-feb-{i}"],
            )
        )

    open_questions = (
        "Was sind die wesentlichen Zahlungsbedingungen in diesem Mietvertrag?",
        "Fasse Miete, Kaution und Kündigung in einem Satz zusammen.",
        "Welche finanziellen Verpflichtungen ergeben sich monatlich und einmalig?",
    )
    for i in range(8):
        doc = _lease_doc(
            rng,
            cold_rent="945,00",
            due_day="3",
            notice="drei Monaten Frist",
            slug=f"open-{i}",
        )
        cases.append(
            ChatCaseModel(
                id=f"open-{i:03d}",
                kind="open",
                question=open_questions[i % len(open_questions)],
                documents=[doc],
                acceptable_answers=["Kaution", "Quartalsende", "Kündigungsfrist"],
                open_min_token_hits=3,
            )
        )

    if len(cases) < 150:
        raise RuntimeError(f"expected >=150 cases, got {len(cases)}")
    return ChatFixturesFile(
        version=3,
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
