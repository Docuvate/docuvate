"""Reproducible synthetic document corpus (invoices, letters, delivery notes, tables)."""

from __future__ import annotations

import json
import random
import string
from dataclasses import asdict, dataclass, field
from pathlib import Path
from typing import Any

from PIL import Image, ImageDraw, ImageFont

SEMANTIC_ROLES = [
    "invoice_number",
    "invoice_date",
    "vendor",
    "total_amount",
    "table_header",
    "table_cell",
    "title",
    "body",
    "other",
]

TEMPLATE_FAMILIES = ["invoice_a", "invoice_b", "letter_a", "delivery_a", "table_a", "table_b"]


@dataclass
class SynthElement:
    text: str
    bbox: tuple[float, float, float, float]
    role: str
    field_name: str | None = None
    table_id: int | None = None
    row: int | None = None
    col: int | None = None
    row_span: int = 1
    col_span: int = 1
    bold: bool = False
    font_size: float = 10.0
    ocr_confidence: float = 1.0


@dataclass
class SynthDocument:
    doc_id: str
    template_family: str
    page_w: float = 595.0
    page_h: float = 842.0
    elements: list[SynthElement] = field(default_factory=list)
    fields: dict[str, str] = field(default_factory=dict)
    split: str = "train"

    def to_dict(self) -> dict[str, Any]:
        return {
            "doc_id": self.doc_id,
            "template_family": self.template_family,
            "page_w": self.page_w,
            "page_h": self.page_h,
            "split": self.split,
            "fields": self.fields,
            "elements": [asdict(e) for e in self.elements],
        }


def _rand_invoice_no(rng: random.Random) -> str:
    return f"INV-{rng.randint(10000, 99999)}"


def _rand_date(rng: random.Random) -> str:
    return f"{rng.randint(1,28):02d}.{rng.randint(1,12):02d}.{rng.randint(2020,2026)}"


def _rand_amount(rng: random.Random) -> str:
    return f"{rng.randint(100, 9999)},{rng.randint(10,99):02d} EUR"


def _rand_vendor(rng: random.Random) -> str:
    names = ["Muster GmbH", "Acme AG", "Nord Handel", "Süd Logistik", "Tech Parts KG"]
    return rng.choice(names)


def _layout_invoice(rng: random.Random, variant: str, margin: float, cols: int) -> SynthDocument:
    doc_id = f"inv_{rng.randint(0, 10**9)}"
    family = "invoice_a" if variant == "a" else "invoice_b"
    elements: list[SynthElement] = []
    fields: dict[str, str] = {}
    y = margin
    inv_no = _rand_invoice_no(rng)
    date = _rand_date(rng)
    vendor = _rand_vendor(rng)
    total = _rand_amount(rng)
    fields = {"invoice_number": inv_no, "invoice_date": date, "vendor": vendor, "total_amount": total}

    x_label = margin
    x_val = margin + 120 + rng.uniform(-20, 40) if variant == "b" else margin + 140
    if variant == "b":
        y += rng.uniform(0, 30)

    elements.append(
        SynthElement("RECHNUNG", (margin, y, margin + 200, y + 24), "title", bold=True, font_size=14)
    )
    y += 36
    for label, val, role, fname in [
        ("Rechnungsnr.:", inv_no, "invoice_number", "invoice_number"),
        ("Datum:", date, "invoice_date", "invoice_date"),
        ("Lieferant:", vendor, "vendor", "vendor"),
    ]:
        elements.append(SynthElement(label, (x_label, y, x_label + 100, y + 14), "other"))
        elements.append(
            SynthElement(val, (x_val, y, x_val + 220, y + 14), role, field_name=fname)
        )
        y += 20 + rng.randint(0, 4)

    y += 10
    table_id = 0
    headers = ["Pos", "Artikel", "Menge", "Preis"]
    if cols >= 4:
        col_w = (595 - 2 * margin) / cols
        for c, h in enumerate(headers[:cols]):
            x0 = margin + c * col_w
            elements.append(
                SynthElement(
                    h,
                    (x0, y, x0 + col_w - 4, y + 16),
                    "table_header",
                    table_id=table_id,
                    row=0,
                    col=c,
                )
            )
        y += 18
        for r in range(1, 4 + rng.randint(0, 2)):
            for c in range(cols):
                x0 = margin + c * col_w
                txt = rng.choice(["Schraube M6", "12", "49,90", "Dichtung"])
                elements.append(
                    SynthElement(
                        txt,
                        (x0, y, x0 + col_w - 4, y + 14),
                        "table_cell",
                        table_id=table_id,
                        row=r,
                        col=c,
                    )
                )
            y += 16

    y += 20
    elements.append(SynthElement("Summe:", (x_label, y, x_label + 80, y + 16), "other"))
    elements.append(
        SynthElement(total, (x_val, y, x_val + 120, y + 16), "total_amount", field_name="total_amount", bold=True)
    )

    if rng.random() < 0.15:
        elements.append(
            SynthElement(
                rng.choice(["Seite 1", "Kopie", "Vertraulich"]),
                (400, 800, 550, 820),
                "other",
            )
        )

    return SynthDocument(doc_id, family, elements=elements, fields=fields)


def _layout_letter(rng: random.Random, margin: float) -> SynthDocument:
    elements = []
    y = margin
    elements.append(SynthElement("Betreff: Anfrage", (margin, y, margin + 300, y + 16), "title", bold=True))
    y += 40
    body = "Sehr geehrte Damen und Herren,\n" + " ".join(
        rng.choice(string.ascii_lowercase) for _ in range(40)
    )
    for line in body.split("\n"):
        elements.append(SynthElement(line[:80], (margin, y, 550, y + 14), "body"))
        y += 18
    return SynthDocument(
        f"letter_{rng.randint(0, 10**9)}",
        "letter_a",
        elements=elements,
        fields={},
    )


