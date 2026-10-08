<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="docs/assets/logo/logo-dark.svg">
    <source media="(prefers-color-scheme: light)" srcset="docs/assets/logo/logo-light.svg">
    <img alt="Docuvate" src="docs/assets/logo/logo-light.svg" width="320">
  </picture>
</p>

<p align="center">
  <strong>Selbst gehostete Dokumentenintelligenz: OCR, automatische Labels, Suche und Chat über Ihre Dokumente, auf Ihrer eigenen Hardware.</strong>
</p>

<p align="center">
  <a href="README.md">English</a>
  ·
  <a href="https://docuvate.de">Website</a>
  ·
  <a href="docs/">Dokumentation</a>
  ·
  <a href="README.md#quickstart">Schnellstart</a>
  ·
  <a href="openapi/docuvate.v1.json">API</a>
  ·
  <a href="CONTRIBUTING.md">Mitwirken</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Lizenz-AGPL--3.0-cb3a00" alt="Lizenz AGPL-3.0">
  <img src="https://img.shields.io/badge/Version-0.1.0-120f09" alt="Version 0.1.0">
  <img src="https://img.shields.io/badge/Node-%3E%3D22-cb3a00?logo=node.js&logoColor=white" alt="Node 22+">
  <img src="https://img.shields.io/badge/Python-%3E%3D3.12-cb3a00?logo=python&logoColor=white" alt="Python 3.12+">
  <img src="https://img.shields.io/badge/Self--hosted-ja-cb3a00" alt="Self-hosted">
  <img src="https://img.shields.io/badge/Docker-Compose-cb3a00?logo=docker&logoColor=white" alt="Docker Compose">
</p>

## Warum Docuvate

Viele DMS-Lösungen enden bei Volltextsuche. Docuvate setzt auf **strukturierte Extraktion** (Felder und Layout-Blöcke), **label-orientierte Organisation** und eine **moderne Oberfläche**, bleibt aber **selbst gehostet** und für typische Deployments **CPU-orientiert**.

## Funktionen

| Bereich        | Inhalt                                                   |
| -------------- | -------------------------------------------------------- |
| Bibliothek     | Filter, Massenaktionen, Duplikat-Stapel, Posteingang     |
| Dokumentdetail | Vorschau, OCR-Text, Layout, Felder, Labels               |
| Labels         | Vokabular, Vorschläge über Embeddings                    |
| Connectors     | Plugin-Katalog und Anbindung externer Systeme            |
| Dateisystem    | Ordnerbaum neben Labels                                  |
| Chat           | Dokument-Chat mit konfiguriertem Provider (z. B. Ollama) |
| Integration    | API-first: Docuvate headless hinter eigenen Apps (OpenAPI, ABAC) |

## Schnellstart

Im Repository-Root:

```bash
cp .env.example .env
docker compose up -d --build
```

| Dienst  | URL                                   |
| ------- | ------------------------------------- |
| Web     | http://localhost:5173                 |
| API     | http://localhost:3001/health          |
| OpenAPI | http://localhost:3001/v1/openapi.json |
| Mailpit | http://localhost:8025                 |

Registrieren Sie sich in der Web-App, laden Sie Dokumente in die Bibliothek und öffnen Sie ein Dokument für Vorschau und Felder.

### PostgreSQL 18

Docker Compose nutzt **PostgreSQL 18.6** (`postgres:18.6-alpine`). Neue Installationen verwenden das Docker-Volume `pgdata`.

**Vor einem Produktions-Upgrade: Datenbank und MinIO-Bucket `documents` sichern.** `docker compose down -v` **nicht** verwenden: Damit werden **alle Dokumente und die Datenbank gelöscht**. Details: [Self-hosting (Compose)](docs/self-hosting.md).

## Architektur und API

Siehe [docs/architecture.md](docs/architecture.md) und [docs/sdks.md](docs/sdks.md).

## Editionen

| Edition     | Lizenz                       |
| ----------- | ---------------------------- |
| Community   | AGPL-3.0 (dieses Repository) |

Kommerzielle Editionen: [docuvate.de](https://docuvate.de). Community-Support: [GitHub Issues](https://github.com/Docuvate/docuvate/issues).

## Mitwirken, Sicherheit, Lizenz

- [CONTRIBUTING.md](CONTRIBUTING.md)
- [SECURITY.md](SECURITY.md)
- [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)
- [LICENSE](LICENSE) (AGPL-3.0)
