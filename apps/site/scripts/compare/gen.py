# -*- coding: utf-8 -*-
# Single source of truth: one rubric, one data table. All pages are generated from here,
# so every vs page has identical rows in identical order.
import json
import os
import textwrap
OUT = os.path.dirname(os.path.abspath(__file__))
STAND = "09.10.2026"

RUBRIC = [
 ("K1","Zielgruppe","Für wen das Produkt laut eigener Aussage gebaut ist."),
 ("K2","Lizenz","Lizenz des Kerns laut LICENSE-Datei bzw. Hersteller."),
 ("K3","Betrieb","Self-hosted, Cloud (SaaS) oder beides; offizielle Deployment-Wege."),
 ("K4","Kosten","Öffentliche Preise. Ohne Listenpreis: \"auf Anfrage\"."),
 ("K5","Reife & Pflege","Aktuelle Version mit Datum, sichtbare Projektaktivität."),
 ("K6","OCR","Texterkennung für Scans/Bilder: Engine, lokal oder extern."),
 ("K7","Dateiformate","Welche Formate verarbeitet werden (PDF, Bilder, Office, E-Mail)."),
 ("K8","Auto-Zuordnung ohne LLM","Regeln oder klassisches ML für Tags/Typen/Korrespondenten."),
 ("K9","LLM-Funktionen & lokale Modelle","Sprachmodell-Funktionen (Tagging, Extraktion, Zusammenfassung) und ob lokal (z. B. Ollama) möglich."),
 ("K10","Strukturierte Felder","Automatisch vorgeschlagene Werte wie Betrag, Datum, Absender; eigene Felder."),
 ("K11","Chat mit Dokumenten","Fragen in natürlicher Sprache, Antworten aus dem Dokumenttext (RAG): pro Dokument oder über das Archiv."),
 ("K12","Suche","Volltext, Tippfehler-Toleranz, semantische Suche."),
 ("K13","Ordnungsmodell","Tags/Labels, Ordner, Dokumenttypen, Korrespondenten, eigene Felder."),
 ("K14","Workflows & Automatisierung","Regelbasierte Abläufe, Freigaben, Webhooks."),
 ("K15","Import-Quellen","E-Mail, Ordner/Scanner, Cloud-Speicher, andere DMS."),
 ("K16","API & SDKs","Offene API, Spezifikation, offizielle Client-Bibliotheken."),
 ("K17","Mehrbenutzer, Rechte, SSO/2FA","Rollen, Rechte pro Objekt, Single Sign-on, Zwei-Faktor."),
 ("K18","Mobile","Responsive Web, offizielle oder Community-Apps."),
 ("K19","Datenfluss im Standard","Verlassen Dokumentinhalte im Standard-Setup den eigenen Server?"),
]
# Status icons. Info-criteria K1-K5 have no status.
S = {"y":"✅","p":"🟡","n":"❌","u":"❔","i":""}
LEGEND = "✅ vorhanden · 🟡 teilweise / mit Einschränkung · ❌ nicht vorhanden (laut Doku) · ❔ nicht verifiziert"

# Public URLs for reference markers (keep in sync with quellen.md).
SOURCES = {
    "W1": ("Docuvate Startseite", "https://docuvate.de/"),
    "W2": ("Docuvate Dokumentation", "https://docuvate.de/docs"),
    "W3": ("Docuvate SDKs", "https://docuvate.de/docs/sdks"),
    "W4": ("Docuvate Konzepte", "https://docuvate.de/docs#concepts"),
    "R1": ("Docuvate README", "https://github.com/Docuvate/docuvate/blob/main/README.md"),
    "R2": ("Docuvate KI-Modelle", "https://github.com/Docuvate/docuvate/blob/main/docs/ai-models.md"),
    "R3": ("Docuvate Scan-Dateitypen", "https://github.com/Docuvate/docuvate/blob/main/apps/api/src/modules/sftp-ingress/domain/scan-file-validation.ts"),
    "R4": ("Docuvate Dokumenten-Pipeline", "https://github.com/Docuvate/docuvate/blob/main/docs/document-processing-pipeline.md"),
    "R5": ("Docuvate hybride Suche", "https://github.com/Docuvate/docuvate/blob/main/docs/adr/016-global-search-embeddings.md"),
    "R6": ("Docuvate Konnektoren", "https://github.com/Docuvate/docuvate/blob/main/docs/connectors.md"),
    "R7": ("Docuvate SFTP-Eingang", "https://github.com/Docuvate/docuvate/blob/main/docs/connectors/sftp.md"),
    "R8": ("Docuvate Benutzerverwaltung", "https://github.com/Docuvate/docuvate/blob/main/docs/user-administration.md"),
    "R9": ("Docuvate Bibliotheks-Chat (ADR)", "https://github.com/Docuvate/docuvate/blob/main/docs/adr/024-cited-chat.md"),
    "P1": ("Paperless-ngx README", "https://github.com/paperless-ngx/paperless-ngx"),
    "P2": ("Paperless-ngx Features", "https://docs.paperless-ngx.com/#features"),
    "P3": ("Paperless-ngx Usage", "https://github.com/paperless-ngx/paperless-ngx/blob/main/docs/usage.md"),
    "P4": ("Paperless-ngx Konfiguration", "https://github.com/paperless-ngx/paperless-ngx/blob/main/docs/configuration.md"),
    "P5": ("Paperless-ngx Related Projects", "https://github.com/paperless-ngx/paperless-ngx/wiki/Related-Projects"),
    "P6": ("Paperless-ngx Releases", "https://github.com/paperless-ngx/paperless-ngx/releases"),
    "A1": ("Papra README", "https://github.com/papra-hq/papra"),
    "A2": ("Papra Dokumentation", "https://docs.papra.app/"),
    "A3": ("Papra Preise", "https://papra.app/pricing"),
    "A4": ("Papra Content Extraction", "https://docs.papra.app/guides/content-extraction"),
    "A5": ("Papra LLM und Auto-Tagging", "https://docs.papra.app/guides/llm-configuration"),
    "A6": ("Papra Repository", "https://github.com/papra-hq/papra"),
    "A7": ("Papra Mobile und SDK", "https://github.com/papra-hq/papra/tree/main/apps/mobile"),
    "A8": ("Papra Rollen und OAuth", "https://docs.papra.app/guides/roles-administration"),
    "D1": ("Docspell README", "https://github.com/eikek/docspell"),
    "D2": ("Docspell Website", "https://docspell.org/"),
    "D3": ("Docspell Releases", "https://github.com/eikek/docspell/releases"),
    "D4": ("Docspell Features", "https://docspell.org/docs/features/"),
    "D5": ("Docspell Authentifizierung", "https://docspell.org/docs/configure/authentication/"),
    "M1": ("Mayan EDMS Website", "https://www.mayan-edms.com/"),
    "M2": ("Mayan EDMS Features 4.12.2", "https://docs.mayan-edms.com/chapters/features.html"),
    "M3": ("Mayan EDMS LICENSE", "https://gitlab.com/mayan-edms/mayan-edms/-/blob/master/LICENSE"),
    "M4": ("Mayan EDMS auf PyPI", "https://pypi.org/project/mayan-edms/"),
    "X1": ("DocuWare Cloud", "https://start.docuware.com/de/docuware-cloud"),
    "X2": ("DocuWare Preise", "https://start.docuware.com/faq/docuware-pricing"),
    "X3": ("DocuWare IDP", "https://start.docuware.com/de/blog/produkt/docuware-idp-funktionen-ueberblick"),
    "X5": ("DocuWare Aura und Version 7.15", "https://start.docuware.com/de/blog/produkt/eine-neue-aera-im-dokumenten-management"),
    "X6": ("DocuWare Entwickler-Doku", "https://developer.docuware.com/rest/documentation.html"),
}

