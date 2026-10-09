<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="docs/assets/logo/logo-dark.svg">
    <source media="(prefers-color-scheme: light)" srcset="docs/assets/logo/logo-light.svg">
    <img alt="Docuvate" src="docs/assets/logo/logo-light.svg" width="320">
  </picture>
</p>

<p align="center">
  <strong>Self-hosted document intelligence: OCR, auto-labeling, search and chat over your documents, on your own hardware.</strong>
</p>

<p align="center">
  <a href="https://docuvate.de">Website</a>
  ·
  <a href="docs/">Documentation</a>
  ·
  <a href="#quickstart">Quickstart</a>
  ·
  <a href="openapi/docuvate.v1.json">API</a>
  ·
  <a href="CONTRIBUTING.md">Contributing</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/license-SUL%201.0%20(fair--code)-cb3a00" alt="License Sustainable Use 1.0 (fair-code)">
  <img src="https://img.shields.io/badge/version-0.1.0-120f09" alt="Version 0.1.0">
  <img src="https://img.shields.io/badge/node-24.21.0-cb3a00?logo=node.js&logoColor=white" alt="Node 24.21.0">
  <img src="https://img.shields.io/badge/python-3.12.15-cb3a00?logo=python&logoColor=white" alt="Python 3.12.15">
  <img src="https://img.shields.io/badge/self--hosted-yes-cb3a00" alt="Self-hosted">
  <img src="https://img.shields.io/badge/docker-compose-cb3a00?logo=docker&logoColor=white" alt="Docker Compose">
</p>

## Why Docuvate

Paperless tools often stop at full-text search. Docuvate targets **structured extraction** (fields and layout blocks you can edit), **label-first organization**, and a **product-grade UI**, while staying **self-hostable** and **CPU-friendly** for typical deployments.

## Features

| Area            | Highlights                                                            |
| --------------- | --------------------------------------------------------------------- |
| Library         | Filter, bulk actions, duplicate stacks, inbox flow                    |
| Document detail | Preview, OCR text, layout blocks, editable fields, labels             |
| Labels          | Vocabulary, suggestions from embeddings, inbox triage                 |
| Connectors      | Plugin catalog (mail, DMS, HA, S3) with connect and import flows      |
| Filesystem      | Nested folders and explorer alongside labels                          |
| Chat            | Per-document chat when a provider (for example Ollama) is configured  |
| Integrations    | API-first: use Docuvate headless behind your own apps (OpenAPI, ABAC) |
| Auth            | Email and password via better-auth, password reset (Mailpit locally)  |

## Quickstart

### Toolchain (local development)

