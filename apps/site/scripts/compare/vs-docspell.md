# Docuvate vs. Docspell

> Seitenvorschlag: `/docs/vergleiche/docspell` · Stand: 09.10.2026 · Rubrik: [00-rubrik.md](./00-rubrik.md)

Docspell ist ein ausgereifter Dokumenten-Organizer mit klassischem Machine Learning und starker E-Mail-Integration. Docuvate ergänzt Feldvorschläge, Embedding-basierte Labels und lokalen Dokumenten-Chat.

[Selbst hosten](/docs#schnellstart) · [Alle Vergleiche](./01-uebersicht-matrix.md)

## Kurzfazit

**Für wen:** Docspell passt zu Haushalten und kleinen Gruppen, die viel per E-Mail bekommen und Metadaten vorschlagen lassen wollen. Docuvate passt zu Teams, die zusätzlich Felder, Chat und eine moderne API brauchen.

## Vergleich nach Kriterien

✅ vorhanden · 🟡 teilweise / mit Einschränkung · ❌ nicht vorhanden (laut Doku) · ❔ nicht verifiziert

| # | Kriterium | Docuvate | Docspell |
|---|---|---|---|
| K1 | Zielgruppe | Teams, Selbständige und Entwickler, die Dokumente selbst hosten und per API anbinden wollen [W1] | Persönlicher Dokumenten-Organizer für Haushalte, Familien und kleine Gruppen/Firmen [D1] |
| K2 | Lizenz | Sustainable Use License 1.0 (Community, source-available/fair-code): kostenlos für privates und internes betriebliches Self-Hosting; kein Managed-Service/White-Label/Embedding in verkaufte Produkte. Enterprise/Cloud: LICENSE_EE.md [W1] [R1] | AGPL-3.0 [D1] [D3] |
| K3 | Betrieb | Nur self-hosted: Docker Compose; Kubernetes (Kustomize/Helm) laut Repo [W2] [R1] | Self-hosted (Docker Compose, weitere Pakete) [D2] |
| K4 | Kosten | Kostenlos (Community). Keine Preise für kommerzielle Editionen veröffentlicht [W1] [R1] | Kostenlos [D1] |
| K5 | Reife & Pflege | Version 0.1.0; öffentliches Repo seit 08.10.2026; SDKs im Status Preview [R1] [W3] | Letztes Release v0.43.0 vom 15.03.2025; Nightly-Builds und Commits weiterhin (Oktober 2026) [D3] |
| K6 | OCR | ✅ PaddleOCR (PP-OCRv4, lateinische Schrift inkl. Deutsch) lokal; Text-Layer-PDFs ohne OCR; Tesseract/Docling optional [R2] | ✅ Tesseract, lokal; durchsuchbares PDF aus Bildscans [D2] [D4] |
| K7 | Dateiformate | 🟡 PDF und Bilder (JPEG, PNG, TIFF). Office-Dokumente: nicht verifiziert [W1] [R3] | ✅ Viele Formate; ZIP und EML werden entpackt; Konvertierung nach PDF, Original bleibt erhalten [D2] |
| K8 | Auto-Zuordnung ohne LLM | ✅ Matching-Regeln (any/all/exact/regex) und Label-Vorschläge per Embeddings; Vorschläge werden bestätigt, nicht erzwungen [W1] [R2] | ✅ ML/NLP (Stanford CoreNLP) schlägt Korrespondenten, Tags, Datum vor; lernt aus bestehenden Dokumenten [D1] |
| K9 | LLM-Funktionen & lokale Modelle | 🟡 LLM für Chat (Ollama, Standard qwen2.5:1.5b, CPU, auch ARM64). Tagging nutzt Embeddings, kein LLM. Cloud-LLM-Anbieter nicht vorgesehen [W1] [R2] | ❔ nicht verifiziert (keine LLM-Funktionen in Doku/Feature-Liste gefunden) [D1] [D4] |
| K10 | Strukturierte Felder | ✅ Vorschläge für Betrag, Datum, Absender plus eigener Feldkatalog; Bestätigung per Klick; Korrekturen werden gespeichert [W1] [R4] | 🟡 Eigene Felder (Custom Fields); Datumserkennung per NLP; Betrag automatisch: nicht verifiziert [D1] [D4] |
| K11 | Chat mit Dokumenten | ✅ Chat pro Dokument und über die ganze Bibliothek, lokal, jede Aussage mit verlinkter Quellpassage [W1] [R2] [R9] | ❌ Keine Chat-Funktion in der Doku [D2] [D4] |
| K12 | Suche | ✅ Volltext; laut Repo hybrid mit Tippfehler-Toleranz (pg_trgm) und optionaler semantischer Komponente; Feldfilter wie betrag:12,50 [W1] [R5] | ✅ Volltext über PostgreSQL oder Apache SOLR, kombinierbar mit Filtern [D4] |
| K13 | Ordnungsmodell | ✅ Farbige Labels, hierarchische Ordner (Mehrfachzuordnung), Korrespondenten, erkannte Felder, Duplikat-Stapel [W4] [R1] | ✅ Tags mit Kategorien, Ordner, Korrespondenten, Custom Fields [D4] |
| K14 | Workflows & Automatisierung | 🟡 Feste Verarbeitungs-Pipeline und Matching-Regeln; kein frei konfigurierbarer Workflow-Editor. Webhooks: nicht verifiziert [R4] | 🟡 Geplante Abfragen mit Benachrichtigung (E-Mail, Matrix, Gotify), Event-Benachrichtigungen, Add-ons [D2] [D4] |
| K15 | Import-Quellen | ✅ Upload, Amazon S3, Paperless-ngx, Gmail, Outlook (OAuth), Home Assistant (Ausgabe); SFTP-Scanner-Eingang laut Repo. Überwachter Ordner fehlt noch [W1] [R6] [R7] | ✅ IMAP-Import (zeitgesteuert), Watch-Ordner, Upload, Android-Upload-App, CLI [D1] [D2] [D4] |
| K16 | API & SDKs | ✅ REST-API /v1 mit OpenAPI, Service-Schlüssel mit Berechtigungen (ABAC). SDKs Node/TypeScript und Flutter: Preview, noch nicht auf npm/pub.dev [W3] [R1] | 🟡 REST-API, CLI (dsc). Offizielle SDKs: nicht verifiziert [D1] |
| K17 | Mehrbenutzer, Rechte, SSO/2FA | 🟡 Rollen Administrator/Mitglied, Einladungen, Sperren. SSO und 2FA: nicht verifiziert (README nennt E-Mail + Passwort) [R1] [R8] | ✅ Collectives mit mehreren Nutzern; OpenID Connect; 2FA (TOTP) [D2] [D4] [D5] |
| K18 | Mobile | 🟡 Responsive Weboberfläche. Keine App; Flutter-SDK für eigene Apps (Preview) [W3] | 🟡 Mobilfreundliche Web-App; Android-App zum Hochladen [D1] |
| K19 | Datenfluss im Standard | ✅ Nein: OCR, Embeddings und Chat laufen lokal; "kein Versand Ihrer Dateien an Drittanbieter" [W1] [R2] | ✅ Lokal (keine externen KI-Dienste vorgesehen) [D1] [D4] |

## Wo Docspell stärker ist

- Länger im Einsatz, stabile Funktionen für E-Mail: IMAP-Import nach Zeitplan, EML/ZIP entpacken, Versand aus der App.
- Konvertierung aller Dateien in durchsuchbare PDFs, Originale bleiben erhalten.
- OpenID Connect und Zwei-Faktor-Anmeldung dokumentiert.
- Benachrichtigungen über E-Mail, Matrix oder Gotify sowie Add-ons.
- Android-App zum Hochladen.

## Wo Docuvate stärker ist

- Dokumenten-Chat pro Dokument mit lokalem Modell (Docspell: kein Chat).
- Strukturierte Felder mit Ein-Klick-Bestätigung.
- Gmail und Outlook per OAuth, S3, Paperless-ngx als Quellen.
- OpenAPI-basierte API mit Service-Schlüsseln und SDKs (Preview).
- Aktivere Release-Pflege: Docspell hat seit März 2025 kein stabiles Release veröffentlicht (Nightlies laufen).

## Wann Sie was wählen sollten

- **Docspell wählen, wenn:** Sie wollen ein erprobtes System mit starker E-Mail-Verarbeitung und SSO, und Chat oder Feldextraktion sind nicht wichtig.
- **Docuvate wählen, wenn:** Sie wollen Chat, Felder und eine API für eigene Anwendungen, und ein junges Projekt ist für Sie in Ordnung.

## Wechsel und Parallelbetrieb

Kein direkter Import bekannt. Übergang über Dateiexport und Docuvate-Upload oder API.

## Hinweis

Dieser Vergleich beruht auf öffentlichen Quellen vom 09.10.2026 (siehe [quellen.md](./quellen.md)). Funktionen ändern sich. Wenn etwas nicht mehr stimmt, schreiben Sie an hello@docuvate.de; wir korrigieren es.

**CTA-Block (wie mailtrap.io):** „Docuvate in 10 Minuten testen“ · Button *Selbst hosten* (primär) · *Quellcode auf GitHub* (sekundär)