# Source keys -> see quellen.md
TOOLS = {
"docuvate": dict(name="Docuvate", short="Docuvate", rows={
 "K1":("i","Teams, Selbständige und Entwickler, die Dokumente selbst hosten und per API anbinden wollen","W1"),
 "K2":("i","Sustainable Use License 1.0 (Community, source-available/fair-code): kostenlos für privates und internes betriebliches Self-Hosting; kein Managed-Service/White-Label/Embedding in verkaufte Produkte. Enterprise/Cloud: LICENSE_EE.md","W1,R1"),
 "K3":("i","Nur self-hosted: Docker Compose; Kubernetes (Kustomize/Helm) laut Repo","W2,R1"),
 "K4":("i","Kostenlos (Community). Keine Preise für kommerzielle Editionen veröffentlicht","W1,R1"),
 "K5":("i","Version 0.1.0; öffentliches Repo seit 08.10.2026; SDKs im Status Preview","R1,W3"),
 "K6":("y","PaddleOCR (PP-OCRv4, lateinische Schrift inkl. Deutsch) lokal; Text-Layer-PDFs ohne OCR; Tesseract/Docling optional","R2"),
 "K7":("p","PDF und Bilder (JPEG, PNG, TIFF). Office-Dokumente: nicht verifiziert","W1,R3"),
 "K8":("y","Matching-Regeln (any/all/exact/regex) und Label-Vorschläge per Embeddings; Vorschläge werden bestätigt, nicht erzwungen","W1,R2"),
 "K9":("p","LLM für Chat (Ollama, Standard qwen2.5:1.5b, CPU, auch ARM64). Tagging nutzt Embeddings, kein LLM. Cloud-LLM-Anbieter nicht vorgesehen","W1,R2"),
 "K10":("y","Vorschläge für Betrag, Datum, Absender plus eigener Feldkatalog; Bestätigung per Klick; Korrekturen werden gespeichert","W1,R4"),
 "K11":("y","Chat pro Dokument und über die ganze Bibliothek, lokal, jede Aussage mit verlinkter Quellpassage","W1,R2,R9"),
 "K12":("y","Volltext; laut Repo hybrid mit Tippfehler-Toleranz (pg_trgm) und optionaler semantischer Komponente; Feldfilter wie betrag:12,50","W1,R5"),
 "K13":("y","Farbige Labels, hierarchische Ordner (Mehrfachzuordnung), Korrespondenten, erkannte Felder, Duplikat-Stapel","W4,R1"),
 "K14":("p","Feste Verarbeitungs-Pipeline und Matching-Regeln; kein frei konfigurierbarer Workflow-Editor. Webhooks: nicht verifiziert","R4"),
 "K15":("y","Upload, Amazon S3, Paperless-ngx, Gmail, Outlook (OAuth), Home Assistant (Ausgabe); SFTP-Scanner-Eingang laut Repo. Überwachter Ordner fehlt noch","W1,R6,R7"),
 "K16":("y","REST-API /v1 mit OpenAPI, Service-Schlüssel mit Berechtigungen (ABAC). SDKs Node/TypeScript und Flutter: Preview, noch nicht auf npm/pub.dev","W3,R1"),
 "K17":("p","Rollen Administrator/Mitglied, Einladungen, Sperren. SSO und 2FA: nicht verifiziert (README nennt E-Mail + Passwort)","R1,R8"),
 "K18":("p","Responsive Weboberfläche. Keine App; Flutter-SDK für eigene Apps (Preview)","W3"),
 "K19":("y","Nein: OCR, Embeddings und Chat laufen lokal; \"kein Versand Ihrer Dateien an Drittanbieter\"","W1,R2"),
}),
"paperless-ngx": dict(name="Paperless-ngx", short="Paperless-ngx", slug="paperless-ngx", rows={
 "K1":("i","Privatpersonen, Haushalte, kleine Büros: Papier scannen, durchsuchbar archivieren","P1"),
 "K2":("i","GPL-3.0","P1"),
 "K3":("i","Self-hosted (Docker Compose, Installationsskript). Kein offizielles Cloud-Angebot; Drittanbieter-Hosting laut Community-Wiki","P1,P5"),
 "K4":("i","Kostenlos","P1"),
 "K5":("i","Lange Produktgeschichte und aktive Community; Release v3.3.0 vom 06.10.2026","P1,P6"),
 "K6":("y","Tesseract, über 100 Sprachen, lokal; optional Remote-OCR über Azure AI (opt-in)","P2"),
 "K7":("y","PDF, Bilder, Text, Office (Word, Excel, PowerPoint, LibreOffice) und E-Mails via optionalem Apache Tika; Archivierung als PDF/A","P2"),
 "K8":("y","Klassisches ML (ohne LLM) schlägt Tags, Korrespondenten, Dokumenttypen, Speicherpfade vor; Matching-Regeln","P2,P3"),
 "K9":("y","Optional (Standard aus): LLM-Vorschläge für Titel, Datum, Tags u. a.; Backends Ollama (lokal) oder OpenAI-kompatibel; als Workflow-Aktion automatisierbar","P3,P4"),
 "K10":("p","Eigene Felder (Custom Fields) mit Datentypen, Werte manuell. Automatische Feldwerte wie Betrag: nicht verifiziert","P3"),
 "K11":("y","Optional: Chat pro Dokument und über mehrere Dokumente (RAG mit LLM-Index)","P3"),
 "K12":("y","Volltext mit Autovervollständigung, Relevanz, Hervorhebung, \"More like this\"; mit KI zusätzlich Ähnlichkeitssuche","P2,P3"),
 "K13":("y","Tags, Korrespondenten, Dokumenttypen, Speicherpfade, Custom Fields, gespeicherte Ansichten, Versionen","P2"),
 "K14":("y","Workflow-System mit Auslösern und Aktionen (inkl. KI-Vorschläge anwenden)","P2,P3"),
 "K15":("y","Consume-Ordner, mehrere E-Mail-Konten mit Regeln (IMAP, OAuth für Gmail/Outlook), Upload, API","P2,P3"),
 "K16":("p","REST-API. Offizielle SDKs: keine; Community-Clients laut Wiki","P5"),
 "K17":("y","Mehrbenutzer mit globalen und objektbezogenen Rechten, OIDC/Social Login (django-allauth), 2FA (TOTP)","P2,P3,P4"),
 "K18":("p","Responsive Web; keine offizielle App, viele Community-Apps (iOS/Android) laut Wiki","P5"),
 "K19":("p","Im Standard lokal. Remote-OCR (Azure) und Cloud-LLMs sind opt-in und senden dann Inhalte an den Anbieter","P2,P4"),
}),
"papra": dict(name="Papra", short="Papra", slug="papra", rows={
 "K1":("i","Minimalistisches Dokumentenarchiv für Privatpersonen, Familien, kleine Teams","A1"),
 "K2":("i","AGPL-3.0","A1"),
 "K3":("i","Beides: self-hosted (ein Docker-Image) oder gehostet auf papra.app","A1,A2"),
 "K4":("i","Self-hosted kostenlos. Cloud: Free 0 $, Plus 9 $/Monat, Pro 30 $/Monat (jährlich günstiger), Enterprise auf Anfrage","A3"),
 "K5":("i","Aktiv entwickelt; öffentliche Commits und Releases im Oktober 2026","A6"),
 "K6":("y","Tesseract (intern, lokal); optional Mistral OCR, Azure Document Intelligence, Docling oder eigener HTTP-Dienst","A4"),
 "K7":("p","Gängige Formate über die Bibliothek lecture; genaue Liste (Office): nicht verifiziert","A4"),
 "K8":("y","Tagging-Regeln (regelbasiert)","A1"),
 "K9":("y","Optional (Standard aus): LLM-Auto-Tagging pro Organisation; OpenAI, Mistral, Anthropic, OpenRouter, DeepSeek, Ollama (lokal)","A5"),
 "K10":("p","Eigene Eigenschaften (Custom Properties) pro Organisation; automatische Feldextraktion: nicht verifiziert","A1"),
 "K11":("u","nicht verifiziert (in der Doku keine Chat-Funktion beschrieben)","A1,A5"),
 "K12":("y","Volltext mit erweiterten Filtern und Such-Syntax","A1"),
 "K13":("p","Tags, Custom Properties, Organisationen; Ordner-Hierarchie: nicht verifiziert","A1"),
 "K14":("p","Tagging-Regeln und Webhooks; kein Workflow-Editor beschrieben","A1"),
 "K15":("y","E-Mail-Eingang über generierte Adresse, überwachter Ordner, Upload, CLI, API","A1"),
 "K16":("y","API, offizielles SDK, Webhooks, CLI","A1,A7"),
 "K17":("p","Organisationen mit Rollen (Owner/Member), Plattform-Admin; eigene OAuth2-Anbieter für die Anmeldung konfigurierbar. 2FA: nicht verifiziert","A1,A8"),
 "K18":("y","Responsive Web; Mobile-App (React Native, @papra/mobile 1.1.0). Store-Verfügbarkeit: nicht verifiziert","A1,A7"),
 "K19":("p","Im Standard lokal. Externe OCR- und Cloud-LLM-Anbieter sind opt-in","A4,A5"),
}),
"docspell": dict(name="Docspell", short="Docspell", slug="docspell", rows={
 "K1":("i","Persönlicher Dokumenten-Organizer für Haushalte, Familien und kleine Gruppen/Firmen","D1"),
 "K2":("i","AGPL-3.0","D1,D3"),
 "K3":("i","Self-hosted (Docker Compose, weitere Pakete)","D2"),
 "K4":("i","Kostenlos","D1"),
 "K5":("i","Letztes Release v0.43.0 vom 15.03.2025; Nightly-Builds und Commits weiterhin (Oktober 2026)","D3"),
 "K6":("y","Tesseract, lokal; durchsuchbares PDF aus Bildscans","D2,D4"),
 "K7":("y","Viele Formate; ZIP und EML werden entpackt; Konvertierung nach PDF, Original bleibt erhalten","D2"),
 "K8":("y","ML/NLP (Stanford CoreNLP) schlägt Korrespondenten, Tags, Datum vor; lernt aus bestehenden Dokumenten","D1"),
 "K9":("u","nicht verifiziert (keine LLM-Funktionen in Doku/Feature-Liste gefunden)","D1,D4"),
 "K10":("p","Eigene Felder (Custom Fields); Datumserkennung per NLP; Betrag automatisch: nicht verifiziert","D1,D4"),
 "K11":("n","Keine Chat-Funktion in der Doku","D2,D4"),
 "K12":("y","Volltext über PostgreSQL oder Apache SOLR, kombinierbar mit Filtern","D4"),
 "K13":("y","Tags mit Kategorien, Ordner, Korrespondenten, Custom Fields","D4"),
 "K14":("p","Geplante Abfragen mit Benachrichtigung (E-Mail, Matrix, Gotify), Event-Benachrichtigungen, Add-ons","D2,D4"),
 "K15":("y","IMAP-Import (zeitgesteuert), Watch-Ordner, Upload, Android-Upload-App, CLI","D1,D2,D4"),
 "K16":("p","REST-API, CLI (dsc). Offizielle SDKs: nicht verifiziert","D1"),
 "K17":("y","Collectives mit mehreren Nutzern; OpenID Connect; 2FA (TOTP)","D2,D4,D5"),
 "K18":("p","Mobilfreundliche Web-App; Android-App zum Hochladen","D1"),
 "K19":("y","Lokal (keine externen KI-Dienste vorgesehen)","D1,D4"),
}),
"mayan-edms": dict(name="Mayan EDMS", short="Mayan EDMS", slug="mayan-edms", rows={
 "K1":("i","Organisationen jeder Größe mit Bedarf an DMS-Prozessen (Behörden, Industrie, Forschung)","M1"),
 "K2":("i","GPL-2.0; Name/Logo als Marke geschützt","M3"),
 "K3":("i","Self-hosted (Docker Compose, VM, Hardware, Cloud); kommerzieller Support durch Mayan EDMS LLC","M1,M2"),
 "K4":("i","Software kostenlos; Support-/Service-Pakete kostenpflichtig (Preise auf Anfrage/nicht verifiziert)","M1"),
 "K5":("i","Sehr reif (seit 2010); v4.12.2 vom 16.09.2026","M1,M4"),
 "K6":("y","Tesseract (austauschbares Backend), verteilbar auf mehrere Worker, sprachabhängig","M2"),
 "K7":("y","PDF, Office-Text-Layer, Bilder; Archive optional entpacken; Datei-Metadaten (EXIF, GPS)","M2"),
 "K8":("p","Dokumenttypen, Metadaten, Smart Links, Indizes; Zuordnung regel-/typbasiert, klassisches ML nicht beschrieben","M2"),
 "K9":("y","Integration mit OpenAI und Ollama (lokal): Zusammenfassen, Klassifizieren, strukturierte Extraktion, semantische Suche; Ausgaben steuern Workflows","M2"),
 "K10":("y","Metadatentypen pro Dokumenttyp; strukturierte Extraktion per LLM","M2"),
 "K11":("u","nicht verifiziert (Prompts/semantische Suche beschrieben, Chat-Oberfläche nicht)","M2"),
 "K12":("y","Volltext; semantische Suche über OpenAI-Integration","M2"),
 "K13":("y","Dokumenttypen, Metadaten, Tags, Kabinette/Indizes, Versionierung, Verknüpfungen","M2"),
 "K14":("y","Ausgereifte Workflow-Engine (Zustände, Übergänge, Eskalation, Aktionen), Aufbewahrungsrichtlinien, Signaturen","M2"),
 "K15":("y","Watch-/Staging-Ordner, IMAP/POP3, Cloud-Objektspeicher, SANE-Scanner, Upload","M2"),
 "K16":("p","Versionierte REST-API mit OpenAPI-Doku und Batch-Requests. Offizielle SDKs: nicht verifiziert","M2"),
 "K17":("y","RBAC mit Rechten pro Objekt und Vererbung, 2FA (TOTP); SSO/LDAP erweiterbar","M2"),
 "K18":("u","Offizielle App: nicht verifiziert","M2"),
 "K19":("p","Im Standard lokal; OpenAI-Integration sendet Inhalte an OpenAI (Ollama-Variante lokal)","M2"),
}),
"docuware": dict(name="DocuWare", short="DocuWare", slug="docuware", rows={
 "K1":("i","Unternehmen (KMU bis Konzern) mit Dokumenten-Workflows, z. B. Rechnungseingang, Personalakten","X1"),
 "K2":("i","Proprietär","X1"),
 "K3":("i","DocuWare Cloud oder On-Premises (laut Hersteller)","X1"),
 "K4":("i","Auf Anfrage; Hersteller nennt typisch 30 bis 125+ US-$ pro Nutzer/Monat. Cloud-Pakete 4/15/40/100 Nutzer. IDP volumenbasiertes Add-on","X1,X2,X3"),
 "K5":("i","Etabliertes Produkt; neue Oberfläche ab Mitte Oktober 2026 mit Version 7.15 (Cloud zuerst)","X5"),
 "K6":("y","OCR enthalten; IDP-Add-on mit Handschrifterkennung (HTR). Verarbeitung in der Cloud oder on-prem","X3,X5"),
 "K7":("u","nicht verifiziert (Formatliste nicht geprüft)","—"),
 "K8":("y","Intelligent Indexing in allen Cloud-Paketen; IDP-Klassifizierung als Add-on","X1,X3"),
 "K9":("y","DocuWare Aura: Zusammenfassungen, Schlüsselinformationen, Dokumentvergleich per natürlicher Sprache. Lokale Modelle: nicht vorgesehen/nicht verifiziert","X5"),
 "K10":("y","IDP extrahiert Daten inkl. Einzelpositionen und Tabellen (Add-on)","X3"),
 "K11":("p","Fragen in natürlicher Sprache über Aura beschrieben; Umfang (Archiv-RAG): nicht verifiziert","X5"),
 "K12":("y","Volltextsuche in allen Cloud-Plänen","X2"),
 "K13":("y","Aktenschränke mit Indexfeldern, Versionen, Zugriffsrechte","X2,X6"),
 "K14":("y","Workflow Manager und Formulare in allen Cloud-Paketen","X1,X2"),
 "K15":("p","Integrationen u. a. SAP (Add-on); weitere Konnektoren: nicht verifiziert","X2"),
 "K16":("y","REST-API (OAuth2) und .NET-SDK","X6"),
 "K17":("y","Mehrbenutzer mit Zugriffsrechten; Identity Service mit OAuth2/OIDC. Details SSO/2FA: nicht verifiziert","X2,X6"),
 "K18":("y","Offizielle Mobile-App","X5"),
 "K19":("p","Cloud: Dokumente liegen beim Anbieter. On-Premises möglich; ob IDP/Aura on-prem voll verfügbar sind: nicht verifiziert","X1,X3,X5"),
}),
}

