# Forschungsbericht: Geometrisch-semantische Algebra für Document AI (PoC)

**Stand:** 2026-10-15 · **Hardware:** Linux x86_64, 4 CPU-Kerne, Python 3.12.3, nur CPU · **Daten:** synthetisch, 2000 Dokumente/Seed, Seeds 42–43–44

## Kurzfassung

Wir haben die Familie assoziativer Algebren \(D_B\), eine trunkierte Tensoralgebra bis Grad 3, synthetische Dokumente (Rechnungen, Briefe, Lieferscheine, Tabellen) und acht Vergleichsmodelle (A–H) implementiert und auf CPU ausgewertet. **Assoziativität** von \(D_B\) gilt für **beliebige** bilineare \(B_k\) (bewiesen und per Hypothesis getestet); gelernte \(B_k\) via Ridge **verletzen Assoziativität nicht**. Für die semantische Rollenklassifikation (P1) und Feldextraktion (P2) auf **Template-Holdout** (Test-Split) zeigt **kein** algebraisches Modell (E/F/G) einen **statistisch belastbaren Vorteil** gegenüber handgebauten geometrischen Merkmalen (A) bei vergleichbarer Modellgröße und Inferenzzeit. Polynome höheren Grades (B3) und reine Tensorfeatures (G) generalisieren schlechter. **Schlussfolgerung zur Schlussfrage: nein** — siehe Abschnitt 10.

---

## Teil 1: Algebra \(D_B\)

### Definition

Elemente \(d = (a, u, t)\) mit \(a \in \mathbb{R}\), \(u \in \mathbb{R}^d\), \(t \in \mathbb{R}^m\). Bilineare Formen \(B_k\) mit \(B(u,v)_k = u^\top B_k v\).

**Produkt:** \((a,u,t) \cdot (b,v,s) = (ab,\; av + bu,\; as + bt + B(u,v))\).

### 1) Assoziativität (allgemein für bilineares \(B\))

Seien \(x=(a,u,t)\), \(y=(b,v,s)\), \(z=(c,w,r)\). Schreibweise \(xy\) für das Produkt. Skalar- und \(u\)-Anteile sind assoziativ (Standard-Algebra auf \(\mathbb{R}\) und Modulstruktur). Für den \(t\)-Anteil:

\[
(xy)z \text{ liefert } t\text{-Term } (ab)r + c(as+bt+B(u,v)) + B(av+bu, w)
\]

\[
x(yz) \text{ liefert } t\text{-Term } a(br+cs+B(v,w)) + (bc)t + B(u, bw+cv)
\]

Ausmultiplizieren und bilineare Identitäten \(B(\alpha u + \beta u', w) = \alpha B(u,w) + \beta B(u',w)\) (analog für das zweite Argument) zeigen Gleichheit der \(t\)-Komponenten. **Assoziativität hängt nicht davon ab, ob \(B_k\) fest oder gelernt sind** — solange die Multiplikationsregel fix bleibt.

### 2) Einselement

\(e = (1, 0, 0)\) erfüllt \(x \cdot e = e \cdot x = x\) für alle \(x\) (weil \(B(u,0)=B(0,v)=0\)).

### 3) Kommutativität / Nilpotenz

- **Nicht kommutativ** sobald \(av+bu \neq bu+av\) (typisch für \(d>1\)).
- Für die **geometrische** Wahl \(B_1 = \dot{}\), \(B_2 = \det\)-artig (antisymmetrisch): erster Tail ist symmetrisch, zweiter **antisymmetrisch** → Algebra insgesamt nicht kommutativ.
- **Nilpotenz** reiner \(u\)-Anteile ohne Skalar: im Test **nicht** in wenigen Schritten (generisch nicht nilpotent).

### 4) Bezug zu bekannten Strukturen

\(D_B\) ist eine **split extension** / semidirektes Produkt von \(\mathbb{R}\) mit dem Modul \(\mathbb{R}^d \oplus \mathbb{R}^m\), induziert durch bilineare Kopplung \(B\). Spezialfälle:

- \(m=0\): klassische **kommutative** Erweiterung (vereinfacht).
- Geometrische \(B\) (Dot + „Wedge“ in 2D): Fragment einer **Clifford-/Geometrie-Algebra**-Motivik, aber **ohne** Clifford-Relation \(e_i^2 = q_i\) — daher **keine** Standard-GA-Isomorphie.
- Isomorph zu einer **Untermatrix-Algebra** blockoberer Dreiecksmatrizen (Darstellung \( (a,u,t) \mapsto \begin{pmatrix} a & u^\top & t \\ 0 & aI & \cdots \\ 0 & 0 & a \end{pmatrix}\) mit strukturierter Kopplung über \(B\)) — hier nicht vollständig ausgearbeitet, aber strukturell etabliertes Konstruktionsprinzip (**Bereich-Erweiterungsalgebra**).

### 5–6) Implementierung & Tests

`src/algebra.py`, Property-Tests in `tests/test_algebra.py` (Hypothesis, 80+ Fälle). **Gelerntes \(B\):** Ridge auf \(\mathrm{vec}(uv^\top)\); Beispiel-Diagnostik: `cond(X'X+λI) ≈ 1.44`, Train-MSE ≈ `8.3e-10` (500 Paare, \(d=2\), \(m=2\), \(\lambda=10^{-2}\)).

---

## Geometrische Basis (\(u=(x,y)\))

\(B(u,v) = (u \cdot v,\; u_x v_y - u_y v_x)\).

| Transformation | Verhalten \(B(u,v)\) (numerisch, `geometry_ablation`) |
|----------------|--------------------------------------------------------|
| Translation \(u \mapsto u+\Delta\) | **Nicht invariant** (L2-Änderung der Komponenten) |
| Differenzvektoren | Antisymmetrischer Teil paarweise strukturiert |
| Rotation | Kovarient mit Standard-2D-Geometrie (nicht separat ausgewertet) |

**Folgerung:** Absolute Seitenkoordinaten in \(B\) ohne Normalisierung/Differenzbildung **nicht** translationsinvariant behaupten. Im PoC: normalisierte Zentren + Nachbarpaar-Interaktion.

---

## Gelernte Algebra

Ridge-Lösung: \(W = (X^\top X + \lambda I)^{-1} X^\top Y\) mit exakter Designmatrix \(X_i = \mathrm{vec}(u_i v_i^\top)\). **Assoziativität bleibt** (s.o.). **Identifizierbarkeit:** \(B_k\) nur bis zu Maßstab/Ridge-Regularisierung aus Paarbeobachtungen; im Experiment lernt \(F\) praktisch die feste geometrische \(B\) nach (MSE \(\approx 10^{-9}\)) → **E und F numerisch identisch**.

---

## Teil 2: Trunkierte Tensoralgebra \(D_3\)

\(D_3 = \mathbb{R} \oplus V \oplus V^{\otimes 2} \oplus V^{\otimes 3}\), Produkt durch trunciertes Cauchy-Produkt (`src/tensor_algebra.py`). **Assoziativität** bis Grad 3 per Hypothesis verifiziert.

- **Grad 1:** Position; **Grad 2:** dyadische räumliche Terme; **Grad 3:** triadische (über Produkt aufgebaut).
- **Vergleich Polynom B2/B3:** Tensor G **allein** schwächster Test-F1 (0.062 macro); Polynome B3 **mehr Parameter**, Test-F1 0.085 — **H1/H3** nicht verworfen (mehr Parameter ≠ besser, höhere Momente verschlechtern hier Generalisierung).
- **Komprimierte Projektionen:** beliebige Grade-Projektion **zerstört** im Allgemeinen Assoziativität (nicht behauptet); nicht weiter optimiert.

---

## Teil 3: Keine Conditional Independence