def _layout_delivery(rng: random.Random, margin: float) -> SynthDocument:
    y = margin
    elements = [
        SynthElement("LIEFERSCHEIN", (margin, y, margin + 200, y + 20), "title", bold=True),
    ]
    y += 30
    elements.append(
        SynthElement(_rand_vendor(rng), (margin, y, margin + 250, y + 14), "vendor", field_name="vendor")
    )
    return SynthDocument(f"del_{rng.randint(0, 10**9)}", "delivery_a", elements=elements, fields={})


def _layout_table_doc(rng: random.Random, family: str, margin: float) -> SynthDocument:
    elements = []
    y = margin
    nrows = 3 + rng.randint(1, 5)
    ncols = 3 + rng.randint(0, 2)
    cw = (595 - 2 * margin) / ncols
    for c in range(ncols):
        elements.append(
            SynthElement(f"Col{c}", (margin + c * cw, y, margin + (c + 1) * cw, y + 16), "table_header", table_id=0, row=0, col=c)
        )
    y += 18
    for r in range(1, nrows):
        for c in range(ncols):
            elements.append(
                SynthElement(
                    f"R{r}C{c}",
                    (margin + c * cw, y, margin + (c + 1) * cw - 2, y + 14),
                    "table_cell",
                    table_id=0,
                    row=r,
                    col=c,
                )
            )
        y += 16
    return SynthDocument(f"tab_{rng.randint(0, 10**9)}", family, elements=elements, fields={})


def generate_document(rng: random.Random, template_roll: float | None = None) -> SynthDocument:
    kind = rng.random() if template_roll is None else template_roll
    margin = 36 + rng.uniform(-8, 24)
    cols = rng.choice([3, 4, 5])
    if kind < 0.35:
        doc = _layout_invoice(rng, rng.choice(["a", "b"]), margin, cols)
    elif kind < 0.5:
        doc = _layout_letter(rng, margin)
    elif kind < 0.65:
        doc = _layout_delivery(rng, margin)
    else:
        doc = _layout_table_doc(rng, rng.choice(["table_a", "table_b"]), margin)
    for e in doc.elements:
        e.font_size = 9 + rng.uniform(-1, 3)
        if rng.random() < 0.05:
            e.bold = not e.bold
    return doc


def assign_splits(docs: list[SynthDocument], seed: int) -> None:
    """Split by template family — no family appears in more than one split."""
    rng = random.Random(seed)
    families = sorted({d.template_family for d in docs})
    rng.shuffle(families)
    n_test = max(1, len(families) // 3)
    n_ood = max(1, len(families) // 4)
    test_f = set(families[:n_test])
    ood_f = set(families[n_test : n_test + n_ood])
    train_f = set(families[n_test + n_ood :])
    if not train_f:
        train_f = set(families[n_test + n_ood - 1 : n_test + n_ood])
    for d in docs:
        if d.template_family in test_f:
            d.split = "test"
        elif d.template_family in ood_f:
            d.split = "ood"
        else:
            d.split = "train"


def apply_ocr_noise(doc: SynthDocument, rng: random.Random, rate: float = 0.08) -> None:
    for e in doc.elements:
        e.ocr_confidence = max(0.5, 1.0 - rng.random() * 0.15)
        if rng.random() < rate and e.text:
            chars = list(e.text)
            i = rng.randint(0, len(chars) - 1)
            chars[i] = rng.choice("0OIl1")
            e.text = "".join(chars)


def render_document_png(doc: SynthDocument, path: Path) -> None:
    img = Image.new("RGB", (int(doc.page_w), int(doc.page_h)), "white")
    draw = ImageDraw.Draw(img)
    try:
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 10)
        font_b = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 11)
    except OSError:
        font = ImageFont.load_default()
        font_b = font
    for e in doc.elements:
        f = font_b if e.bold else font
        draw.rectangle(e.bbox, outline=(200, 200, 200))
        draw.text((e.bbox[0], e.bbox[1]), e.text[:60], fill="black", font=f)
    path.parent.mkdir(parents=True, exist_ok=True)
    img.save(path)


def generate_corpus(n_docs: int, seed: int) -> list[SynthDocument]:
    rng = random.Random(seed)
    docs = [generate_document(rng) for _ in range(n_docs)]
    assign_splits(docs, seed)
    for d in docs:
        if d.split != "train":
            apply_ocr_noise(d, rng, rate=0.1)
    return docs


def save_corpus(docs: list[SynthDocument], out_dir: Path) -> None:
    out_dir.mkdir(parents=True, exist_ok=True)
    meta = [d.to_dict() for d in docs]
    with (out_dir / "corpus.json").open("w", encoding="utf-8") as f:
        json.dump(meta, f, ensure_ascii=False, indent=0)


def load_corpus(path: Path) -> list[SynthDocument]:
    with path.open(encoding="utf-8") as f:
        meta = json.load(f)
    docs = []
    for m in meta:
        els = [SynthElement(**e) for e in m["elements"]]
        docs.append(
            SynthDocument(
                m["doc_id"],
                m["template_family"],
                m["page_w"],
                m["page_h"],
                els,
                m.get("fields", {}),
                m.get("split", "train"),
            )
        )
    return docs