PROSE = {
"paperless-ngx": dict(
 title="Docuvate vs. Paperless-ngx",
 lead="Paperless-ngx ist das bekannteste selbst gehostete Dokumentenarchiv und seit Jahren der Standard. Docuvate ist neu und verfolgt einen anderen Schwerpunkt: strukturierte Felder, API-first-Integration und eine Architektur mit PostgreSQL und S3-Speicher.",
 audience="Paperless-ngx passt zu allen, die Papier zuverlässig digitalisieren und ein ausgereiftes, breit unterstütztes Archiv wollen. Docuvate richtet sich an Teams und Entwickler, die erkannte Felder bestätigen und Dokumente per API in eigene Systeme einbinden wollen.",
 better=[
  "Reife und Community: viele Jahre Betrieb, sehr große Nutzerbasis, viele Anleitungen und Drittanbieter-Apps.",
  "Mehr Formate: Office-Dokumente und E-Mails (über Apache Tika), Archivierung als PDF/A, über 100 OCR-Sprachen.",
  "Workflow-System, Consume-Ordner, E-Mail-Regeln für mehrere Konten.",
  "Objektbezogene Rechte, OIDC-Login und Zwei-Faktor-Anmeldung sind dokumentiert.",
 ],
 ours=[
  "Strukturierte Felder (Betrag, Datum, Absender) werden ohne LLM vorgeschlagen und mit einem Klick bestätigt; Korrekturen werden für spätere Verbesserungen gespeichert.",
  "API-first: OpenAPI-Spezifikation, Service-Schlüssel mit feingranularen Berechtigungen (ABAC), SDKs für Node und Flutter (Preview).",
  "Architektur für Skalierung: PostgreSQL, S3-kompatibler Speicher (MinIO) und Kubernetes-Manifeste (Kustomize/Helm) im Repo.",
  "KI im Standard vollständig lokal und CPU-tauglich (PaddleOCR, Embeddings, Ollama); kein Cloud-Anbieter nötig.",
  "Tippfehler-tolerante Suche und Feldfilter wie betrag:12,50.",
  "Antworten mit geprüften Zitaten (Seite und Textstelle), ohne passende Quelle keine Antwort.",
 ],
 choose_them="Sie wollen ein bewährtes Archiv mit großer Community, brauchen Office/E-Mail-Verarbeitung oder Workflows, oder Ihnen ist Stabilität wichtiger als neue Funktionen.",
 choose_us="Sie brauchen bestätigte Feldwerte für Buchhaltung oder Backoffice, wollen Dokumente headless per API in eigene Anwendungen bringen oder auf PostgreSQL/S3/Kubernetes betreiben, und Sie können mit einem jungen Projekt (0.1.0) leben.",
 migration="Docuvate hat eine Paperless-ngx-Verbindung (Import aus bestehenden Ablagen). Ein vollständiger Migrationsadapter steht laut Roadmap noch aus. Beide können parallel laufen.",
),
"papra": dict(
 title="Docuvate vs. Papra",
 lead="Papra ist ein bewusst schlankes Dokumentenarchiv, selbst gehostet oder als Cloud-Dienst. Docuvate setzt stärker auf Erkennung: Felder, Label-Vorschläge und Dokumenten-Chat.",
 audience="Papra passt zu allen, die ein einfaches, schnelles Archiv wollen, auch ohne eigenen Server. Docuvate passt zu Teams, die aus Dokumenten Daten gewinnen und lokal mit ihnen chatten wollen.",
 better=[
  "Gehostete Variante mit Free-Plan; kein eigener Server nötig.",
  "Sehr einfacher Betrieb: ein Docker-Image statt eines Stacks aus mehreren Diensten.",
  "Offizielles SDK, Webhooks, CLI und eine Mobile-App.",
  "Freigabe-Links nach außen mit Ablaufdatum und Passwort.",
  "Mehr OCR-Optionen (Tesseract, Mistral OCR, Azure, Docling, eigener Dienst) und viele LLM-Anbieter fürs Auto-Tagging.",
 ],
 ours=[
  "Strukturierte Felder (Betrag, Datum, Absender) mit Bestätigung.",
  "Chat pro Dokument mit lokalem Modell; bei Papra ist kein Chat dokumentiert.",
  "Hierarchische Ordner zusätzlich zu Labels.",
  "Mehr fertige Quellen: Gmail und Outlook per OAuth, S3, Paperless-ngx, SFTP-Scanner-Eingang.",
  "Label-Vorschläge ohne LLM (Embeddings), also auch auf schwacher Hardware.",
 ],
 choose_them="Sie wollen das einfachste Archiv, eine Cloud-Option oder eine Mobile-App, und brauchen keine Feldextraktion und keinen Chat.",
 choose_us="Sie wollen Felder, Ordner und Chat lokal, haben einen Server für den Docker-Compose-Stack und nutzen Mail-Postfächer als Quelle.",
 migration="Kein direkter Import zwischen Papra und Docuvate bekannt. Export/Import über Dateien oder die APIs beider Produkte.",
),
"docspell": dict(
 title="Docuvate vs. Docspell",
 lead="Docspell ist ein ausgereifter Dokumenten-Organizer mit klassischem Machine Learning und starker E-Mail-Integration. Docuvate ergänzt Feldvorschläge, Embedding-basierte Labels und lokalen Dokumenten-Chat.",
 audience="Docspell passt zu Haushalten und kleinen Gruppen, die viel per E-Mail bekommen und Metadaten vorschlagen lassen wollen. Docuvate passt zu Teams, die zusätzlich Felder, Chat und eine moderne API brauchen.",
 better=[
  "Länger im Einsatz, stabile Funktionen für E-Mail: IMAP-Import nach Zeitplan, EML/ZIP entpacken, Versand aus der App.",
  "Konvertierung aller Dateien in durchsuchbare PDFs, Originale bleiben erhalten.",
  "OpenID Connect und Zwei-Faktor-Anmeldung dokumentiert.",
  "Benachrichtigungen über E-Mail, Matrix oder Gotify sowie Add-ons.",
  "Android-App zum Hochladen.",
 ],
 ours=[
  "Dokumenten-Chat pro Dokument mit lokalem Modell (Docspell: kein Chat).",
  "Strukturierte Felder mit Ein-Klick-Bestätigung.",
  "Gmail und Outlook per OAuth, S3, Paperless-ngx als Quellen.",
  "OpenAPI-basierte API mit Service-Schlüsseln und SDKs (Preview).",
  "Aktivere Release-Pflege: Docspell hat seit März 2025 kein stabiles Release veröffentlicht (Nightlies laufen).",
 ],
 choose_them="Sie wollen ein erprobtes System mit starker E-Mail-Verarbeitung und SSO, und Chat oder Feldextraktion sind nicht wichtig.",
 choose_us="Sie wollen Chat, Felder und eine API für eigene Anwendungen, und ein junges Projekt ist für Sie in Ordnung.",
 migration="Kein direkter Import bekannt. Übergang über Dateiexport und Docuvate-Upload oder API.",
),
"mayan-edms": dict(
 title="Docuvate vs. Mayan EDMS",
 lead="Mayan EDMS ist ein umfangreiches Open-Source-DMS für Organisationen mit Prozessen, Rechten und Compliance-Anforderungen. Docuvate ist deutlich schlanker und auf Erkennung und schnelle Ablage ausgerichtet.",
 audience="Mayan passt zu Organisationen, die Workflows, Aufbewahrung, Signaturen und feine Rechte brauchen. Docuvate passt zu kleineren Teams, die schnell starten und Dokumente vor allem finden, auswerten und per API nutzen wollen.",
 better=[
  "Ausgereifte Workflow-Engine mit Eskalation, Aufbewahrungsrichtlinien, digitalen Signaturen und Versionierung.",
  "Sehr feine Rechte (RBAC plus Rechte pro Objekt mit Vererbung), Zwei-Faktor, erweiterbare SSO/LDAP-Anbindung.",
  "LLM-Integration (OpenAI oder lokal mit Ollama) für Klassifizierung, Extraktion und Zusammenfassung, gekoppelt an Workflows.",
  "Verteilte OCR, viele Quellen (Scanner via SANE, IMAP/POP3, Objektspeicher), Virenscan mit ClamAV.",
  "Über 14 Jahre Entwicklung und kommerzieller Support verfügbar.",
 ],
 ours=[
  "Schnellerer Einstieg: Bibliothek, Labels, Ordner und Chat ohne DMS-Modellierung (Dokumenttypen, Metadaten, Workflows).",
  "Feldvorschläge und Label-Vorschläge funktionieren ohne LLM, auch auf CPU.",
  "Dokumenten-Chat in der Oberfläche.",
  "Gmail/Outlook per OAuth und Paperless-ngx als fertige Quellen.",
  "Moderne Oberfläche mit Hell/Dunkel-Modus und SDKs für Node und Flutter (Preview).",
 ],
 choose_them="Sie brauchen ein echtes DMS mit Freigabeprozessen, Aufbewahrung, Audit und feinen Rechten oder kommerziellen Support.",
 choose_us="Sie wollen Dokumente schnell ablegen, Felder gewinnen und lokal fragen, ohne ein DMS aufwendig zu modellieren.",
 migration="Kein direkter Import bekannt.",
),
"docuware": dict(
 title="Docuvate vs. DocuWare",
 lead="DocuWare ist eine kommerzielle DMS- und Workflow-Plattform für Unternehmen, vor allem als Cloud-Dienst. Docuvate ist source-available (fair-code) und läuft nur auf Ihrer eigenen Infrastruktur.",
 audience="DocuWare passt zu Unternehmen, die einen Anbieter mit Vertrag, Support, Workflows und Integrationen wie SAP suchen. Docuvate passt zu Teams, die Kontrolle über Daten und Kosten wollen und selbst betreiben können.",
 better=[
  "Vollständige Unternehmensplattform: Workflow Manager, Formulare, Integrationen (z. B. SAP), Mobile-App.",
  "Intelligent Document Processing mit Handschrifterkennung, Einzelpositionen und Tabellen.",
  "Herstellersupport, Partnernetz, Verträge; ISO/SOC-Zertifizierungen: nicht verifiziert (keine belastbare DocuWare-Quelle im Review).",
  "Betrieb ohne eigenes IT-Team möglich (Cloud).",
 ],
 ours=[
  "Source-available (SUL 1.0) ohne Lizenzgebühr pro Nutzer für Self-Hosting auf eigener Infrastruktur.",
  "Daten und KI bleiben auf Ihrer Hardware; keine Cloud nötig.",
  "Offene API mit OpenAPI-Spezifikation und SDKs; Sie können den Code prüfen und anpassen.",
  "Schnell testbar: docker compose up statt Vertriebsgespräch.",
 ],
 choose_them="Sie brauchen bewährte Workflows, Compliance-Nachweise des Anbieters, Support mit SLA oder SAP-Integration, und Cloud-Betrieb ist für Sie in Ordnung.",
 choose_us="Sie wollen Daten im eigenen Haus, keine Nutzerlizenzen, und die Kernfunktionen Ablage, Erkennung, Suche und Chat reichen.",
 migration="Kein direkter Import bekannt.",
),
}

