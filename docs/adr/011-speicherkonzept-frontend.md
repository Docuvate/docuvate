# ADR 011: Speicherkonzept Frontend

## Status

Accepted (2026-03-26)

## Kontext

Das Web-Frontend speicherte persistente Änderungen uneinheitlich (Header-Button, Dialog, Sofort-Speichern, Inline-Fehler). Auf der Seite **Erkannte Felder** wirkte die rechte Karte „Vorgaben für neue Felder“ wie ein Collapsible ohne Nutzen auf Desktop.

## Audit (Ist-Zustand vor Umsetzung)

| Seite / Bereich | Steuerung | Speicherverhalten | Feedback | Ungespeichert-Guard |
| --- | --- | --- | --- | --- |
| Einstellungen | Extraktions-Engine (Select) | Sofort | Inline-Fehler | Nein |
| Einstellungen | Erweiterte Funktionen (Checkbox) | Sofort | Inline-Fehler | Nein |
| Einstellungen | Arena-Sieger (Checkbox) | Sofort | Inline-Fehler | Nein |
| Einstellungen | Chat-Provider (Select) | Sofort | Inline-Fehler | Nein |
| Einstellungen | Blockierte Label-Vorschläge (Phrase + Entfernen) | Sofort (Form / Klick) | Inline-Fehler | Nein |
| Einstellungen | Konto | Abmelden (kein Formular-Speichern) | — | Nein |
| Erkannte Felder | Katalog (Inline-Zeilen) | Seiten-Button „Änderungen speichern“ | Inline-Fehler, Dirty-Hinweis | Nein |
| Erkannte Felder | Vorgaben für neue Felder | Seiten-Button (gebündelt) | wie oben | Nein |
| Labels | Editor-Karte (Anlegen/Bearbeiten) | Submit in Karte | Inline-Fehler | Nein |
| Labels | Todo-Warteschlange (Annehmen/Verwerfen) | Sofort | Inline-Fehler | Nein |
| Labels | Vokabel-Tabelle (Löschen) | Sofort | Inline-Fehler | Nein |
| Connectors | Verbinden-Dialog | Dialog bestätigen | Inline-Fehler | Nein |
| Connectors | Trennen | Bestätigungsdialog | Inline-Fehler | Nein |
| Dokument-Detail | Metadaten (Titel, Datum, Notizen, Ordner) | Formular-Button | Inline-Fehler | Nein |
| Dokument-Detail | Extrahierte Felder | Button „Korrekturen speichern“ | Inline + Zähler | Nein |
| Dokument-Detail | Extraktions-Blöcke (Bearbeiten) | Button in Sektion | Inline-Fehler | Nein |
| Dokument-Detail | Labels (Chips, Hinzufügen) | Sofort | Inline-Fehler | Nein |
| Dateisystem | Ordner anlegen / umbenennen | Dialog / Inline-Submit | Inline-Fehler | Nein |
| Bibliothek | Suche, Filter, Upload | Kein persistenter Form-Save | — | Nein |
| Auth (Login, Register, …) | Formulare | Submit (Session) | Inline | Nein |
| Admin (eigene Route) | — | Nicht im Haupt-Shell-Routing | — | — |

## Entscheidung

### 1. Diskrete Aktionen → sofort speichern

Gilt für: Schalter, Selects in Listen-Kontext, Löschen (mit Bestätigung), Drag-and-Drop, Dialog **Speichern** / **Übernehmen** (Commit schließt den Dialog; kein zweiter Seiten-Save).

Feedback: kurzer Toast **„Gespeichert“** (lokalisiert) oder Inline-Bestätigung; bei Fehler lokalisierte Meldung mit **Erneut versuchen**, wo sinnvoll. Optimistic UI nur mit Rollback.

### 2. Seitenformulare mit mehreren Freitext-/Zahl-Feldern → `SaveBar`

Ein gemeinsames Muster: **`SaveBar`** nur bei `dirty`, fixiert als Overlay am unteren Rand des Inhaltsbereichs (kein Layout-Shift), Aktionen **Änderungen verwerfen** und **Speichern**, während Speichern deaktiviert mit Fortschrittstext, Erfolg/Fehler lokalisiert. **Keine Header-Speichern-Buttons** mehr für diese Formulare.

Zusätzlich: Ungespeichert-Guard bei In-App-Navigation (`useBlocker`) und `beforeunload`; **Cmd/Ctrl+S** speichert, wenn dirty.

### 3. Shared Building Blocks

| Baustein | Rolle |
| --- | --- |
| `useFormDraft` | Draft vs. Baseline, `dirty`, `discard`, `commit` |
| `SaveBar` | Overlay-UI |
| `PageFormSaveKit` | SaveBar + Guard + Tastenkürzel |
| `useUnsavedChangesGuard` | Blocker + beforeunload |
| `ToastProvider` / `notifySaved` | Einheitliches Erfolgs-/Fehler-Feedback |

Seiten binden diese Bausteine ein; keine duplizierte Dirty-/Guard-Logik.

### 4. Erkannte Felder

- Katalog: Bearbeitung im **Dialog**, Speichern im Dialog → sofort persistieren (diskret).
- **Vorgaben für neue Felder**: dauerhaft sichtbare rechte Spalte (kein `<details>`), **`SaveBar`** für Einstellungen.

## Umsetzung (Soll)

| Seite / Bereich | Soll-Verhalten |
| --- | --- |
| Erkannte Felder – Katalog | Dialog-Speichern + Toast |
| Erkannte Felder – Vorgaben | SaveBar + Guard |
| Dokument-Metadaten | SaveBar + Guard + Toast |
| Dokument – Felder/Blöcke | Diskret (Button) + Toast |
| Einstellungen – Toggles/Selects | Sofort + Toast |
| Blockliste, Labels, Connectors | Sofort + Toast |
| Label-Editor-Karte | Dialog-ähnlicher Commit + Toast |

## Abweichungen

Keine geplant. Änderungen am Muster nur mit Begründung in dieser ADR.

## Koordination mit offenen PRs

Nach Merge von Settings-Cleanup, Admin und Theming: neue oder umgebaute Settings-/Admin-Formulare mit Freitext müssen `PageFormSaveKit` + `useFormDraft` übernehmen; diskrete Controls erhalten Toast-Feedback.

**Theming / Appearance:** Die Erscheinungsbild-Seite soll **`PageFormSaveKit`** + **`page--with-save-bar`** nutzen, nicht eine eigene Save-Leiste. Prop-Namen und Semantik von `SaveBar` / `PageFormSaveKit` stabil halten; siehe `apps/web/src/components/save/README.md`.

## Component API (Kurzreferenz)

Vollständige Integration: **`apps/web/src/components/save/README.md`**.

- **`PageFormSaveKit`**: `{ dirty, saving, error?, onSave, onDiscard }` — bevorzugter Einstieg (Bar + Guard + Cmd/Ctrl+S).
- **`SaveBar`**: `{ visible, saving, error?, onSave, onDiscard }` — nur Overlay-UI; Position über `--save-bar-left` / `--save-bar-width`.
- **`useFormDraft(baseline)`**: Draft/Baseline, `dirty`, `discard`, `commit`.
- **`notifySaved` / `notifySaveError`**: Toasts (via `ToastProvider` in `AppShell`).

## Konsequenzen

- Positiv: vorhersehbares Speichern, weniger verpasste Saves, bessere Erkannte-Felder-UX.
- Router: `RouterProvider` (`createBrowserRouter`) für `useBlocker`.
- Tests: Unit-Tests für Hook/Guard, Komponententest für `SaveBar`.
