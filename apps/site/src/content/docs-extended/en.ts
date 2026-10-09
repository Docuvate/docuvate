import type { DocsExtendedContent } from './types';

export const docsExtendedEn: DocsExtendedContent = {
  nav: [
    {
      title: 'Getting started',
      items: [
        { path: '/docs', label: 'Overview' },
        { path: '/docs/motivation', label: 'Motivation' },
        { path: '/docs/architecture', label: 'Architecture' },
      ],
    },
    {
      title: 'Operations',
      items: [
        { path: '/docs#self-hosting', label: 'Self-hosting configuration' },
        { path: '/docs/backup-and-upgrade', label: 'Backup and upgrade' },
        { path: '/docs/models', label: 'Models (AI)' },
        { path: '/docs/kubernetes', label: 'Kubernetes' },
      ],
    },
    {
      title: 'Developers',
      items: [
        { path: '/docs/api', label: 'API reference' },
        { path: '/docs/sdks', label: 'SDKs' },
        { path: '/docs/service-api-keys', label: 'Service API keys' },
      ],
    },
    {
      title: 'Comparisons',
      items: [
        { path: '/docs/comparisons/methodology', label: 'Methodology' },
        { path: '/docs/comparisons/paperless-ngx', label: 'vs Paperless-ngx' },
        { path: '/docs/comparisons/papra', label: 'vs Papra' },
        { path: '/docs/comparisons/docspell', label: 'vs Docspell' },
        { path: '/docs/comparisons/mayan-edms', label: 'vs Mayan EDMS' },
        { path: '/docs/comparisons/docuware', label: 'vs DocuWare' },
      ],
    },
  ],
  motivation: {
    meta: {
      title: 'Motivation | Docuvate documentation',
      description: 'Background and goals for Docuvate.',
    },
    title: 'Motivation',
    lead: 'Why Docuvate exists and which problems it targets.',
    sections: [],
  },
  architecture: {
    meta: {
      title: 'Architecture | Docuvate documentation',
      description: 'Runtime topology, layers, and core ports.',
    },
    title: 'Architecture',
    lead:
      'Docuvate uses clean architecture in the API and worker: domain, application, infrastructure, and presentation stay separate.',
    sections: [
      {
        id: 'runtime',
        heading: 'Runtime',
        paragraphs: [
          'The web app talks to the NestJS API. The API uses PostgreSQL for metadata, MinIO (S3-compatible) for files, Valkey for queues and cache, and the FastAPI worker for OCR, embeddings, and chat RAG.',
        ],
      },
      {
        id: 'layers',
        heading: 'Layers',
        bullets: [
          'Domain: entities, ports, domain errors (no framework imports).',
          'Application: use cases orchestrating ports.',
          'Infrastructure: Postgres, MinIO, Valkey, HTTP worker, better-auth.',
          'Presentation: Nest controllers and React routes in the web app.',
        ],
        paragraphs: [],
      },
      {
        id: 'ports',
        heading: 'Core ports (selection)',
        bullets: [
          'DocumentRepository, ObjectStorage, ExtractionPort, SearchPort, DocumentChatPort.',
          'FolderRepository, DuplicateRepository, EmbeddingPort.',
          'Session auth via better-auth; service API keys for headless access.',
        ],
        paragraphs: [
          'See `docs/architecture.md` in the repository for the full port table. OpenTelemetry is off in default Compose; production can export to SigNoz or Sentry.',
        ],
      },
    ],
  },
  serviceApiKeys: {
    meta: {
      title: 'Service API keys | Docuvate documentation',
      description: 'Service API keys, claims, and permissions for integrations.',
    },
    title: 'Service API keys and claims',
    lead:
      'Use service API keys for scripts and third-party systems instead of browser sessions. Each key is bound to a user and carries ABAC permissions.',
    sections: [
      {
        id: 'create',
        heading: 'Create a key',
        bullets: [
          'Set `DOCUVATE_SERVICE_API_KEYS` in `.env` as a JSON array with `keyId`, `secret`, `tenantUserId`, and `claims`.',
          'Restart the API so keys are loaded.',
          'Send the secret in `Authorization: Bearer <secret>` or `X-Docuvate-Api-Key`.',
        ],
        paragraphs: [],
      },
      {
        id: 'claims',
        heading: 'Claims (permissions)',
        paragraphs: [
          'Claims describe which actions the key may perform (for example read documents or manage labels). The exact shape matches the OpenAPI contract and SDK docs.',
          'See the [SDK guide](/docs/sdks#service-credentials) for a full example and test against `GET /v1/openapi.json` on your instance.',
        ],
      },
      {
        id: 'security',
        heading: 'Security',
        bullets: [
          'Treat secrets like passwords: do not commit them, plan rotation.',
          'Use one key per integration with minimal claims.',
          'Production URLs and TLS are your responsibility (reverse proxy, certificates).',
        ],
        paragraphs: [],
      },
    ],
  },
  backupUpgrade: {
    meta: {
      title: 'Backup and upgrade | Docuvate documentation',
      description: 'Backups, migrations, and controlled upgrades when self-hosting.',
    },
    title: 'Backup and upgrade',
    lead:
      'Docuvate stores metadata in PostgreSQL and files in MinIO. Back up both layers and apply schema changes through TypeORM migrations.',
    sections: [
      {
        id: 'volumes',
        heading: 'What to back up',
        bullets: [
          'PostgreSQL volume (`pgdata`): users, labels, document metadata, embeddings.',
          'MinIO volume (`miniodata`): document blobs.',
          'Optional worker ML cache (`workermlcache`): speeds rebuilds, not required for data recovery.',
        ],
        paragraphs: [],
      },
      {
        id: 'migrations',
        heading: 'Migrations',
        paragraphs: [
          'Schema changes are TypeORM migrations with `up` and `down` in `apps/api`. The API does not auto-run migrations (`migrationsRun: false`).',
          'In Docker Compose the one-shot `migrate` service upgrades before API and worker. Locally: `pnpm db:migrate` with `DATABASE_URL` set.',
        ],
      },
      {
        id: 'upgrade',
        heading: 'Upgrade flow',
        bullets: [
          'Back up Postgres and MinIO.',
          'Build or pull new images; run `docker compose up --build` (migrate job must succeed).',
          'Read release notes and OpenAPI for breaking changes; regenerate SDKs if needed.',
        ],
        paragraphs: [
          '`db-storage-guard` stops startup when Postgres is empty but the MinIO bucket still has files. Override only with `DOCUVATE_FRESH_STACK=1` when intentional.',
        ],
      },
    ],
  },
  models: {
    meta: {
      title: 'Models (AI) | Docuvate documentation',
      description: 'OCR, embeddings, and document chat: CPU-first, GPU optional.',
    },
    title: 'Models and hardware',
    lead:
      'Docuvate is CPU-first: OCR, embeddings, and the default chat run without a GPU. Heavier models are optional and documented in settings.',
    sections: [
      {
        id: 'ocr',
        heading: 'OCR and extraction',
        bullets: [
          'Default: PaddleOCR PP-OCRv4 (Latin script, including German) in the worker.',
          'Text-layer PDFs skip OCR; Tesseract or Docling are optional.',
          'Heuristic fields (amount, date, sender) from extracted text.',
        ],
        paragraphs: [],
      },
      {
        id: 'embeddings',
        heading: 'Embeddings and search',
        paragraphs: [
          'Document embeddings via the worker (`paraphrase-multilingual-MiniLM-L12-v2`). Label suggestions use cosine similarity, not an LLM.',
          'Full-text search with optional typo tolerance (`pg_trgm`) and field filters; semantic components per repository configuration.',
        ],
      },
      {
        id: 'chat',
        heading: 'Document chat',
        bullets: [
          'Compose default: RAG over extracted text plus Ollama (for example `qwen2.5:3b` on CPU).',
          'Donut/GPU paths are optional and enabled in the UI only with suitable hardware.',
          'No sending your files to cloud LLM vendors on the product path.',
        ],
        paragraphs: [
          'Variables: `DOCUMENT_CHAT_PROVIDER`, `OLLAMA_URL`, `OLLAMA_MODEL`, `WORKER_URL`. Details: `docs/ai-models.md` in the repository.',
        ],
      },
    ],
  },
  kubernetes: {
    meta: {
      title: 'Kubernetes | Docuvate documentation',
      description: 'Kustomize and Helm manifests for Docuvate on Kubernetes.',
    },
    title: 'Kubernetes',
    lead:
      'For production the repository ships Kustomize bases and Helm charts. The flow matches Compose: migrate job, then API and worker.',
    sections: [
      {
        id: 'manifests',
        heading: 'Manifests',
        bullets: [
          'Kustomize under `deploy/kustomize/` (dev/prod overlays).',
          'Helm chart under `deploy/helm/docuvate/`.',
          'Validation: `tools/k8s-manifest-validate.sh` (local and CI).',
        ],
        paragraphs: [],
      },
      {
        id: 'migrate',
        heading: 'Migrations in the cluster',
        paragraphs: [
          'Helm uses a `post-install,pre-upgrade` migrate job; Kustomize includes `deploy/kustomize/base/jobs/db-migrate.yaml`.',
          'Same command as Compose: `node dist/shared/infrastructure/database/run-migrate.js`.',
        ],
      },
      {
        id: 'gitops',
        heading: 'GitOps and examples',
        paragraphs: [
          'Examples for secrets, ingress, and storage classes: `deploy/gitops/examples/` and `docs/deploy/kubernetes.md`.',
        ],
      },
    ],
  },
  comparisons: {
    meta: {
      title: 'Comparisons | Docuvate documentation',
      description: 'Honest comparisons with Paperless-ngx, Papra, Docspell, Mayan EDMS, and DocuWare.',
    },
    overviewTitle: 'Comparisons',
    overviewLead:
      'Same criteria in the same order. Unknown items are marked as not verified, not omitted.',
    methodologyTitle: 'Rubric and methodology',
    allLink: 'Rubric and methodology',
    selfHostCta: 'Self-host',
    testCtaHeading: 'Try Docuvate in 10 minutes',
    testCtaBody: 'Start the stack with Docker Compose on your machine.',
    correctionNote:
      'Something outdated? Email hello@docuvate.de and we will update the tables.',
    competitorStrengthsTitle: (name) => `Where ${name} is stronger`,
    docuvateStrengthsTitle: 'Where Docuvate is stronger',
    whenToChooseTitle: 'When to choose which',
    migrationTitle: 'Migration and parallel operation',
    chooseThemLabel: (name) => `Choose ${name} if`,
    chooseUsLabel: 'Choose Docuvate if',
    standLabel: 'As of',
  },
};