def src(s):
    return "" if s in ("—","") else " ["+s.replace(",","] [")+"]"

def cell(tool,k):
    st,txt,sr=TOOLS[tool]["rows"][k]
    st=st[-1]
    icon=S[st]
    return (icon+" " if icon else "")+txt, sr

def table(tools, with_src=True):
    hdr="| # | Kriterium | "+" | ".join(TOOLS[t]["name"] for t in tools)+" |"
    sep="|---|---|"+"---|"*len(tools)
    lines=[hdr,sep]
    for k,name,_ in RUBRIC:
        cells=[]
        for t in tools:
            c,sr=cell(t,k)
            cells.append(c+(src(sr) if with_src else ""))
        lines.append(f"| {k} | {name} | "+" | ".join(cells)+" |")
    return "\n".join(lines)

def rubric_md():
    out=[f"# Vergleichs-Rubrik (verbindlich für alle Vergleiche)\n\nStand der Recherche: {STAND}. Diese Datei ist die einzige Quelle für die Kriterien. Jede Vergleichsseite und die Übersichtsmatrix verwenden **genau diese Kriterien in genau dieser Reihenfolge**. Unbekanntes wird als **nicht verifiziert** eingetragen, nie weggelassen.\n",
         "## Kriterien\n","| # | Kriterium | Was wird bewertet |","|---|---|---|"]
    out+= [f"| {k} | {n} | {d} |" for k,n,d in RUBRIC]
    out.append(f"\n## Bewertungsskala\n\n{LEGEND}\n\nK1 bis K5 sind beschreibend (kein Symbol). Bei K19 bedeutet ✅: Inhalte bleiben im Standard auf dem eigenen Server; 🟡: lokal, aber Cloud-Dienste sind zuschaltbar bzw. Cloud-Betrieb ist der Normalfall.\n")
    out.append("""## Regeln für Belege

1. Jede Zelle hat mindestens eine Quelle (Kürzel in eckigen Klammern, aufgelöst in `quellen.md`).
2. Nur offizielle Quellen: Hersteller-Website, offizielle Doku, offizielles Repository/LICENSE, Preisseite. Drittquellen nur, wenn ausdrücklich so markiert.
3. Docuvate selbst wird nur aus docuvate.de [W*] und dem öffentlichen Repo github.com/Docuvate/docuvate [R*] bewertet. Was nur im Repo steht, ist auf der Website noch nicht beworben; vor Veröffentlichung abgleichen.
4. Optionale Funktionen (Standard aus) werden als vorhanden gezählt, der Zusatz \"optional\" steht im Text.
5. Vor jeder Veröffentlichung und danach quartalsweise neu prüfen (Datum oben aktualisieren). Wettbewerber können Korrekturen über hello@docuvate.de melden.
6. Keine Wertungen wie \"besser/schlechter\" in Tabellenzellen. Wertungen nur in den Abschnitten \"Wo X stärker ist\" und \"Wo Docuvate stärker ist\", und dort immer beidseitig.
""")
    return "\n".join(out)

