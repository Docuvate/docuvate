# Docuvate vs. Paperless-ngx

> Seitenvorschlag: `/docs/vergleiche/paperless-ngx` · Stand: 09.10.2026 · Rubrik: [00-rubrik.md](./00-rubrik.md)

Paperless-ngx ist das bekannteste selbst gehostete Dokumentenarchiv und seit Jahren der Standard. Docuvate ist neu und verfolgt einen anderen Schwerpunkt: strukturierte Felder, API-first-Integration und eine Architektur mit PostgreSQL und S3-Speicher.

[Selbst hosten](/docs#schnellstart) · [Alle Vergleiche](./01-uebersicht-matrix.md)

## Kurzfazit

**Für wen:** Paperless-ngx passt zu allen, die Papier zuverlässig digitalisieren und ein ausgereiftes, breit unterstütztes Archiv wollen. Docuvate richtet sich an Teams und Entwickler, die erkannte Felder bestätigen und Dokumente per API in eigene Systeme einbinden wollen.

## Vergleich nach Kriterien

✅ vorhanden · 🟡 teilweise / mit Einschränkung · ❌ nicht vorhanden (laut Doku) · ❔ nicht verifiziert

| # | Kriterium | Docuvate | Paperless-ngx |
|---|---|---|---|
| K1 | Zielgruppe | Teams, Selbständige und Entwickler, die Dokumente selbst hosten und per API anbinden wollen [W1] | Privatpersonen, Haushalte, kleine Büros: Papier scannen, durchsuchbar archivieren [P1] |
| K2 | Lizenz | AGPL-3.0 (Community). Kommerzielle Editionen werden im README erwähnt, Inhalte/Preise nicht veröffentlicht [W1] [R1] | GPL-3.0 [P1] |
| K3 | Betrieb | Nur self-hosted: Docker Compose; Kubernetes (Kustomize/Helm) laut Repo [W2] [R1] | Self-hosted (Docker Compose, Installationsskript). Kein offizielles Cloud-Angebot; Drittanbieter-Hosting laut Community-Wiki [P1] [P5] |
| K4 | Kosten | Kostenlos (Community). Keine Preise für kommerzielle Editionen veröffentlicht [W1] [R1] | Kostenlos [P1] |
| K5 | Reife & Pflege | Version 0.1.0; öffentliches Repo seit 08.10.2026; SDKs im Status Preview [R1] [W3] | Sehr reif, große Community (~46.000 GitHub-Sterne); v3.3.0 vom 06.10.2026 [P1] [P6] |
| K6 | OCR | ✅ PaddleOCR (PP-OCRv4, lateinische Schrift inkl. Deutsch) lokal; Text-Layer-PDFs ohne OCR; Tesseract/Docling optional [R2] | ✅ Tesseract, über 100 Sprachen, lokal; optional Remote-OCR über Azure AI (opt-in) [P2] |
| K7 | Dateiformate | 🟡 PDF und Bilder (JPEG, PNG, TIFF). Office-Dokumente: nicht verifiziert [W1] [R3] | ✅ PDF, Bilder, Text, Office (Word, Excel, PowerPoint, LibreOffice) und E-Mails via optionalem Apache Tika; Archivierung als PDF/A [P2] |
| K8 | Auto-Zuordnung ohne LLM | ✅ Matching-Regeln (any/all/exact/regex) und Label-Vorschläge per Embeddings; Vorschläge werden bestätigt, nicht erzwungen [W1] [R2] | ✅ Klassisches ML (ohne LLM) schlägt Tags, Korrespondenten, Dokumenttypen, Speicherpfade vor; Matching-Regeln [P2] [P3] |
| K9 | LLM-Funktionen & lokale Modelle | 🟡 LLM nur für den Chat (Ollama, Standard qwen2.5:3b, CPU). Tagging nutzt Embeddings, kein LLM. Cloud-LLM-Anbieter nicht vorgesehen [W1] [R2] | ✅ Optional (Standard aus): LLM-Vorschläge für Titel, Datum, Tags u. a.; Backends Ollama (lokal) oder OpenAI-kompatibel; als Workflow-Aktion automatisierbar [P3] [P4] |
| K10 | Strukturierte Felder | ✅ Vorschläge für Betrag, Datum, Absender plus eigener Feldkatalog; Bestätigung per Klick; Korrekturen werden gespeichert [W1] [R4] | 🟡 Eigene Felder (Custom Fields) mit Datentypen, Werte manuell. Automatische Feldwerte wie Betrag: nicht verifiziert [P3] |
| K11 | Chat mit Dokumenten | 🟡 Chat pro Dokument (RAG über den erkannten Text, lokal). Chat über das gesamte Archiv: nicht vorhanden [W1] [R2] | ✅ Optional: Chat pro Dokument und über mehrere Dokumente (RAG mit LLM-Index) [P3] |
| K12 | Suche | ✅ Volltext; laut Repo hybrid mit Tippfehler-Toleranz (pg_trgm) und optionaler semantischer Komponente; Feldfilter wie betrag:12,50 [W1] [R5] | ✅ Volltext mit Autovervollständigung, Relevanz, Hervorhebung, "More like this"; mit KI zusätzlich Ähnlichkeitssuche [P2] [P3] |
| K13 | Ordnungsmodell | ✅ Farbige Labels, hierarchische Ordner (Mehrfachzuordnung), Korrespondenten, erkannte Felder, Duplikat-Stapel [W4] [R1] | ✅ Tags, Korrespondenten, Dokumenttypen, Speicherpfade, Custom Fields, gespeicherte Ansichten, Versionen [P2] |
| K14 | Workflows & Automatisierung | 🟡 Feste Verarbeitungs-Pipeline und Matching-Regeln; kein frei konfigurierbarer Workflow-Editor. Webhooks: nicht verifiziert [R4] | ✅ Workflow-System mit Auslösern und Aktionen (inkl. KI-Vorschläge anwenden) [P2] [P3] |
| K15 | Import-Quellen | ✅ Upload, Amazon S3, Paperless-ngx, Gmail, Outlook (OAuth), Home Assistant (Ausgabe); SFTP-Scanner-Eingang laut Repo. Überwachter Ordner fehlt noch [W1] [R6] [R7] | ✅ Consume-Ordner, mehrere E-Mail-Konten mit Regeln (IMAP, OAuth für Gmail/Outlook), Upload, API [P2] [P3] |
| K16 | API & SDKs | ✅ REST-API /v1 mit OpenAPI, Service-Schlüssel mit Berechtigungen (ABAC). SDKs Node/TypeScript und Flutter: Preview, noch nicht auf npm/pub.dev [W3] [R1] | 🟡 REST-API. Offizielle SDKs: keine; Community-Clients laut Wiki [P5] |
| K17 | Mehrbenutzer, Rechte, SSO/2FA | 🟡 Rollen Administrator/Mitglied, Einladungen, Sperren. SSO und 2FA: nicht verifiziert (README nennt E-Mail + Passwort) [R1] [R8] | ✅ Mehrbenutzer mit globalen und objektbezogenen Rechten, OIDC/Social Login (django-allauth), 2FA (TOTP) [P2] [P3] [P4] |
| K18 | Mobile | 🟡 Responsive Weboberfläche. Keine App; Flutter-SDK für eigene Apps (Preview) [W3] | 🟡 Responsive Web; keine offizielle App, viele Community-Apps (iOS/Android) laut Wiki [P5] |
| K19 | Datenfluss im Standard | ✅ Nein: OCR, Embeddings und Chat laufen lokal; "kein Versand Ihrer Dateien an Drittanbieter" [W1] [R2] | 🟡 Im Standard lokal. Remote-OCR (Azure) und Cloud-LLMs sind opt-in und senden dann Inhalte an den Anbieter [P2] [P4] |

## Wo Paperless-ngx stärker ist

- Reife und Community: viele Jahre Betrieb, sehr große Nutzerbasis, viele Anleitungen und Drittanbieter-Apps.
- Mehr Formate: Office-Dokumente und E-Mails (über Apache Tika), Archivierung als PDF/A, über 100 OCR-Sprachen.
- Workflow-System, Consume-Ordner, E-Mail-Regeln für mehrere Konten.
- Chat über mehrere Dokumente (optional, mit LLM-Index). Docuvate chattet nur pro Dokument.
- Objektbezogene Rechte, OIDC-Login und Zwei-Faktor-Anmeldung sind dokumentiert.

## Wo Docuvate stärker ist

- Strukturierte Felder (Betrag, Datum, Absender) werden ohne LLM vorgeschlagen und mit einem Klick bestätigt; Korrekturen werden für spätere Verbesserungen gespeichert.
- API-first: OpenAPI-Spezifikation, Service-Schlüssel mit feingranularen Berechtigungen (ABAC), SDKs für Node und Flutter (Preview).
- Architektur für Skalierung: PostgreSQL, S3-kompatibler Speicher (MinIO) und Kubernetes-Manifeste (Kustomize/Helm) im Repo.
- KI im Standard vollständig lokal und CPU-tauglich (PaddleOCR, Embeddings, Ollama); kein Cloud-Anbieter nötig.
- Tippfehler-tolerante Suche und Feldfilter wie betrag:12,50.

## Wann Sie was wählen sollten

- **Paperless-ngx wählen, wenn:** Sie wollen ein bewährtes Archiv mit großer Community, brauchen Office/E-Mail-Verarbeitung, Workflows oder Chat über das ganze Archiv, oder Ihnen ist Stabilität wichtiger als neue Funktionen.
- **Docuvate wählen, wenn:** Sie brauchen bestätigte Feldwerte für Buchhaltung oder Backoffice, wollen Dokumente headless per API in eigene Anwendungen bringen oder auf PostgreSQL/S3/Kubernetes betreiben, und Sie können mit einem jungen Projekt (0.1.0) leben.

## Wechsel und Parallelbetrieb

Docuvate hat eine Paperless-ngx-Verbindung (Import aus bestehenden Ablagen). Ein vollständiger Migrationsadapter steht laut Roadmap noch aus. Beide können parallel laufen.

## Hinweis

Dieser Vergleich beruht auf öffentlichen Quellen vom 09.10.2026 (siehe [quellen.md](./quellen.md)). Funktionen ändern sich. Wenn etwas nicht mehr stimmt, schreiben Sie an hello@docuvate.de; wir korrigieren es.

**CTA-Block (wie mailtrap.io):** „Docuvate in 10 Minuten testen“ · Button *Selbst hosten* (primär) · *Quellcode auf GitHub* (sekundär)
