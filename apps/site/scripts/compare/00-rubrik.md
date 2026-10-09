# Vergleichs-Rubrik (verbindlich für alle Vergleiche)

Stand der Recherche: 09.10.2026. Diese Datei ist die einzige Quelle für die Kriterien. Jede Vergleichsseite und die Übersichtsmatrix verwenden **genau diese Kriterien in genau dieser Reihenfolge**. Unbekanntes wird als **nicht verifiziert** eingetragen, nie weggelassen.

## Kriterien

| # | Kriterium | Was wird bewertet |
|---|---|---|
| K1 | Zielgruppe | Für wen das Produkt laut eigener Aussage gebaut ist. |
| K2 | Lizenz | Lizenz des Kerns laut LICENSE-Datei bzw. Hersteller. |
| K3 | Betrieb | Self-hosted, Cloud (SaaS) oder beides; offizielle Deployment-Wege. |
| K4 | Kosten | Öffentliche Preise. Ohne Listenpreis: "auf Anfrage". |
| K5 | Reife & Pflege | Aktuelle Version mit Datum, sichtbare Projektaktivität. |
| K6 | OCR | Texterkennung für Scans/Bilder: Engine, lokal oder extern. |
| K7 | Dateiformate | Welche Formate verarbeitet werden (PDF, Bilder, Office, E-Mail). |
| K8 | Auto-Zuordnung ohne LLM | Regeln oder klassisches ML für Tags/Typen/Korrespondenten. |
| K9 | LLM-Funktionen & lokale Modelle | Sprachmodell-Funktionen (Tagging, Extraktion, Zusammenfassung) und ob lokal (z. B. Ollama) möglich. |
| K10 | Strukturierte Felder | Automatisch vorgeschlagene Werte wie Betrag, Datum, Absender; eigene Felder. |
| K11 | Chat mit Dokumenten | Fragen in natürlicher Sprache, Antworten aus dem Dokumenttext (RAG): pro Dokument oder über das Archiv. |
| K12 | Suche | Volltext, Tippfehler-Toleranz, semantische Suche. |
| K13 | Ordnungsmodell | Tags/Labels, Ordner, Dokumenttypen, Korrespondenten, eigene Felder. |
| K14 | Workflows & Automatisierung | Regelbasierte Abläufe, Freigaben, Webhooks. |
| K15 | Import-Quellen | E-Mail, Ordner/Scanner, Cloud-Speicher, andere DMS. |
| K16 | API & SDKs | Offene API, Spezifikation, offizielle Client-Bibliotheken. |
| K17 | Mehrbenutzer, Rechte, SSO/2FA | Rollen, Rechte pro Objekt, Single Sign-on, Zwei-Faktor. |
| K18 | Mobile | Responsive Web, offizielle oder Community-Apps. |
| K19 | Datenfluss im Standard | Verlassen Dokumentinhalte im Standard-Setup den eigenen Server? |

## Bewertungsskala

✅ vorhanden · 🟡 teilweise / mit Einschränkung · ❌ nicht vorhanden (laut Doku) · ❔ nicht verifiziert

K1 bis K5 sind beschreibend (kein Symbol). Bei K19 bedeutet ✅: Inhalte bleiben im Standard auf dem eigenen Server; 🟡: lokal, aber Cloud-Dienste sind zuschaltbar bzw. Cloud-Betrieb ist der Normalfall.

## Regeln für Belege

1. Jede Zelle hat mindestens eine Quelle (Kürzel in eckigen Klammern, aufgelöst in `quellen.md`).
2. Nur offizielle Quellen: Hersteller-Website, offizielle Doku, offizielles Repository/LICENSE, Preisseite. Drittquellen nur, wenn ausdrücklich so markiert.
3. Docuvate selbst wird nur aus docuvate.de [W*] und dem öffentlichen Repo github.com/Docuvate/docuvate [R*] bewertet. Was nur im Repo steht, ist auf der Website noch nicht beworben; vor Veröffentlichung abgleichen.
4. Optionale Funktionen (Standard aus) werden als vorhanden gezählt, der Zusatz "optional" steht im Text.
5. Vor jeder Veröffentlichung und danach quartalsweise neu prüfen (Datum oben aktualisieren). Wettbewerber können Korrekturen über hello@docuvate.de melden.
6. Keine Wertungen wie "besser/schlechter" in Tabellenzellen. Wertungen nur in den Abschnitten "Wo X stärker ist" und "Wo Docuvate stärker ist", und dort immer beidseitig.