ORDER=["paperless-ngx","papra","docspell","mayan-edms","docuware"]

def overview_md():
    return f"""# Vergleiche: Docuvate und Alternativen

> Seitenvorschlag: `/docs/vergleiche` (EN später: `/en/docs/comparisons`). Stand: {STAND}.

Es gibt gute Werkzeuge für Dokumentenablage. Hier sehen Sie ehrlich, wo Docuvate passt und wo eine Alternative besser zu Ihnen passt. Alle Vergleiche nutzen dieselben {len(RUBRIC)} Kriterien in derselben Reihenfolge ([Rubrik](./00-rubrik.md)). Unbekanntes markieren wir als „nicht verifiziert“.

**Docuvate in einem Satz:** selbst gehostete Dokumentenanalyse (OCR, Felder, Labels, Ordner, Chat pro Dokument) mit offener API, im Standard komplett lokal. Das Projekt ist jung (Version 0.1.0).

## Einzelvergleiche

| Vergleich | Kurz |
|---|---|
""" + "\n".join(f"| [Docuvate vs. {TOOLS[t]['name']}](./vs-{t}.md) | {PROSE[t]['lead'].split('. ')[0]}. |" for t in ORDER) + f"""

Die vollständige Matrix aller Produkte in einer Tabelle entfällt. Jeder Einzelvergleich nutzt dieselbe Rubrik; Quellen stehen in den Tabellen und in [quellen.md](./quellen.md).

## Kurz: Wann was?

- **Paperless-ngx:** bewährtes Archiv mit großer Community, Office/E-Mail, Workflows, Archiv-Chat.
- **Papra:** einfachstes Archiv, auch als Cloud-Dienst, mit Mobile-App.
- **Docspell:** erprobt, stark bei E-Mail-Eingang, SSO, kein Chat.
- **Mayan EDMS:** echtes DMS mit Workflows, Aufbewahrung, feinen Rechten.
- **DocuWare:** kommerzielle Plattform mit Support, IDP und SAP-Anbindung, vor allem Cloud.
- **Docuvate:** bestätigte Felder, Labels und Ordner, Chat pro Dokument und API, alles lokal auf CPU.

## Nicht im Vergleich (bewusst)

- **Paperless-AI** (MIT) und **paperless-gpt** (MIT): Erweiterungen für Paperless-ngx, keine eigenständigen Archive. Paperless-AI ist laut README derzeit nicht gepflegt; Paperless-ngx hat inzwischen eigene KI-Funktionen.
- **Teedy** (GPL-2.0): letztes Release v1.11 vom 12.03.2023.
- **Google Drive / Dropbox:** Cloud-Speicher mit Suche, kein selbst gehostetes System; Vergleich nur sinnvoll als eigene Seite „Warum nicht einfach Drive?“ (optional, später).
- **Nanonets und ähnliche IDP-APIs:** Cloud-Extraktionsdienste für Entwickler, eher Bausteine als Archiv.
"""

