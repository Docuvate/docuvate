// Docuvate Export (semantisch). Quelle: Layout IR v1
#set text(font: "Liberation Sans", size: 10pt, lang: "de")
#set par(spacing: 0.85em)
#show heading.where(level: 1): set text(size: 14pt, weight: "bold")
#show heading.where(level: 2): set text(size: 11pt, weight: "bold")
#show heading: set block(above: 1.1em, below: 0.5em)

#let fields(..cells) = table(
  columns: (auto, 1fr), stroke: none, inset: (x: 0pt, y: 2pt),
  align: (left, left), ..cells,
)

#set page(width: 612.00pt, height: 792.00pt, margin: (x: 14mm, y: 14mm))

Synthetic layout regression document with enough words to classify as born digital.

= Synthetic electronic payroll certificate for tax year 2025 (fictional employer, no personal data)

#fields([Employee ID:], [SYN-4711])

#table(
  columns: (auto, auto, auto),
  stroke: 0.5pt,
  inset: 4pt,
  table.header([1.], [Reporting period], [01.01. - 31.12.]),
  [3.], [Gross wages incl. benefits], [48.250,00], [5.], [Income tax withheld], [9.120,00],
)