Gemeinsame Features direkt (Textlänge, BBox, Rolle nur im Training). **Kreuz-Bispektrum** (Modell H): numerisch **nicht** translationsinvariant (`l2_diff_after_shift ≈ 4.49`). Absolute Positionsmerkmale parallel in A/E/F.

---

## Teil 4–5: Repräsentation & synthetischer Datensatz

- Seite als Liste von Textelementen mit BBox, Typografie, OCR-Konfidenz; **Labels nie als Input**.
- Generator: `src/data_generator.py`, ReportLab/PIL-Render; Ground Truth aus Layout-Generator (kein Regex-Solver).
- **2000 Docs/Seed**, Split **nach Template-Familie** (Train 943, Test 715, OOD 342 — letzter Seed-Lauf).
- OOD: andere Familien + OCR-Rauschen auf Nicht-Train-Splits.

---

## Teil 6–7: Modelle & Metriken

| Modell | Beschreibung | Features (ca.) | Params (ca.) | Train (s, Ø) | Inferenz ms/Seite (Median, Ø Test) |
|--------|--------------|----------------|--------------|--------------|-------------------------------------|
| A | Geometrie + Textstats + Ridge/LogReg | 9 | 80 | 0.62 | 4.9 |
| B2/B3 | Polynom + LogReg | 30 / 155 | 248 / 1248 | 1.6 / 7.6 | 5.1 |
| C | RBF Kernel Ridge (800 Subsample) | 9 | 500 | 0.30 | 11.0 |
| D | MLP (32 hidden) | 9 | 584 | 0.62 | 5.7 |
| E | Festes DIN + Nachbar-Interaktion | 14 | 120 | 0.50 | 5.3 |
| F | Gelerntes B (≈ geometrisch) | 14 | 120 | 0.60 | 5.4 |
| G | Tensoralgebra Grad ≤3 | 15 | 128 | 0.53 | 5.0 |
| H | Geometrie + Kreuz-Bispektrum | 41 | 336 | 3.29 | 8.8 |

**P1 macro-F1 (Test, 3 Seeds, Mittelwert):** A **0.212**, E **0.200**, F **0.199**, H **0.179**, D **0.173**, B3 **0.085**, G **0.062**.  
**P1 macro-F1 (OOD):** breite Konfidenzintervalle; C **0.428**, A/E/F **~0.39** (Seed-Varianz dominiert).

**P2 Feld-Trefferquote (Test):** A **0.141**, E/F **0.124**, B3 **0.148** (hohe Varianz zwischen Seeds).

**P3 Tabellen-F1 (Test):** D **~0.41**, A **~0.38** (aus Einzelläufen).

**P4 Layout/Typst:** nur **Proxy** (Rollen-IoU); **vollständiger Typst-Reexport nicht ausgeführt** (kein Typst in Laufzeitumgebung).

**Ressourcen Gesamtlauf:** Wall **818 s**, Peak-RAM **~357 MB** (`results/summary.json`).

---

## Teil 8: Falsifikation

| Hypothese | Ergebnis |
|-----------|----------|
| H0: Algebra ≤ Polynom gleicher Ordnung | **Nicht verworfen** — E/F nicht besser als A; B2/B3 schlechter auf Test |
| H1: Vorteil nur durch mehr Parameter | **Teilweise gestützt** — B3 mehr Params, schlechter Test-F1 |
| H2: Overfitting synthetische Layouts | **Plausibel** — OOD-F1 teils höher als Test (Familien-Shift), hohe CI-Breite |
| H3: Höhere Momente verschlechtern | **Gestützt** für G und B3 auf Test |
| H4: Kein Nutzen vs Kernel | C auf OOD vergleichbar, auf Test schwächer; **kein klarer Kernel-Dominanz** |
| H5: Semantische Identifizierbarkeit ungelöst | **Bestätigt** — Rollen nur über schwache Layout-Heuristiken trennbar |

---

## Teil 9: Mathematische Bewertung