def vs_md(t):
    p=PROSE[t]; n=TOOLS[t]["name"]
    return f"""# {p['title']}

> Seitenvorschlag: `/docs/vergleiche/{t}` · Stand: {STAND} · Rubrik: [00-rubrik.md](./00-rubrik.md)

{p['lead']}

[Selbst hosten](/docs#schnellstart) · [Alle Vergleiche](./01-uebersicht-matrix.md)

## Kurzfazit

**Für wen:** {p['audience']}

## Vergleich nach Kriterien

{LEGEND}

{table(['docuvate',t])}

## Wo {n} stärker ist

""" + "\n".join(f"- {b}" for b in p['better']) + f"""

## Wo Docuvate stärker ist

""" + "\n".join(f"- {b}" for b in p['ours']) + f"""

## Wann Sie was wählen sollten

- **{n} wählen, wenn:** {p['choose_them']}
- **Docuvate wählen, wenn:** {p['choose_us']}

## Wechsel und Parallelbetrieb

{p['migration']}

## Hinweis

Dieser Vergleich beruht auf öffentlichen Quellen vom {STAND} (siehe [quellen.md](./quellen.md)). Funktionen ändern sich. Wenn etwas nicht mehr stimmt, schreiben Sie an hello@docuvate.de; wir korrigieren es.

**CTA-Block (wie mailtrap.io):** „Docuvate in 10 Minuten testen“ · Button *Selbst hosten* (primär) · *Quellcode auf GitHub* (sekundär)
"""

