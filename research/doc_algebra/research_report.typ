#set document(title: "Document Algebra — Forschungsbericht", date: datetime(year: 2026, month: 10, day: 15))
#set text(lang: "de", size: 10pt)
#set heading(numbering: "1.")

= Kurzfassung

PoC unter `research/doc_algebra/`: assoziative Algebra $D_B$, trunkierte Tensoralgebra, synthetische Dokumente (2000/Seed, Seeds 42–44), Modelle A–H auf CPU.

*Assoziativität* von $D_B$ gilt für beliebige bilineare $B_k$ (Beweisskizze im Markdown-Bericht; Hypothesis-Tests grün).

*Ergebnis P1 (macro-F1, Test-Template-Holdout, Mittel über 3 Seeds):*
- A (Geometrie): #strong[0.212]
- E/F (DIN fest/gelernt): #strong[0.200 / 0.199]
- H (Bispektrum): 0.179
- G (Tensor): 0.062

= Schlussfrage

*Gibt es einen belastbaren Hinweis auf bessere Generalisierung oder Ausdruckskraft bei vergleichbarer CPU-Komplexität?*

#block(fill: luma(240), inset: 8pt)[
  *Antwort: Nein.* Modell A ist auf Test mindestens gleichwertig oder besser als E/F bei weniger Merkmalen (~5 ms/Seite Inferenz). Assoziativität allein liefert keinen empirischen Vorteil gegenüber handgebauten geometrischen + Textmerkmalen mit linearem Klassifikator.
]

== Mathematische Erklärung (kompakt)

Das Produkt
$ (a,u,t) dot (b,v,s) = (a b,; a v + b u,; a s + b t + B(u,v)) $
ist eine *split extension* von $RR$ durch $RR^d oplus RR^m$. Für *elementweise* Rollenklassifikation mit *einem* Nachbarpaar liefert $B(u,v)$ höchstens quadratische Information — äquivalent zu Polynom-/Relative-Features. Gelernte $B_k$ (Ridge auf $vec(u v^T)$) reproduzieren im Lauf die feste geometrische $B$ (Train-MSE $approx 10^(-9)$, $cond approx 1.44$).

Absolute Koordinaten: $B$ ist *nicht* translationsinvariant (numerisch: $||Delta B|| > 0$ nach Translation). Kreuz-Bispektrum ebenfalls nicht invariant ($L_2 approx 4.49$ nach Shift).

== Präzise Folgefrage

Führt eine *assoziative Reading-Order-Kette* $d_1 dots d_n$ in $D_B$ mit gradweiser Kompression zu strikt besserer OOD macro-F1 als (i) Bag-of-Polynomial-Features und (ii) gleich parametrisiertes lineares RNN bei fixiertem p95-Inferenz/Seite?

== Hardware & Reproduktion

- Linux x86_64, 4 Kerne, Python 3.12.3
- Gesamtlauf: $approx$ 818 s, Peak-RAM $approx$ 357 MB
- `pytest -q`; `python experiments/run_all.py --n-docs 2000 --seeds 42,43,44`

== Modelltabelle (Test-Split, Mittelwerte)

#table(
  columns: (auto, auto, auto, auto, auto),
  [*Modell*], [*Features*], [*Train s*], [*Inferenz ms*], [*P1 F1*],
  [A], [9], [0.62], [4.9], [0.212],
  [E], [14], [0.50], [5.3], [0.200],
  [F], [14], [0.60], [5.4], [0.199],
  [G], [15], [0.53], [5.0], [0.062],
  [B3], [155], [7.62], [5.1], [0.085],
)

Details: siehe `research_report.md` und `results/summary.json`.
