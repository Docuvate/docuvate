# Docuvate vs. DocuWare

> Seitenvorschlag: `/docs/vergleiche/docuware` · Stand: 09.10.2026 · Rubrik: [00-rubrik.md](./00-rubrik.md)

DocuWare ist eine kommerzielle DMS- und Workflow-Plattform für Unternehmen, vor allem als Cloud-Dienst. Docuvate ist source-available (fair-code) und läuft nur auf Ihrer eigenen Infrastruktur.

[Selbst hosten](/docs#schnellstart) · [Alle Vergleiche](./01-uebersicht-matrix.md)

## Kurzfazit

**Für wen:** DocuWare passt zu Unternehmen, die einen Anbieter mit Vertrag, Support, Workflows und Integrationen wie SAP suchen. Docuvate passt zu Teams, die Kontrolle über Daten und Kosten wollen und selbst betreiben können.

## Vergleich nach Kriterien

✅ vorhanden · 🟡 teilweise / mit Einschränkung · ❌ nicht vorhanden (laut Doku) · ❔ nicht verifiziert

| # | Kriterium | Docuvate | DocuWare |
|---|---|---|---|
| K1 | Zielgruppe | Teams, Selbständige und Entwickler, die Dokumente selbst hosten und per API anbinden wollen [W1] | Unternehmen (KMU bis Konzern) mit Dokumenten-Workflows, z. B. Rechnungseingang, Personalakten [X1] |
| K2 | Lizenz | Sustainable Use License 1.0 (Community, source-available/fair-code): kostenlos für privates und internes betriebliches Self-Hosting; kein Managed-Service/White-Label/Embedding in verkaufte Produkte. Enterprise/Cloud: LICENSE_EE.md [W1] [R1] | Proprietär [X1] |
| K3 | Betrieb | Nur self-hosted: Docker Compose; Kubernetes (Kustomize/Helm) laut Repo [W2] [R1] | DocuWare Cloud oder On-Premises (laut Hersteller) [X1] |
| K4 | Kosten | Kostenlos (Community). Keine Preise für kommerzielle Editionen veröffentlicht [W1] [R1] | Auf Anfrage; Hersteller nennt typisch 30 bis 125+ US-$ pro Nutzer/Monat. Cloud-Pakete 4/15/40/100 Nutzer. IDP volumenbasiertes Add-on [X1] [X2] [X3] |
| K5 | Reife & Pflege | Version 0.1.0; öffentliches Repo seit 08.10.2026; SDKs im Status Preview [R1] [W3] | Etabliertes Produkt; neue Oberfläche ab Mitte Oktober 2026 mit Version 7.15 (Cloud zuerst) [X5] |
| K6 | OCR | ✅ PaddleOCR (PP-OCRv4, lateinische Schrift inkl. Deutsch) lokal; Text-Layer-PDFs ohne OCR; Tesseract/Docling optional [R2] | ✅ OCR enthalten; IDP-Add-on mit Handschrifterkennung (HTR). Verarbeitung in der Cloud oder on-prem [X3] [X5] |
| K7 | Dateiformate | 🟡 PDF und Bilder (JPEG, PNG, TIFF). Office-Dokumente: nicht verifiziert [W1] [R3] | ❔ nicht verifiziert (Formatliste nicht geprüft) |
| K8 | Auto-Zuordnung ohne LLM | ✅ Matching-Regeln (any/all/exact/regex) und Label-Vorschläge per Embeddings; Vorschläge werden bestätigt, nicht erzwungen [W1] [R2] | ✅ Intelligent Indexing in allen Cloud-Paketen; IDP-Klassifizierung als Add-on [X1] [X3] |
| K9 | LLM-Funktionen & lokale Modelle | 🟡 LLM für Chat (Ollama, Standard qwen2.5:1.5b, CPU, auch ARM64). Tagging nutzt Embeddings, kein LLM. Cloud-LLM-Anbieter nicht vorgesehen [W1] [R2] | ✅ DocuWare Aura: Zusammenfassungen, Schlüsselinformationen, Dokumentvergleich per natürlicher Sprache. Lokale Modelle: nicht vorgesehen/nicht verifiziert [X5] |
| K10 | Strukturierte Felder | ✅ Vorschläge für Betrag, Datum, Absender plus eigener Feldkatalog; Bestätigung per Klick; Korrekturen werden gespeichert [W1] [R4] | ✅ IDP extrahiert Daten inkl. Einzelpositionen und Tabellen (Add-on) [X3] |
| K11 | Chat mit Dokumenten | ✅ Chat pro Dokument und über die ganze Bibliothek, lokal, jede Aussage mit verlinkter Quellpassage [W1] [R2] [R9] | 🟡 Fragen in natürlicher Sprache über Aura beschrieben; Umfang (Archiv-RAG): nicht verifiziert [X5] |
| K12 | Suche | ✅ Volltext; laut Repo hybrid mit Tippfehler-Toleranz (pg_trgm) und optionaler semantischer Komponente; Feldfilter wie betrag:12,50 [W1] [R5] | ✅ Volltextsuche in allen Cloud-Plänen [X2] |
| K13 | Ordnungsmodell | ✅ Farbige Labels, hierarchische Ordner (Mehrfachzuordnung), Korrespondenten, erkannte Felder, Duplikat-Stapel [W4] [R1] | ✅ Aktenschränke mit Indexfeldern, Versionen, Zugriffsrechte [X2] [X6] |
| K14 | Workflows & Automatisierung | 🟡 Feste Verarbeitungs-Pipeline und Matching-Regeln; kein frei konfigurierbarer Workflow-Editor. Webhooks: nicht verifiziert [R4] | ✅ Workflow Manager und Formulare in allen Cloud-Paketen [X1] [X2] |
| K15 | Import-Quellen | ✅ Upload, Amazon S3, Paperless-ngx, Gmail, Outlook (OAuth), Home Assistant (Ausgabe); SFTP-Scanner-Eingang laut Repo. Überwachter Ordner fehlt noch [W1] [R6] [R7] | 🟡 Integrationen u. a. SAP (Add-on); weitere Konnektoren: nicht verifiziert [X2] |
| K16 | API & SDKs | ✅ REST-API /v1 mit OpenAPI, Service-Schlüssel mit Berechtigungen (ABAC). SDKs Node/TypeScript und Flutter: Preview, noch nicht auf npm/pub.dev [W3] [R1] | ✅ REST-API (OAuth2) und .NET-SDK [X6] |
| K17 | Mehrbenutzer, Rechte, SSO/2FA | 🟡 Rollen Administrator/Mitglied, Einladungen, Sperren. SSO und 2FA: nicht verifiziert (README nennt E-Mail + Passwort) [R1] [R8] | ✅ Mehrbenutzer mit Zugriffsrechten; Identity Service mit OAuth2/OIDC. Details SSO/2FA: nicht verifiziert [X2] [X6] |
| K18 | Mobile | 🟡 Responsive Weboberfläche. Keine App; Flutter-SDK für eigene Apps (Preview) [W3] | ✅ Offizielle Mobile-App [X5] |
| K19 | Datenfluss im Standard | ✅ Nein: OCR, Embeddings und Chat laufen lokal; "kein Versand Ihrer Dateien an Drittanbieter" [W1] [R2] | 🟡 Cloud: Dokumente liegen beim Anbieter. On-Premises möglich; ob IDP/Aura on-prem voll verfügbar sind: nicht verifiziert [X1] [X3] [X5] |

## Wo DocuWare stärker ist

- Vollständige Unternehmensplattform: Workflow Manager, Formulare, Integrationen (z. B. SAP), Mobile-App.
- Intelligent Document Processing mit Handschrifterkennung, Einzelpositionen und Tabellen.
- Herstellersupport, Partnernetz, Verträge; ISO/SOC-Zertifizierungen: nicht verifiziert (keine belastbare DocuWare-Quelle im Review).
- Betrieb ohne eigenes IT-Team möglich (Cloud).

## Wo Docuvate stärker ist

- Source-available (SUL 1.0) ohne Lizenzgebühr pro Nutzer für Self-Hosting auf eigener Infrastruktur.
- Daten und KI bleiben auf Ihrer Hardware; keine Cloud nötig.
- Offene API mit OpenAPI-Spezifikation und SDKs; Sie können den Code prüfen und anpassen.
- Schnell testbar: docker compose up statt Vertriebsgespräch.

## Wann Sie was wählen sollten

- **DocuWare wählen, wenn:** Sie brauchen bewährte Workflows, Compliance-Nachweise des Anbieters, Support mit SLA oder SAP-Integration, und Cloud-Betrieb ist für Sie in Ordnung.
- **Docuvate wählen, wenn:** Sie wollen Daten im eigenen Haus, keine Nutzerlizenzen, und die Kernfunktionen Ablage, Erkennung, Suche und Chat reichen.

## Wechsel und Parallelbetrieb

Kein direkter Import bekannt.

## Hinweis

Dieser Vergleich beruht auf öffentlichen Quellen vom 09.10.2026 (siehe [quellen.md](./quellen.md)). Funktionen ändern sich. Wenn etwas nicht mehr stimmt, schreiben Sie an hello@docuvate.de; wir korrigieren es.

**CTA-Block (wie mailtrap.io):** „Docuvate in 10 Minuten testen“ · Button *Selbst hosten* (primär) · *Quellcode auf GitHub* (sekundär)