Runtime versions are pinned in [`.tool-versions`](.tool-versions). With [asdf](https://asdf-vm.com/):

```bash
asdf plugin add nodejs https://github.com/asdf-vm/asdf-nodejs.git
asdf plugin add pnpm https://github.com/jonathanmorley/asdf-pnpm.git
asdf plugin add python https://github.com/asdf-community/asdf-python.git
asdf plugin add uv https://github.com/asdf-community/asdf-uv.git
asdf install
```

See [CONTRIBUTING.md](CONTRIBUTING.md#development-setup) for the full development setup.

### Docker Compose

From the repository root:

```bash
cp .env.example .env   # optional for Compose defaults; useful for local overrides
docker compose up -d --build
```

Wait until **web**, **api**, and **worker** are healthy (PostgreSQL 18 and Valkey healthchecks pass first).

| Service              | URL                                   |
| -------------------- | ------------------------------------- |
| Web app              | http://localhost:5173                 |
| API health           | http://localhost:3001/health          |
| API ready            | http://localhost:3001/health/ready    |
| OpenAPI              | http://localhost:3001/v1/openapi.json |
| Mailpit (local mail) | http://localhost:8025                 |

**First login:** open the web URL, register, open **Library**, upload PDFs or images, then open a document for preview and fields.

Host port overrides (see `docker-compose.yml`): PostgreSQL 18 on host port **5433**, MinIO **9010** / console **9011**, Ollama **127.0.0.1:11434**.

Document chat uses Ollama (default model `qwen2.5:3b`). Increase `OLLAMA_MEM_LIMIT` in `.env` for larger models (see `.env.example`).

### PostgreSQL 18

Docker Compose runs **PostgreSQL 18.6** (`postgres:18.6-alpine`). Fresh installs use the `pgdata` Docker volume.

**Back up your database and MinIO `documents` bucket before upgrading production data.** Never use `docker compose down -v` to reset a stack: that **deletes all documents and the database**. See [Self-hosting](docs/self-hosting.md) for volumes and recovery.

Local development without Docker also expects **PostgreSQL 18.6** (or compatible 18.x), plus MinIO, Valkey, and the Node / Python / uv versions from `.tool-versions` for API, web, and worker.

## Kubernetes

Deploy Docuvate on Kubernetes with **Kustomize** (primary, GitOps-friendly) or an equivalent **Helm** chart. Overlays cover local **dev** (kind smoke), **homelab** (in-cluster Postgres 18, MinIO, Valkey), and **cloud** (managed Postgres and S3-compatible object storage; no in-cluster database).

| Path                                                   | Purpose                                    |
| ------------------------------------------------------ | ------------------------------------------ |
| [docs/deploy/kubernetes.md](docs/deploy/kubernetes.md) | Homelab, cloud, migrations, backups        |
| [deploy/README.md](deploy/README.md)                   | Layout of manifests, scripts, and examples |
| `deploy/kustomize/overlays/*`                          | Environment-specific manifests             |
| `deploy/helm/docuvate`                                 | Helm chart with matching values files      |

Validate rendered manifests locally (kubeconform strict, Helm/Kustomize parity):

```bash
bash tools/k8s-manifest-validate.sh
```

Optional end-to-end smoke on [kind](https://kind.sigs.k8s.io/) (local registry, migrate Job, health and OpenAPI checks):

```bash
bash tools/k8s-kind-smoke.sh
```

CI runs manifest validation on every workflow; kind smoke runs when deploy or image-related paths change.

## Architecture

```mermaid
flowchart TB
  subgraph clients ["Clients"]
    Web["Web app"]
    SDK["SDKs and integrations"]
  end
  Web --> API["NestJS API"]
  SDK --> API
  API --> PG[("PostgreSQL 18")]
  API --> VK[("Valkey")]
  API --> S3[("MinIO")]
  API --> Worker["FastAPI worker"]
  Worker --> S3
  API --> Ollama["Ollama optional"]
  Worker --> Ollama
```

Clean architecture in API and worker: domain, application, infrastructure, presentation. Details in [docs/architecture.md](docs/architecture.md).

## API-first

Use Docuvate headless behind your own apps and automations.

- OpenAPI: [openapi/docuvate.v1.json](openapi/docuvate.v1.json) (also served from the running API)
- Authorization: ABAC model (see [docs/adr/008-headless-v1-abac.md](docs/adr/008-headless-v1-abac.md))
- SDKs: [docs/sdks.md](docs/sdks.md)

## Editions

| Edition                     | What you get                                                                            | License                                                                                                  |
| --------------------------- | --------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| **Community (self-hosted)** | Full core product: OCR, labels, search, chat, connectors, API                           | [Sustainable Use License 1.0](./LICENSE) — free private and internal business use on your infrastructure |
| **Enterprise + Cloud**      | Business features, vendor-hosted SaaS, support (see [docuvate.de](https://docuvate.de)) | [Docuvate Enterprise License](./LICENSE_EE.md)                                                           |

Docuvate is **source-available** / **fair-code**, not OSI “open source”. Official SDKs ([`packages/sdk-node`](packages/sdk-node), [`packages/sdk-flutter`](packages/sdk-flutter)) are **MIT**.

**Historical:** Commits at or before `c3212765e196269b3c47a5e597897553c17824dd` (release **0.1.0**) were **AGPL-3.0**.

## Documentation

- [Self-hosting (Compose)](docs/self-hosting.md)
- [Architecture](docs/architecture.md)
- [Document processing pipeline](docs/document-processing-pipeline.md)
- [Connectors](docs/connectors.md)
- [Design tokens](docs/design-tokens.md)
- [Threat model (notes)](docs/threat-model.md)
- [ADRs](docs/adr/)

## Roadmap (planned)

These items are **not** promised timelines; they track known gaps and stubs on `main`:

- Login rate limiting (Valkey)
- Production observability defaults (OpenTelemetry collectors)
- Deeper Paperless migration adapter
- Expanded connector coverage and automation

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md), [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md), and [SECURITY.md](SECURITY.md). Before opening a pull request, run the same jobs as [.github/workflows/ci.yml](.github/workflows/ci.yml) locally (see [docs/local-ci.md](docs/local-ci.md)).

## Security

Report vulnerabilities privately: [SECURITY.md](SECURITY.md).

## License

Community Edition: [LICENSE](LICENSE) (Sustainable Use License 1.0). Enterprise: [LICENSE_EE.md](LICENSE_EE.md). SDKs: MIT. Trademarks: [TRADEMARKS.md](TRADEMARKS.md).
