// Docuvate Export (semantisch). Quelle: Layout IR v1
// Stile: hier zentral anpassen, unten steht nur Inhalt.
#set page(paper: "a4", margin: (x: 14mm, y: 14mm))
#set text(font: "Liberation Sans", size: 10pt, lang: "de")
#set par(spacing: 0.85em)
#show heading.where(level: 1): set text(size: 14pt, weight: "bold")
#show heading.where(level: 2): set text(size: 11pt, weight: "bold")
#show heading: set block(above: 1.1em, below: 0.5em)

#let small(body) = text(size: 8pt, fill: luma(80), body)
#let fields(..cells) = table(
  columns: (auto, 1fr), stroke: none, inset: (x: 0pt, y: 2pt),
  align: (left, left), ..cells,
)
#let form-table(columns: (auto, 1fr, auto), ..cells) = table(
  columns: columns, stroke: 0.5pt, inset: 4pt,
  align: (left, left, right), ..cells,
)

Synthetic layout regression document with enough words to classify as born digital.

= Synthetic electronic payroll certificate for tax year 2025 (fictional employer, no personal data)

#table(
  columns: (auto, auto),
  stroke: 0.5pt,
  inset: 4pt,
  [Reporting period], [01.01. - 31.12.], [Gross wages incl. benefits], [48.250,00], [Income tax withheld], [9.120,00],
)
1.

3.

5.

Employee ID:

SYN-4711
