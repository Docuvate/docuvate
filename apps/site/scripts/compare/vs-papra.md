# Docuvate vs. Papra

> Seitenvorschlag: `/docs/vergleiche/papra` · Stand: 09.10.2026 · Rubrik: [00-rubrik.md](./00-rubrik.md)

Papra ist ein bewusst schlankes Dokumentenarchiv, selbst gehostet oder als Cloud-Dienst. Docuvate setzt stärker auf Erkennung: Felder, Label-Vorschläge und Dokumenten-Chat.

[Selbst hosten](/docs#schnellstart) · [Alle Vergleiche](./01-uebersicht-matrix.md)

## Kurzfazit

**Für wen:** Papra passt zu allen, die ein einfaches, schnelles Archiv wollen, auch ohne eigenen Server. Docuvate passt zu Teams, die aus Dokumenten Daten gewinnen und lokal mit ihnen chatten wollen.

## Vergleich nach Kriterien

✅ vorhanden · 🟡 teilweise / mit Einschränkung · ❌ nicht vorhanden (laut Doku) · ❔ nicht verifiziert

| # | Kriterium | Docuvate | Papra |
|---|---|---|---|
| K1 | Zielgruppe | Teams, Selbständige und Entwickler, die Dokumente selbst hosten und per API anbinden wollen [W1] | Minimalistisches Dokumentenarchiv für Privatpersonen, Familien, kleine Teams [A1] |
| K2 | Lizenz | Sustainable Use License 1.0 (Community, source-available/fair-code): kostenlos für privates und internes betriebliches Self-Hosting; kein Managed-Service/White-Label/Embedding in verkaufte Produkte. Enterprise/Cloud: LICENSE_EE.md [W1] [R1] | AGPL-3.0 [A1] |
| K3 | Betrieb | Nur self-hosted: Docker Compose; Kubernetes (Kustomize/Helm) laut Repo [W2] [R1] | Beides: self-hosted (ein Docker-Image) oder gehostet auf papra.app [A1] [A2] |
| K4 | Kosten | Kostenlos (Community). Keine Preise für kommerzielle Editionen veröffentlicht [W1] [R1] | Self-hosted kostenlos. Cloud: Free 0 $, Plus 9 $/Monat, Pro 30 $/Monat (jährlich günstiger), Enterprise auf Anfrage [A3] |
| K5 | Reife & Pflege | Version 0.1.0; öffentliches Repo seit 08.10.2026; SDKs im Status Preview [R1] [W3] | Aktiv entwickelt; öffentliche Commits und Releases im Oktober 2026 [A6] |
| K6 | OCR | ✅ PaddleOCR (PP-OCRv4, lateinische Schrift inkl. Deutsch) lokal; Text-Layer-PDFs ohne OCR; Tesseract/Docling optional [R2] | ✅ Tesseract (intern, lokal); optional Mistral OCR, Azure Document Intelligence, Docling oder eigener HTTP-Dienst [A4] |
| K7 | Dateiformate | 🟡 PDF und Bilder (JPEG, PNG, TIFF). Office-Dokumente: nicht verifiziert [W1] [R3] | 🟡 Gängige Formate über die Bibliothek lecture; genaue Liste (Office): nicht verifiziert [A4] |
| K8 | Auto-Zuordnung ohne LLM | ✅ Matching-Regeln (any/all/exact/regex) und Label-Vorschläge per Embeddings; Vorschläge werden bestätigt, nicht erzwungen [W1] [R2] | ✅ Tagging-Regeln (regelbasiert) [A1] |
| K9 | LLM-Funktionen & lokale Modelle | 🟡 LLM für Chat (Ollama, Standard qwen2.5:1.5b, CPU, auch ARM64). Tagging nutzt Embeddings, kein LLM. Cloud-LLM-Anbieter nicht vorgesehen [W1] [R2] | ✅ Optional (Standard aus): LLM-Auto-Tagging pro Organisation; OpenAI, Mistral, Anthropic, OpenRouter, DeepSeek, Ollama (lokal) [A5] |
| K10 | Strukturierte Felder | ✅ Vorschläge für Betrag, Datum, Absender plus eigener Feldkatalog; Bestätigung per Klick; Korrekturen werden gespeichert [W1] [R4] | 🟡 Eigene Eigenschaften (Custom Properties) pro Organisation; automatische Feldextraktion: nicht verifiziert [A1] |
| K11 | Chat mit Dokumenten | ✅ Chat pro Dokument und über die ganze Bibliothek, lokal, jede Aussage mit verlinkter Quellpassage [W1] [R2] [R9] | ❔ nicht verifiziert (in der Doku keine Chat-Funktion beschrieben) [A1] [A5] |
| K12 | Suche | ✅ Volltext; laut Repo hybrid mit Tippfehler-Toleranz (pg_trgm) und optionaler semantischer Komponente; Feldfilter wie betrag:12,50 [W1] [R5] | ✅ Volltext mit erweiterten Filtern und Such-Syntax [A1] |
| K13 | Ordnungsmodell | ✅ Farbige Labels, hierarchische Ordner (Mehrfachzuordnung), Korrespondenten, erkannte Felder, Duplikat-Stapel [W4] [R1] | 🟡 Tags, Custom Properties, Organisationen; Ordner-Hierarchie: nicht verifiziert [A1] |
| K14 | Workflows & Automatisierung | 🟡 Feste Verarbeitungs-Pipeline und Matching-Regeln; kein frei konfigurierbarer Workflow-Editor. Webhooks: nicht verifiziert [R4] | 🟡 Tagging-Regeln und Webhooks; kein Workflow-Editor beschrieben [A1] |
| K15 | Import-Quellen | ✅ Upload, Amazon S3, Paperless-ngx, Gmail, Outlook (OAuth), Home Assistant (Ausgabe); SFTP-Scanner-Eingang laut Repo. Überwachter Ordner fehlt noch [W1] [R6] [R7] | ✅ E-Mail-Eingang über generierte Adresse, überwachter Ordner, Upload, CLI, API [A1] |
| K16 | API & SDKs | ✅ REST-API /v1 mit OpenAPI, Service-Schlüssel mit Berechtigungen (ABAC). SDKs Node/TypeScript und Flutter: Preview, noch nicht auf npm/pub.dev [W3] [R1] | ✅ API, offizielles SDK, Webhooks, CLI [A1] [A7] |
| K17 | Mehrbenutzer, Rechte, SSO/2FA | 🟡 Rollen Administrator/Mitglied, Einladungen, Sperren. SSO und 2FA: nicht verifiziert (README nennt E-Mail + Passwort) [R1] [R8] | 🟡 Organisationen mit Rollen (Owner/Member), Plattform-Admin; eigene OAuth2-Anbieter für die Anmeldung konfigurierbar. 2FA: nicht verifiziert [A1] [A8] |
| K18 | Mobile | 🟡 Responsive Weboberfläche. Keine App; Flutter-SDK für eigene Apps (Preview) [W3] | ✅ Responsive Web; Mobile-App (React Native, @papra/mobile 1.1.0). Store-Verfügbarkeit: nicht verifiziert [A1] [A7] |
| K19 | Datenfluss im Standard | ✅ Nein: OCR, Embeddings und Chat laufen lokal; "kein Versand Ihrer Dateien an Drittanbieter" [W1] [R2] | 🟡 Im Standard lokal. Externe OCR- und Cloud-LLM-Anbieter sind opt-in [A4] [A5] |

## Wo Papra stärker ist

- Gehostete Variante mit Free-Plan; kein eigener Server nötig.
- Sehr einfacher Betrieb: ein Docker-Image statt eines Stacks aus mehreren Diensten.
- Offizielles SDK, Webhooks, CLI und eine Mobile-App.
- Freigabe-Links nach außen mit Ablaufdatum und Passwort.
- Mehr OCR-Optionen (Tesseract, Mistral OCR, Azure, Docling, eigener Dienst) und viele LLM-Anbieter fürs Auto-Tagging.

## Wo Docuvate stärker ist

- Strukturierte Felder (Betrag, Datum, Absender) mit Bestätigung.
- Chat pro Dokument mit lokalem Modell; bei Papra ist kein Chat dokumentiert.
- Hierarchische Ordner zusätzlich zu Labels.
- Mehr fertige Quellen: Gmail und Outlook per OAuth, S3, Paperless-ngx, SFTP-Scanner-Eingang.
- Label-Vorschläge ohne LLM (Embeddings), also auch auf schwacher Hardware.

## Wann Sie was wählen sollten

- **Papra wählen, wenn:** Sie wollen das einfachste Archiv, eine Cloud-Option oder eine Mobile-App, und brauchen keine Feldextraktion und keinen Chat.
- **Docuvate wählen, wenn:** Sie wollen Felder, Ordner und Chat lokal, haben einen Server für den Docker-Compose-Stack und nutzen Mail-Postfächer als Quelle.

## Wechsel und Parallelbetrieb

Kein direkter Import zwischen Papra und Docuvate bekannt. Export/Import über Dateien oder die APIs beider Produkte.

## Hinweis

Dieser Vergleich beruht auf öffentlichen Quellen vom 09.10.2026 (siehe [quellen.md](./quellen.md)). Funktionen ändern sich. Wenn etwas nicht mehr stimmt, schreiben Sie an hello@docuvate.de; wir korrigieren es.

**CTA-Block (wie mailtrap.io):** „Docuvate in 10 Minuten testen“ · Button *Selbst hosten* (primär) · *Quellcode auf GitHub* (sekundär)
