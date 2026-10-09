# Docuvate vs. Mayan EDMS

> Seitenvorschlag: `/docs/vergleiche/mayan-edms` · Stand: 09.10.2026 · Rubrik: [00-rubrik.md](./00-rubrik.md)

Mayan EDMS ist ein umfangreiches Open-Source-DMS für Organisationen mit Prozessen, Rechten und Compliance-Anforderungen. Docuvate ist deutlich schlanker und auf Erkennung und schnelle Ablage ausgerichtet.

[Selbst hosten](/docs#schnellstart) · [Alle Vergleiche](./01-uebersicht-matrix.md)

## Kurzfazit

**Für wen:** Mayan passt zu Organisationen, die Workflows, Aufbewahrung, Signaturen und feine Rechte brauchen. Docuvate passt zu kleineren Teams, die schnell starten und Dokumente vor allem finden, auswerten und per API nutzen wollen.

## Vergleich nach Kriterien

✅ vorhanden · 🟡 teilweise / mit Einschränkung · ❌ nicht vorhanden (laut Doku) · ❔ nicht verifiziert

| # | Kriterium | Docuvate | Mayan EDMS |
|---|---|---|---|
| K1 | Zielgruppe | Teams, Selbständige und Entwickler, die Dokumente selbst hosten und per API anbinden wollen [W1] | Organisationen jeder Größe mit Bedarf an DMS-Prozessen (Behörden, Industrie, Forschung) [M1] |
| K2 | Lizenz | AGPL-3.0 (Community). Kommerzielle Editionen werden im README erwähnt, Inhalte/Preise nicht veröffentlicht [W1] [R1] | GPL-2.0; Name/Logo als Marke geschützt [M3] |
| K3 | Betrieb | Nur self-hosted: Docker Compose; Kubernetes (Kustomize/Helm) laut Repo [W2] [R1] | Self-hosted (Docker Compose, VM, Hardware, Cloud); kommerzieller Support durch Mayan EDMS LLC [M1] [M2] |
| K4 | Kosten | Kostenlos (Community). Keine Preise für kommerzielle Editionen veröffentlicht [W1] [R1] | Software kostenlos; Support-/Service-Pakete kostenpflichtig (Preise auf Anfrage/nicht verifiziert) [M1] |
| K5 | Reife & Pflege | Version 0.1.0; öffentliches Repo seit 08.10.2026; SDKs im Status Preview [R1] [W3] | Sehr reif (seit 2010); v4.12.2 vom 16.09.2026 [M1] [M4] |
| K6 | OCR | ✅ PaddleOCR (PP-OCRv4, lateinische Schrift inkl. Deutsch) lokal; Text-Layer-PDFs ohne OCR; Tesseract/Docling optional [R2] | ✅ Tesseract (austauschbares Backend), verteilbar auf mehrere Worker, sprachabhängig [M2] |
| K7 | Dateiformate | 🟡 PDF und Bilder (JPEG, PNG, TIFF). Office-Dokumente: nicht verifiziert [W1] [R3] | ✅ PDF, Office-Text-Layer, Bilder; Archive optional entpacken; Datei-Metadaten (EXIF, GPS) [M2] |
| K8 | Auto-Zuordnung ohne LLM | ✅ Matching-Regeln (any/all/exact/regex) und Label-Vorschläge per Embeddings; Vorschläge werden bestätigt, nicht erzwungen [W1] [R2] | 🟡 Dokumenttypen, Metadaten, Smart Links, Indizes; Zuordnung regel-/typbasiert, klassisches ML nicht beschrieben [M2] |
| K9 | LLM-Funktionen & lokale Modelle | 🟡 LLM nur für den Chat (Ollama, Standard qwen2.5:3b, CPU). Tagging nutzt Embeddings, kein LLM. Cloud-LLM-Anbieter nicht vorgesehen [W1] [R2] | ✅ Integration mit OpenAI und Ollama (lokal): Zusammenfassen, Klassifizieren, strukturierte Extraktion, semantische Suche; Ausgaben steuern Workflows [M2] |
| K10 | Strukturierte Felder | ✅ Vorschläge für Betrag, Datum, Absender plus eigener Feldkatalog; Bestätigung per Klick; Korrekturen werden gespeichert [W1] [R4] | ✅ Metadatentypen pro Dokumenttyp; strukturierte Extraktion per LLM [M2] |
| K11 | Chat mit Dokumenten | 🟡 Chat pro Dokument (RAG über den erkannten Text, lokal). Chat über das gesamte Archiv: nicht vorhanden [W1] [R2] | ❔ nicht verifiziert (Prompts/semantische Suche beschrieben, Chat-Oberfläche nicht) [M2] |
| K12 | Suche | ✅ Volltext; laut Repo hybrid mit Tippfehler-Toleranz (pg_trgm) und optionaler semantischer Komponente; Feldfilter wie betrag:12,50 [W1] [R5] | ✅ Volltext; semantische Suche über OpenAI-Integration [M2] |
| K13 | Ordnungsmodell | ✅ Farbige Labels, hierarchische Ordner (Mehrfachzuordnung), Korrespondenten, erkannte Felder, Duplikat-Stapel [W4] [R1] | ✅ Dokumenttypen, Metadaten, Tags, Kabinette/Indizes, Versionierung, Verknüpfungen [M2] |
| K14 | Workflows & Automatisierung | 🟡 Feste Verarbeitungs-Pipeline und Matching-Regeln; kein frei konfigurierbarer Workflow-Editor. Webhooks: nicht verifiziert [R4] | ✅ Ausgereifte Workflow-Engine (Zustände, Übergänge, Eskalation, Aktionen), Aufbewahrungsrichtlinien, Signaturen [M2] |
| K15 | Import-Quellen | ✅ Upload, Amazon S3, Paperless-ngx, Gmail, Outlook (OAuth), Home Assistant (Ausgabe); SFTP-Scanner-Eingang laut Repo. Überwachter Ordner fehlt noch [W1] [R6] [R7] | ✅ Watch-/Staging-Ordner, IMAP/POP3, Cloud-Objektspeicher, SANE-Scanner, Upload [M2] |
| K16 | API & SDKs | ✅ REST-API /v1 mit OpenAPI, Service-Schlüssel mit Berechtigungen (ABAC). SDKs Node/TypeScript und Flutter: Preview, noch nicht auf npm/pub.dev [W3] [R1] | 🟡 Versionierte REST-API mit OpenAPI-Doku und Batch-Requests. Offizielle SDKs: nicht verifiziert [M2] |
| K17 | Mehrbenutzer, Rechte, SSO/2FA | 🟡 Rollen Administrator/Mitglied, Einladungen, Sperren. SSO und 2FA: nicht verifiziert (README nennt E-Mail + Passwort) [R1] [R8] | ✅ RBAC mit Rechten pro Objekt und Vererbung, 2FA (TOTP); SSO/LDAP erweiterbar [M2] [M5] |
| K18 | Mobile | 🟡 Responsive Weboberfläche. Keine App; Flutter-SDK für eigene Apps (Preview) [W3] | ❔ Offizielle App: nicht verifiziert [M2] |
| K19 | Datenfluss im Standard | ✅ Nein: OCR, Embeddings und Chat laufen lokal; "kein Versand Ihrer Dateien an Drittanbieter" [W1] [R2] | 🟡 Im Standard lokal; OpenAI-Integration sendet Inhalte an OpenAI (Ollama-Variante lokal) [M2] |

## Wo Mayan EDMS stärker ist

- Ausgereifte Workflow-Engine mit Eskalation, Aufbewahrungsrichtlinien, digitalen Signaturen und Versionierung.
- Sehr feine Rechte (RBAC plus Rechte pro Objekt mit Vererbung), Zwei-Faktor, erweiterbare SSO/LDAP-Anbindung.
- LLM-Integration (OpenAI oder lokal mit Ollama) für Klassifizierung, Extraktion und Zusammenfassung, gekoppelt an Workflows.
- Verteilte OCR, viele Quellen (Scanner via SANE, IMAP/POP3, Objektspeicher), Virenscan mit ClamAV.
- Über 14 Jahre Entwicklung und kommerzieller Support verfügbar.

## Wo Docuvate stärker ist

- Schnellerer Einstieg: Bibliothek, Labels, Ordner und Chat ohne DMS-Modellierung (Dokumenttypen, Metadaten, Workflows).
- Feldvorschläge und Label-Vorschläge funktionieren ohne LLM, auch auf CPU.
- Dokumenten-Chat in der Oberfläche.
- Gmail/Outlook per OAuth und Paperless-ngx als fertige Quellen.
- Moderne Oberfläche mit Hell/Dunkel-Modus und SDKs für Node und Flutter (Preview).

## Wann Sie was wählen sollten

- **Mayan EDMS wählen, wenn:** Sie brauchen ein echtes DMS mit Freigabeprozessen, Aufbewahrung, Audit und feinen Rechten oder kommerziellen Support.
- **Docuvate wählen, wenn:** Sie wollen Dokumente schnell ablegen, Felder gewinnen und lokal fragen, ohne ein DMS aufwendig zu modellieren.

## Wechsel und Parallelbetrieb

Kein direkter Import bekannt.

## Hinweis

Dieser Vergleich beruht auf öffentlichen Quellen vom 09.10.2026 (siehe [quellen.md](./quellen.md)). Funktionen ändern sich. Wenn etwas nicht mehr stimmt, schreiben Sie an hello@docuvate.de; wir korrigieren es.

**CTA-Block (wie mailtrap.io):** „Docuvate in 10 Minuten testen“ · Button *Selbst hosten* (primär) · *Quellcode auf GitHub* (sekundär)