open(os.path.join(OUT,"00-rubrik.md"),"w").write(rubric_md())
open(os.path.join(OUT,"01-uebersicht-matrix.md"),"w").write(overview_md())
for t in ORDER:
    open(os.path.join(OUT,f"vs-{t}.md"),"w").write(vs_md(t))

GENERATED = os.path.normpath(os.path.join(OUT, "..", "..", "src", "generated"))
os.makedirs(GENERATED, exist_ok=True)

def row_payload(tool, k):
    text, sr = cell(tool, k)
    return {"text": text, "sources": sr if sr and sr != "—" else ""}

def collect_source_keys():
    keys = set()
    for tool in TOOLS.values():
        for _, _, sr in tool["rows"].values():
            if not sr or sr == "—":
                continue
            for part in sr.split(","):
                keys.add(part.strip())
    return keys

def validate_sources():
    used = collect_source_keys()
    missing = sorted(k for k in used if k not in SOURCES)
    if missing:
        raise SystemExit(f"Missing SOURCES entries for: {', '.join(missing)}")
    unused = sorted(k for k in SOURCES if k not in used)
    if unused:
        raise SystemExit(f"Unused SOURCES entries (remove or cite): {', '.join(unused)}")
    for key, (label, url) in SOURCES.items():
        if not url.startswith("https://"):
            raise SystemExit(f"Source {key} must have https URL")