- **Neuheit:** Konstruktion ist **Standard-Erweiterungsalgebra** mit parametrisiertem \(B\); **keine** neue nicht-triviale Strukturklasse nachgewiesen.
- **Beweisbare Eigenschaften:** Assoziativität, Einheit, explizite Nicht-Kommutativität bei \(d>1\).
- **Identifizierbarkeit gelernter \(B_k\):** nur über Paar-Regression; ohne Rang-/Regularisierungsannahmen **nicht eindeutig**.
- **Invarianz:** keine nichttriviale Translationsinvarianz für absolutes \(B(u,v)\); Invarianz erfordert **Differenz-/quotient features** (klassischer Befund).
- **Geschlossen lösbar:** Ridge für \(B\); LogReg/MLP/KernelRidge konvex bzw. iterative (MLP) — **keine** versteckte LLM-Lösung.

---

## Teil 10: Schlussfrage

**Gibt es einen belastbaren Hinweis, dass eine speziell konstruierte geometrisch-semantische Algebra bei vergleichbarer Rechenkomplexität bessere Generalisierung oder größere Ausdruckskraft bietet als bestehende Verfahren?**

### Antwort: **Nein.**

**Evidenz:** Auf Template-Holdout (Test) schneidet das **handgebaute geometrische Modell A** (macro-F1 ≈ **0.21**) **mindestens so gut oder besser** ab als DIN/Algebra E/F (≈ **0.20**) bei **weniger Features** (9 vs 14) und **gleicher Inferenzgrößenordnung** (~5 ms/Seite). Tensoralgebra G und hohe Polynome liefern **keinen** Vorteil. Assoziativität und „schöne“ Algebra **ersetzen nicht** fehlende semantische Identifikation aus Layout allein.

**Stärkste mathematische Erklärung:** Das Produkt in \(D_B\) ist eine **bilineare Erweiterung** von \(\mathbb{R}^d\)-Merkmalen. Für **elementweise** Klassifikation mit linearem Lesekopf liefert **ein** Nachbarpaar \(B(u_i,u_j)\) **höchstens** dieselbe **quadratische** Information wie explizite Polynom-/Relative-Features — ohne zusätzliche **globale**, **ordnungsabhängige** Verkettung (Sequenzprodukt \(\prod_k d_k\)) bleibt die Ausdruckskraft **beschränkt**. Gelernte \(B_k\) ohne neue Identifikationsbedingungen **kollabieren** zum bekannten geometrischen \(B\) (empirisch F≈E). Höhere truncierte Tensoren ohne gekoppeltes Training **unterperformen** handgemachte Normalisierung + Textstats.

**Präzise neue Forschungsfrage (nur bei nachweisbarer Lücke):**  
*Führt eine **assoziative Seitenkette** \(d_1 \cdots d_n\) in \(D_B\) (Reading-Order-Produkt) mit **gradweise Ridge-Kompression** zu **strikt besserer** OOD-Generalisierung als (i) bag-of-polynomial features und (ii) gleich parametrisierte linearer RNN — bei **fixierter** CPU-Budget-Inferenz pro Seite?*  
**Falsifikator:** macro-F1 OOD auf Template-Holdout **≤** Modell A bei gleicher Parameternorm und p95-Inferenz.

---

## Reproduktion

```bash
cd research/doc_algebra
pip install -e ".[dev]"
pytest -q
python experiments/run_all.py --n-docs 2000 --seeds 42,43,44
```

Artefakte: `results/summary.json`, `results/all_metrics.json`, `results/aggregated.csv`, `results/figures/p1_macro_f1_test.png`.

## Nicht ausgeführte Experimente

- Vollständige **P4 Typst-Layout-Rekonstruktion** und Render-Konsistenz (Typst nicht installiert).
- Mehrseitige Tabellen (Generator unterstützt primär einseitig).
- Kreuz-Bispektren in voller 2D-FFT-Form (Speicher; 1D-Projektion verwendet).
