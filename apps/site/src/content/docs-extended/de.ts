import type { DocsExtendedContent } from './types';

export const docsExtendedDe: DocsExtendedContent = {
  nav: [
    {
      title: 'Einstieg',
      items: [
        { path: '/docs', label: 'Übersicht' },
        { path: '/docs/motivation', label: 'Motivation' },
        { path: '/docs/architektur', label: 'Architektur' },
      ],
    },
    {
      title: 'Betrieb',
      items: [
        { path: '/docs#self-hosting', label: 'Self-Hosting-Konfiguration' },
        { path: '/docs/backup-und-upgrade', label: 'Backup und Upgrade' },
        { path: '/docs/modelle', label: 'Modelle (KI)' },
        { path: '/docs/kubernetes', label: 'Kubernetes' },
      ],
    },
    {
      title: 'Entwickler',
      items: [
        { path: '/docs/api', label: 'API-Referenz' },
        { path: '/docs/sdks', label: 'SDKs' },
        { path: '/docs/service-schluessel', label: 'Service-Schlüssel' },
      ],
    },
    {
      title: 'Vergleiche',
      items: [
        { path: '/docs/vergleiche/methodik', label: 'Methodik' },
        { path: '/docs/vergleiche/paperless-ngx', label: 'vs Paperless-ngx' },
        { path: '/docs/vergleiche/papra', label: 'vs Papra' },
        { path: '/docs/vergleiche/docspell', label: 'vs Docspell' },
        { path: '/docs/vergleiche/mayan-edms', label: 'vs Mayan EDMS' },
        { path: '/docs/vergleiche/docuware', label: 'vs DocuWare' },
      ],
    },
  ],
  motivation: {
    meta: {
      title: 'Motivation | Docuvate Dokumentation',
      description: 'Hintergrund und Ziele von Docuvate.',
    },
    title: 'Motivation',
    lead: 'Warum Docuvate entstanden ist und welche Probleme es lösen soll.',
    sections: [],
  },
  architecture: {
    meta: {
      title: 'Architektur | Docuvate Dokumentation',
      description: 'Laufzeit, Schichten und zentrale Ports der Docuvate-Plattform.',
    },
    title: 'Architektur',
    lead:
      'Docuvate folgt Clean Architecture in API und Worker: Domain, Anwendungslogik, Infrastruktur und Präsentation sind getrennt.',
    sections: [
      {
        id: 'laufzeit',
        heading: 'Laufzeit',
        paragraphs: [
          'Die Web-App spricht mit der NestJS-API. Die API nutzt PostgreSQL für Metadaten, MinIO (S3-kompatibel) für Dateien, Valkey für Queues und Cache sowie den FastAPI-Worker für OCR, Embeddings und Chat-RAG.',
        ],
      },
      {
        id: 'schichten',
        heading: 'Schichten',
        bullets: [
          'Domain: Entitäten, Ports, Domänenfehler (ohne Framework-Imports).',
          'Application: Use Cases orchestrieren Ports.',
          'Infrastructure: Postgres, MinIO, Valkey, HTTP-Worker, better-auth.',
          'Presentation: Nest-Controller, React-Routen in der Web-App.',
        ],
        paragraphs: [],
      },
      {
        id: 'ports',
        heading: 'Zentrale Ports (Auswahl)',
        bullets: [
          'DocumentRepository, ObjectStorage, ExtractionPort, SearchPort, DocumentChatPort.',
          'FolderRepository, DuplicateRepository, EmbeddingPort.',
          'Session-Auth über better-auth; Service-API-Schlüssel für Headless-Zugriff.',
        ],
        paragraphs: [
          'Details und Port-Tabelle finden Sie im Repository unter `docs/architecture.md`. OpenTelemetry ist im Standard-Compose aus; Produktion kann SigNoz oder Sentry anbinden.',
        ],
      },
    ],
  },
  serviceApiKeys: {
    meta: {
      title: 'Service-Schlüssel | Docuvate Dokumentation',
      description: 'Service-API-Schlüssel, Claims und Berechtigungen für Integrationen.',
    },
    title: 'Service-Schlüssel und Claims',
    lead:
      'Für Skripte und Drittsysteme verwenden Sie Service-API-Schlüssel statt Browser-Sessions. Jeder Schlüssel ist an einen Benutzer gebunden und trägt Berechtigungen (ABAC).',
    sections: [
      {
        id: 'anlegen',
        heading: 'Schlüssel anlegen',
        bullets: [
          'Setzen Sie `DOCUVATE_SERVICE_API_KEYS` in `.env` als JSON-Array mit `keyId`, `secret`, `tenantUserId` und `claims`.',
          'Starten Sie die API neu, damit die Schlüssel geladen werden.',
          'Senden Sie den Secret-Wert im Header `Authorization: Bearer <secret>` oder `X-Docuvate-Api-Key`.',
        ],
        paragraphs: [],
      },
      {
        id: 'claims',
        heading: 'Claims (Berechtigungen)',
        paragraphs: [
          'Claims beschreiben, welche Aktionen der Schlüssel ausführen darf (z. B. Dokumente lesen, Labels verwalten). Die genaue Struktur entspricht dem OpenAPI-Vertrag und der SDK-Dokumentation.',
          'Prüfen Sie in der [SDK-Anleitung](/docs/sdks#service-credentials) ein vollständiges Beispiel und testen Sie mit Ihrer Instanz unter `GET /v1/openapi.json`.',
        ],
      },
      {
        id: 'sicherheit',
        heading: 'Sicherheit',
        bullets: [
          'Behandeln Sie Secrets wie Passwörter: nicht in Git committen, Rotation planen.',
          'Vergeben Sie pro Integration einen eigenen Schlüssel mit minimalen Claims.',
          'Produktions-URLs und TLS liegen in Ihrer Verantwortung (Reverse Proxy, Zertifikate).',
        ],
        paragraphs: [],
      },
    ],
  },
  backupUpgrade: {
    meta: {
      title: 'Backup und Upgrade | Docuvate Dokumentation',
      description: 'Daten sichern, Migrationen und kontrollierte Upgrades bei Self-Hosting.',
    },
    title: 'Backup und Upgrade',
    lead:
      'Docuvate speichert Metadaten in PostgreSQL und Dateien in MinIO. Planen Sie Backups beider Ebenen und führen Sie Schema-Änderungen über TypeORM-Migrationen aus.',
    sections: [
      {
        id: 'volumes',
        heading: 'Was sichern?',
        bullets: [
          'PostgreSQL-Volume (`pgdata`): Benutzer, Labels, Dokumentmetadaten, Embeddings.',
          'MinIO-Volume (`miniodata`): Dokument-Blobs.',
          'Optional Worker-ML-Cache (`workermlcache`): beschleunigt Rebuilds, nicht zwingend für Datenwiederherstellung.',
        ],
        paragraphs: [],
      },
      {
        id: 'migrationen',
        heading: 'Migrationen',
        paragraphs: [
          'Schema-Änderungen sind TypeORM-Migrationen mit `up` und `down` in `apps/api`. Die API startet keine Migrationen automatisch (`migrationsRun: false`).',
          'In Docker Compose übernimmt der einmalige `migrate`-Service das Upgrade vor API und Worker. Lokal: `pnpm db:migrate` mit gesetzter `DATABASE_URL`.',
        ],
      },
      {
        id: 'upgrade',
        heading: 'Upgrade-Ablauf',
        bullets: [
          'Backup von Postgres und MinIO erstellen.',
          'Neues Image bauen oder pullen, `docker compose up --build` (Migrate-Job muss erfolgreich sein).',
          'Release Notes und OpenAPI auf Breaking Changes prüfen; SDK bei Bedarf neu generieren.',
        ],
        paragraphs: [
          'Der `db-storage-guard` stoppt den Start, wenn Postgres leer ist, aber der MinIO-Bucket noch Dateien enthält (häufig nach Projekt-Umbenennung). Nur mit `DOCUVATE_FRESH_STACK=1` bewusst überschreiben.',
        ],
      },
    ],
  },
  models: {
    meta: {
      title: 'Modelle (KI) | Docuvate Dokumentation',
      description: 'OCR, Embeddings und Dokumenten-Chat: CPU-first, optional GPU.',
    },
    title: 'Modelle und Hardware',
    lead:
      'Docuvate ist CPU-first: OCR, Embeddings und der Standard-Chat laufen ohne GPU. Schwere Modelle sind optional und in den Einstellungen dokumentiert.',
    sections: [
      {
        id: 'ocr',
        heading: 'OCR und Extraktion',
        bullets: [
          'Standard: PaddleOCR PP-OCRv4 (lateinische Schrift, Deutsch inklusive) im Worker.',
          'PDFs mit Textlayer werden ohne OCR gelesen; optional Tesseract oder Docling.',
          'Heuristische Felder (Betrag, Datum, Absender) aus dem erkannten Text.',
        ],
        paragraphs: [],
      },
      {
        id: 'embeddings',
        heading: 'Embeddings und Suche',
        paragraphs: [
          'Dokument-Embeddings über den Worker (`paraphrase-multilingual-MiniLM-L12-v2`). Label-Vorschläge nutzen Cosinus-Ähnlichkeit, kein LLM.',
          'Volltextsuche mit optionaler Tippfehler-Toleranz (`pg_trgm`) und Feldfiltern; semantische Komponenten laut Repository-Konfiguration.',
        ],
      },
      {
        id: 'chat',
        heading: 'Dokumenten-Chat',
        bullets: [
          'Standard in Compose: RAG über erkannten Text plus Ollama (z. B. `qwen2.5:1.5b` auf CPU).',
          'Donut/GPU-Pfade sind optional und in der UI nur bei passender Hardware freigeschaltet.',
          'Kein Versand Ihrer Dateien an Cloud-LLM-Anbieter im Produktpfad.',
        ],
        paragraphs: [
          'Variablen: `DOCUMENT_CHAT_PROVIDER`, `OLLAMA_URL`, `OLLAMA_MODEL`, `WORKER_URL`. Details: `docs/ai-models.md` im Repository.',
        ],
      },
    ],
  },
  kubernetes: {
    meta: {
      title: 'Kubernetes | Docuvate Dokumentation',
      description: 'Kustomize- und Helm-Manifeste für Docuvate auf Kubernetes.',
    },
    title: 'Kubernetes',
    lead:
      'Für Produktion stellt das Repository Kustomize-Basen und Helm-Charts bereit. Der Ablauf entspricht Compose: Migration-Job, dann API und Worker.',
    sections: [
      {
        id: 'manifeste',
        heading: 'Manifeste',
        bullets: [
          'Kustomize unter `deploy/kustomize/` (dev/prod-Overlays).',
          'Helm-Chart unter `deploy/helm/docuvate/`.',
          'Validierung: `tools/k8s-manifest-validate.sh` (lokal und in CI).',
        ],
        paragraphs: [],
      },
      {
        id: 'migrate',
        heading: 'Migrationen im Cluster',
        paragraphs: [
          'Helm nutzt einen `post-install,pre-upgrade` Migrate-Job; Kustomize enthält `deploy/kustomize/base/jobs/db-migrate.yaml`.',
          'Gleicher Befehl wie in Compose: `node dist/shared/infrastructure/database/run-migrate.js`.',
        ],
      },
      {
        id: 'gitops',
        heading: 'GitOps und Beispiele',
        paragraphs: [
          'Beispiele und Hinweise zu Secrets, Ingress und Storage-Klassen: `deploy/gitops/examples/` und `docs/deploy/kubernetes.md`.',
        ],
      },
    ],
  },
  comparisons: {
    meta: {
      title: 'Vergleiche | Docuvate Dokumentation',
      description: 'Ehrliche Gegenüberstellung mit Paperless-ngx, Papra, Docspell, Mayan EDMS und DocuWare.',
    },
    overviewTitle: 'Vergleiche',
    overviewLead:
      'Gleiche Kriterien, gleiche Reihenfolge. Unbekanntes ist als „nicht verifiziert“ markiert, nicht weggelassen.',
    methodologyTitle: 'Rubrik und Methodik',
    allLink: 'Rubrik und Methodik',
    selfHostCta: 'Selbst hosten',
    testCtaHeading: 'Docuvate in 10 Minuten testen',
    testCtaBody: 'Starten Sie den Stack mit Docker Compose auf Ihrer Maschine.',
    correctionNote:
      'Stimmt etwas nicht mehr? Schreiben Sie an hello@docuvate.de; wir korrigieren die Tabellen.',
    competitorStrengthsTitle: (name) => `Wo ${name} stärker ist`,
    docuvateStrengthsTitle: 'Wo Docuvate stärker ist',
    whenToChooseTitle: 'Wann Sie was wählen sollten',
    migrationTitle: 'Wechsel und Parallelbetrieb',
    chooseThemLabel: (name) => `${name} wählen, wenn`,
    chooseUsLabel: 'Docuvate wählen, wenn',
    standLabel: 'Stand',
  },
};
