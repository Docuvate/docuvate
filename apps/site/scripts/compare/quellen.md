# Quellen (abgerufen am 09.10.2026)

Kürzel werden in allen Vergleichstabellen verwendet.

## Docuvate
- **W1** Startseite: https://docuvate.de/
- **W2** Dokumentation: https://docuvate.de/docs (Schnellstart, Konzepte, Self-Hosting-Variablen)
- **W3** SDKs: https://docuvate.de/docs/sdks (Preview-Status, Service-Schlüssel)
- **W4** Konzepte (Ordner, Labels): https://docuvate.de/docs#concepts
- **R1** README (Version 0.1.0, Sustainable Use License 1.0 / fair-code, Kubernetes, ABAC): https://github.com/Docuvate/docuvate/blob/main/README.md
- **R2** KI-Modelle (PaddleOCR, Embeddings, Ollama, Chat): https://github.com/Docuvate/docuvate/blob/main/docs/ai-models.md
- **R3** Unterstützte Scan-Dateitypen (PDF/JPEG/PNG/TIFF): https://github.com/Docuvate/docuvate/blob/main/apps/api/src/modules/sftp-ingress/domain/scan-file-validation.ts
- **R4** Dokumenten-Pipeline und Feldkorrekturen: https://github.com/Docuvate/docuvate/blob/main/docs/document-processing-pipeline.md
- **R5** Hybride Suche (pg_trgm, Embeddings): https://github.com/Docuvate/docuvate/blob/main/docs/adr/016-global-search-embeddings.md
- **R6** Konnektoren (Gmail/Outlook OAuth, S3, Paperless, Home Assistant): https://github.com/Docuvate/docuvate/blob/main/docs/connectors.md
- **R7** SFTP-Eingang und Paperless-Parität: https://github.com/Docuvate/docuvate/blob/main/docs/connectors/sftp.md · https://github.com/Docuvate/docuvate/blob/main/docs/parity-paperless.md
- **R8** Benutzer und Rollen: https://github.com/Docuvate/docuvate/blob/main/docs/user-administration.md
- **R9** Bibliotheks-Chat mit Zitaten (ADR): https://github.com/Docuvate/docuvate/blob/main/docs/adr/024-cited-chat.md

## Paperless-ngx
- **P1** README: https://github.com/paperless-ngx/paperless-ngx (GPL-3.0 via GitHub-API)
- **P2** Feature-Liste: https://github.com/paperless-ngx/paperless-ngx/blob/main/docs/index.md (= https://docs.paperless-ngx.com/#features)
- **P3** Usage (KI-Funktionen, Dokumenten-Chat, Workflows, OAuth-Mail, 2FA, Custom Fields): https://github.com/paperless-ngx/paperless-ngx/blob/main/docs/usage.md
- **P4** Konfiguration (PAPERLESS_AI_*, SOCIALACCOUNT/OIDC): https://github.com/paperless-ngx/paperless-ngx/blob/main/docs/configuration.md
- **P5** Wiki „Related Projects“ (Apps, API-Clients, Hosting): https://github.com/paperless-ngx/paperless-ngx/wiki/Related-Projects
- **P6** Releases (v3.3.0, 06.10.2026): https://github.com/paperless-ngx/paperless-ngx/releases

## Papra
- **A1** README: https://github.com/papra-hq/papra
- **A2** Doku-Startseite: https://docs.papra.app/
- **A3** Preise: https://papra.app/pricing
- **A4** Content extraction: https://docs.papra.app/guides/content-extraction (Quelle: `apps/docs/.../13-content-extraction.mdx`)
- **A5** LLM-Konfiguration und Auto-Tagging: https://docs.papra.app/guides/llm-configuration · https://docs.papra.app/guides/auto-tagging
- **A6** Repository (Commits, Releases): https://github.com/papra-hq/papra
- **A7** Repo-Struktur `apps/mobile` (package.json 1.1.0), `packages/api-sdk`, `packages/webhooks`, `packages/cli`; Release `@papra/mobile@1.1.0` (01.10.2026)
- **A8** Roles and Administration: https://docs.papra.app/guides/roles-administration · Custom OAuth2: https://docs.papra.app/guides/setup-custom-oauth2-providers

## Docspell
- **D1** README: https://github.com/eikek/docspell (AGPL-3.0, Stanford CoreNLP, Android-App, REST-API, CLI)
- **D2** Website: https://docspell.org/
- **D3** Releases (v0.43.0 vom 15.03.2025, Nightly 05.10.2026): https://github.com/eikek/docspell/releases
- **D4** Feature-Liste: https://docspell.org/docs/features/
- **D5** Authentifizierung (OIDC): https://docspell.org/docs/configure/authentication/

## Mayan EDMS
- **M1** Website: https://www.mayan-edms.com/
- **M2** Features 4.12.2: https://docs.mayan-edms.com/chapters/features.html
- **M3** LICENSE (GPL-2.0, Markenhinweis): https://gitlab.com/mayan-edms/mayan-edms/-/blob/master/LICENSE
- **M4** PyPI (4.12.2, 16.09.2026): https://pypi.org/project/mayan-edms/
## DocuWare
- **X1** DocuWare Cloud (Pakete, enthaltene Funktionen): https://start.docuware.com/de/docuware-cloud
- **X2** Preis-FAQ (30 bis 125+ $/Nutzer/Monat, Add-ons): https://start.docuware.com/faq/docuware-pricing
- **X3** IDP-Funktionen: https://start.docuware.com/de/blog/produkt/docuware-idp-funktionen-ueberblick
- **X5** Neues DocuWare, Aura, Mobile-App, Version 7.15: https://start.docuware.com/de/blog/produkt/eine-neue-aera-im-dokumenten-management
- **X6** Entwickler-Doku REST/OAuth2/.NET: https://developer.docuware.com/rest/documentation.html · https://support.docuware.com/en-US/knowledgebase/article/KBA-37505

## Nicht verglichen, aber geprüft
- Paperless-AI (MIT, „currently not maintained“): https://github.com/clusterzx/paperless-ai
- paperless-gpt (MIT): https://github.com/icereed/paperless-gpt
- Teedy (GPL-2.0, letztes Release v1.11 vom 12.03.2023): https://github.com/sismics/docs

## Vorbild-Struktur
- mailtrap.io Footer „Compare“: https://mailtrap.io/ (Links „Mailtrap vs SendGrid/Mailgun/Postmark/Mailchimp/Resend/Amazon SES/HubSpot“) und z. B. https://mailtrap.io/sendgrid-alternative/