def compare_json():
    validate_sources()
    rubric = [{"id": k, "title": n, "description": d} for k, n, d in RUBRIC]
    sources = {
        key: {"id": key, "label": label, "url": url}
        for key, (label, url) in sorted(SOURCES.items())
    }
    pages = []
    for t in ORDER:
        p = PROSE[t]
        rows = []
        for k, name, _ in RUBRIC:
            rows.append({
                "id": k,
                "criterion": name,
                "docuvate": row_payload("docuvate", k),
                "other": row_payload(t, k),
            })
        pages.append({
            "slug": t,
            "competitorName": TOOLS[t]["name"],
            "title": p["title"],
            "lead": p["lead"],
            "audience": p["audience"],
            "rows": rows,
            "competitorStrengths": p["better"],
            "docuvateStrengths": p["ours"],
            "chooseThem": p["choose_them"],
            "chooseUs": p["choose_us"],
            "migration": p["migration"],
        })
    return {
        "stand": STAND,
        "legend": LEGEND,
        "rubric": rubric,
        "sources": sources,
        "competitors": [{"slug": t, "name": TOOLS[t]["name"]} for t in ORDER],
        "pages": pages,
    }

with open(os.path.join(GENERATED, "compare.de.json"), "w", encoding="utf-8") as f:
    json.dump(compare_json(), f, ensure_ascii=False, indent=2)
print("ok")
