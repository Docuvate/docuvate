import { SDK_FLUTTER_PUBSPEC, SDK_NODE_INSTALL_PNPM } from '../lib/sdkInstallSnippets.ts';
import type { SiteContent } from './types';

export const enContent: SiteContent = {
  nav: {
    docs: 'Documentation',
    api: 'API',
    sdks: 'SDKs',
    github: 'GitHub',
    comparisons: 'Comparisons',
    editions: 'Editions',
  },
  footer: {
    tagline: 'Self-hosted document intelligence on your own hardware.',
    product: 'Product',
    developers: 'Developers',
    comparisons: 'Comparisons',
    project: 'Project',
    legal: 'Legal',
    privacy: 'Privacy',
    imprint: 'Imprint',
    license: 'License (AGPL)',
    github: 'GitHub',
    contactEmail: 'hello@docuvate.de',
    copyrightLine: '© 2026 Docuvate',
    openApiJson: 'OpenAPI (JSON)',
  },
  legal: {
    emptyValue: 'Not provided yet',
    imprint: {
      title: 'Legal notice',
      ddgFallback: 'Information pursuant to § 5 DDG (Germany)',
      emailLabel: 'Email',
    },
    privacy: {
      title: 'Privacy',
      contactLabel: 'Contact',
      controllerLabel: 'Controller',
      paragraphs: [
        'This marketing site is a static website served via GitHub Pages (GitHub, Inc., USA). When you visit, technical data such as IP addresses may be processed in server logs. See https://docs.github.com/en/site-policy/privacy-policies/github-privacy-statement',
        'Legal basis for operating this information site is Art. 6(1)(f) GDPR (legitimate interest in an accessible product and documentation presence).',
        'Retention: log data at the hosting provider follows their policies; we do not store visitor profiles on this site.',
        'You have rights under Art. 15 to 21 GDPR (access, rectification, erasure, restriction, objection, data portability) and may lodge a complaint with a supervisory authority.',
        'Local storage: we only store your language (`docuvate-site-locale`) and theme (`docuvate-site-theme`) choices in localStorage so settings persist on your next visit.',
        'We do not set our own cookies and do not use Docuvate-operated tracking or analytics.',
      ],
    },
  },
  landing: {
    meta: {
      title: 'Docuvate: Self-hosted document intelligence',
      description:
        'Self-hosted document intelligence: OCR, auto-labeling, search and chat over your documents, on your own hardware.',
    },
    hero: {
      eyebrow: 'Self-hosted document intelligence',
      titleLine1: 'Understand your documents.',
      titleAccent: 'On your hardware.',
      lead:
        'OCR, auto-labeling, search and chat over your documents, on your own hardware.',
      primaryCta: 'Self-host',
      secondaryCta: 'Quickstart',
      productCards: [
        {
          id: 'library',
          title: 'Library and extraction',
          subtitle: 'Upload, status, and fields in one workspace.',
          screenshotId: 'library',
          imageAlt: 'Docuvate library document list',
        },
        {
          id: 'chat',
          title: 'Document chat',
          subtitle: 'Ask questions grounded in your document text.',
          screenshotId: 'chat',
          imageAlt: 'Chat panel on document view',
        },
      ],
    },
    proof: {
      items: [
        { id: 'agpl', label: 'Open source (AGPL)' },
        { id: 'local', label: 'Runs fully on your hardware' },
        { id: 'cpu', label: 'CPU is enough, no GPU required' },
        { id: 'openapi', label: 'OpenAPI and SDKs' },
      ],
    },
    why: {
      heading: 'Why Docuvate',
      lead: 'Self-host, work with structured fields, and integrate through an API.',
      cards: [
        {
          title: 'Local and CPU-friendly',
          body: 'OCR, embeddings, and chat run on your hardware without a cloud mandate.',
        },
        {
          title: 'Fields, not just full text',
          body: 'Amount, date, and sender are suggested and confirmed with one click.',
        },
        {
          title: 'API-first',
          body: 'OpenAPI contract, service keys, and SDKs for your integrations.',
        },
      ],
      compareLink: 'Docuvate vs. Paperless-ngx and others',
    },
    editions: {
      heading: 'Cost and editions',
      lead: 'Community self-hosting and commercial offerings operated by Docuvate.',
      selfHostedTitle: 'Self-hosted (Community)',
      selfHostedBody:
        'AGPL-3.0, free, full core feature set. You run Docker Compose or Kubernetes on your infrastructure.',
      cloudTitle: 'Docuvate Cloud / Business',
      cloudBody:
        'Commercial offering with support and operations by Docuvate. Details to follow; no prices listed here.',
    },
    featuresSection: {
      kicker: 'Product',
      heading: 'One workspace for ingest, structure, and answers',
      lead:
        'Crisp UI shots from the real app: library, fields, labels, folders, and document chat on infrastructure you operate.',
    },
    features: [
      {
        id: 'library',
        title: 'Library and upload',
        body:
          'Upload PDFs and scans, filter by status and metadata, and track extraction progress in one place.',
        bullets: [
          'Central upload and connector import',
          'Filter by status, labels, and metadata',
          'Per-document extraction progress',
        ],
        imageAlt: 'Docuvate library document list',
      },
      {
        id: 'fields',
        title: 'Recognized fields',
        body:
          'Amounts, dates, senders, and custom fields are suggested automatically. You confirm suggestions with one click.',
        bullets: [
          'Suggestions for amount, date, and sender',
          'Custom fields with one-click confirm',
          'Same data for search, chat, and API',
        ],
        imageAlt: 'Document detail with extracted fields',
      },
      {
        id: 'labels',
        title: 'Labels and folders',
        body:
          'Labels group topics; folders mirror how you file. Recommendations assist without forcing automation.',
        bullets: [
          'Color labels for topics and projects',
          'Folder tree that matches how you file',
          'Recommendations you accept or ignore',
        ],
        imageAlt: 'Labels and folder explorer',
      },
      {
        id: 'chat',
        title: 'Document chat',
        body:
          'Ask about a document with a locally connected chat model (e.g. Ollama). Answers use the recognized text in your file.',
        bullets: [
          'Chat per document on extracted text',
          'Locally connected model (e.g. Ollama)',
          'No sending files to third-party clouds',
        ],
        imageAlt: 'Chat panel on document view',
      },
    ],
    steps: {
      heading: 'How it works',
      items: [
        {
          title: '1. Ingest',
          body: 'Upload manually or pull from a connector. Docuvate stores the original in object storage.',
        },
        {
          title: '2. Extract',
          body: 'The worker pulls text and fields. Progress and results appear in the UI.',
        },
        {
          title: '3. Use',
          body:
            'Find documents again with labels, folders, and full-text search. Chat and the API use the same underlying data.',
        },
      ],
    },
    developers: {
      heading: 'API-first for your stack',
      body:
        'Connect scripts, portals, and back-office tools with service keys. Same documents and labels as the web UI, without screen scraping.',
      primaryCta: 'API reference',
      secondaryCta: 'SDK guide',
      codeCaption: 'Node.js',
      installSnippet: SDK_NODE_INSTALL_PNPM,
      code: `import { DocuvateClient } from '@docuvate/sdk';

const client = new DocuvateClient({
  baseUrl: 'https://your-host/v1',
  apiKey: process.env.DOCUVATE_API_KEY,
});

const { data, error } = await client.api.listDocuments({
  query: { q: 'lease agreement', status: 'ready' },
});
if (error) throw error;

for (const doc of data.items) {
  console.log(doc.title, doc.documentDate);
}`,
    },
    closingCta: {
      heading: 'Self-host on infrastructure you control',
      body:
        'No per-seat cloud bill. Run Docuvate on your server, VM, or NAS. You choose when to upgrade, with optional fully local AI. License: AGPL. You run the stack; you own the data.',
      note: '',
      primaryCta: 'Installation guide',
      secondaryCta: 'View source on GitHub',
    },
    integrations: {
      heading: 'Integrations',
      lead: 'Connections for import and automation, from cloud storage to services on your network.',
      items: [
        {
          id: 'amazon_s3',
          name: 'Amazon S3',
          description: 'Import objects from a bucket into your library.',
        },
        {
          id: 'paperless',
          name: 'Paperless-ngx',
          description: 'Bridge an existing DMS archive.',
        },
        {
          id: 'home_assistant',
          name: 'Home Assistant',
          description: 'Trigger automations from document events.',
        },
        {
          id: 'gmail',
          name: 'Gmail',
          description: 'Mail attachments as a source.',
        },
        {
          id: 'outlook',
          name: 'Microsoft Outlook',
          description: 'Mail attachments as a source.',
        },
        {
          id: 'sftp',
          name: 'SFTP scanner',
          description: 'Scanner ingest via SFTP on your network (per repository).',
        },
      ],
    },
    faq: {
      heading: 'FAQ',
      items: [
        {
          question: 'Who is Docuvate for?',
          answer:
            'Tax advisors, small businesses, and households that want PDFs and scans organized without mandatory cloud storage.',
        },
        {
          question: 'Do I need a GPU?',
          answer:
            'Not to start. OCR and chat paths are CPU-friendly; heavier models are optional and documented.',
        },
        {
          question: 'How do I connect Docuvate to other systems?',
          answer:
            'Sign in through the web app for day-to-day use. For scripts and third-party tools, create a service key and use the HTTP API described in the API reference.',
        },
        {
          question: 'How do updates work?',
          answer:
            'You deploy and upgrade on your schedule. Breaking changes are versioned; the exported OpenAPI document describes the contract.',
        },
      ],
    },
  },
  docs: {
    meta: {
      title: 'Docuvate documentation',
      description: 'Quickstart, concepts, and self-hosting configuration.',
    },
    intro: {
      heading: 'Overview',
      lead:
        'Docuvate combines a web app, API, and extraction service. This page covers operations, concepts, and self-hosting.',
    },
    quickstart: {
      heading: 'Quickstart with Docker Compose',
      steps: [
        'Clone the repository and copy `.env.example` to `.env`.',
        'Set secrets: BETTER_AUTH_SECRET (32+ characters), DOCUVATE_CONNECTOR_SECRETS_KEY.',
        'Run `docker compose up --build` at the repo root. Web on port 5173, API on 3001.',
        'Register the first user in the web UI and upload a test document.',
      ],
    },
    concepts: {
      heading: 'Concepts',
      items: [
        {
          title: 'Documents',
          body: 'Each file has status, preview, extracted text, and metadata. Bytes live in MinIO; metadata in PostgreSQL.',
        },
        {
          title: 'Labels',
          body: 'Free-form tags with colors. Recommendations suggest assignments; you accept or ignore them.',
        },
        {
          title: 'Folders',
          body: 'Hierarchical filing (filesystem). Documents may appear in multiple folders.',
        },
        {
          title: 'Recognized fields',
          body: 'Settings define which fields to look for. Suggestions appear with a confidence hint.',
        },
        {
          title: 'Chat',
          body: 'Per-document conversations. Choose how answers are generated in settings.',
        },
        {
          title: 'Connections',
          body: 'Connections link sources such as S3 or mail. Credentials are stored encrypted.',
        },
      ],
    },
    selfHosting: {
      heading: 'Self-hosting configuration',
      intro: 'Variables from `.env.example`. Values shown are local development defaults.',
      envGroups: [
        {
          title: 'Database and cache',
          vars: [
            { name: 'DATABASE_URL', description: 'PostgreSQL connection for API and migrations.' },
            { name: 'VALKEY_URL', description: 'Valkey (Redis-compatible) for queues and cache.' },
          ],
        },
        {
          title: 'Object storage',
          vars: [
            { name: 'MINIO_ENDPOINT', description: 'Hostname of the S3-compatible endpoint.' },
            { name: 'MINIO_PORT', description: 'Port of the storage service.' },
            { name: 'MINIO_ACCESS_KEY', description: 'Access key for buckets.' },
            { name: 'MINIO_SECRET_KEY', description: 'Secret key for buckets.' },
            { name: 'MINIO_BUCKET', description: 'Bucket name for document files (for example documents).' },
          ],
        },
        {
          title: 'Auth and web',
          vars: [
            { name: 'BETTER_AUTH_SECRET', description: 'Signing secret for sessions (long, random).' },
            { name: 'BETTER_AUTH_URL', description: 'Public API URL for auth callbacks.' },
            { name: 'WEB_ORIGIN', description: 'Allowed browser origin for CORS and cookies.' },
            { name: 'VITE_API_URL', description: 'API base for the web app dev build.' },
          ],
        },
        {
          title: 'Extraction and chat',
          vars: [
            { name: 'WORKER_URL', description: 'Internal URL of the extraction service.' },
            { name: 'WORKER_SECRET', description: 'Shared secret between API and extraction service.' },
            { name: 'DOCUMENT_CHAT_PROVIDER', description: 'Chat backend for document Q&A.' },
            { name: 'OLLAMA_URL', description: 'Optional endpoint for local language models.' },
            { name: 'OLLAMA_MODEL', description: 'Optional model name for local answers.' },
          ],
        },
        {
          title: 'Service API and connections',
          vars: [
            { name: 'DOCUVATE_SERVICE_API_KEYS', description: 'JSON array with keyId, secret, tenantUserId, claims.' },
            { name: 'DOCUVATE_CONNECTOR_SECRETS_KEY', description: 'AES key for connection secrets.' },
            { name: 'DOCUVATE_GMAIL_OAUTH_CLIENT_ID', description: 'Optional for Gmail connection.' },
            { name: 'DOCUVATE_OUTLOOK_OAUTH_CLIENT_ID', description: 'Optional for Outlook connection.' },
          ],
        },
      ],
    },
  },
  apiPage: {
    lead:
      'HTTP interface for documents, labels, folders, and chat. Contract: `GET /v1/openapi.json` on your instance, the same description as the [interactive API reference](/docs/api).',
  },
  sdks: {
    meta: {
      title: 'Docuvate SDKs',
      description: 'Node and Flutter clients for the headless /v1 API.',
    },
    pageLead:
      'Official clients for scripts and integrations. The contract and codegen follow the OpenAPI document exported from your instance.',
    previewBadge: 'Preview',
    overviewTable: {
      headings: {
        sdk: 'SDK',
        package: 'Package',
        status: 'Status',
        section: 'Section',
      },
      rows: [
        {
          sdk: 'Node.js and TypeScript',
          packageName: '@docuvate/sdk',
          sectionId: 'node-sdk',
          sectionLabel: 'Node.js and TypeScript',
          preview: true,
        },
        {
          sdk: 'Flutter',
          packageName: 'docuvate',
          sectionId: 'flutter-sdk',
          sectionLabel: 'Flutter',
          preview: true,
        },
      ],
    },
    introLead:
      'Official Node and Flutter clients for the headless /v1 API. The contract and codegen follow the exported OpenAPI document.',
    introRuntimeSpec:
      'Your instance serves the OpenAPI description at `GET /v1/openapi.json`, matching the [interactive API reference](/docs/api).',
    introCodegenNote:
      'After API changes in your self-hosted setup: export OpenAPI and regenerate SDKs (`pnpm openapi:export`, `pnpm sdk:codegen`).',
    copyCode: 'Copy',
    copiedCode: 'Copied',
    serviceCredentials: {
      heading: 'Set up service access',
      body:
        'Scripts and integrations use a service API key. The key is bound to a user and can carry document permissions.',
      steps: [
        'Set `DOCUVATE_SERVICE_API_KEYS` in `.env` as a JSON array (keyId, secret, tenantUserId, claims).',
        'Call the API at `https://your-host/v1`.',
        'Send the secret as `Authorization: Bearer <secret>` or `X-Docuvate-Api-Key`.',
      ],
    },
    node: {
      id: 'node-sdk',
      heading: 'Node.js and TypeScript',
      preview: true,
      previewNote: '',
      installHeading: 'Install Node.js SDK',
      installBody: 'Install `@docuvate/sdk` from the public Git repository:',
      installSnippet: SDK_NODE_INSTALL_PNPM,
      installSnippetLanguage: 'typescript',
      auth:
        '`DocuvateClient` with `baseUrl` and `apiKey` (service API key). Configure keys in the Service access section on this page.',
      examples: [
        {
          title: 'Search documents',
          language: 'typescript',
          code: [
            "import { DocuvateClient } from '@docuvate/sdk';",
            '',
            'const client = new DocuvateClient({',
            "  baseUrl: 'https://your-host/v1',",
            "  apiKey: process.env.DOCUVATE_API_KEY,",
            '});',
            '',
            'const { data, error } = await client.api.listDocuments({',
            "  query: { q: 'lease agreement', status: 'ready' },",
            '});',
            'if (error) throw error;',
            '',
            'for (const doc of data.items) {',
            '  console.log(doc.title, doc.documentDate);',
            '}',
          ].join('\n'),
        },
        {
          title: 'Create a label',
          language: 'typescript',
          code: "await client.api.createTag({ body: { name: 'Inbox' } });",
        },
        {
          title: 'Ask in chat',
          language: 'typescript',
          code: [
            'const reply = await client.api.chat({',
            '  path: { id: documentId },',
            "  body: { message: 'What due date is mentioned?' },",
            '});',
            'if (reply.error) throw reply.error;',
            'console.log(reply.data.reply.content);',
          ].join('\n'),
        },
      ],
    },
    flutter: {
      id: 'flutter-sdk',
      heading: 'Flutter',
      preview: true,
      previewNote: '',
      installHeading: 'Install Flutter SDK',
      installBody: 'Add the Git dependency in `pubspec.yaml` and run `flutter pub get`:',
      installSnippet: SDK_FLUTTER_PUBSPEC,
      installSnippetLanguage: 'yaml',
      auth: '`DocuvateClientConfig` with `baseUrl` and `apiKey` for headless access.',
      examples: [
        {
          title: 'Upload a document',
          language: 'dart',
          code: [
            'final client = DocuvateClient(',
            '  DocuvateClientConfig(',
            "    baseUrl: 'https://your-host/v1',",
            '    apiKey: apiKey,',
            '  ),',
            ');',
            'await client.documents.createDocument(/* MultipartFile */);',
          ].join('\n'),
        },
        {
          title: 'List labels',
          language: 'dart',
          code: "final tags = await client.taxonomy.listTags();\nprint(tags.data?.items);",
        },
        {
          title: 'Ask in chat',
          language: 'dart',
          code: [
            'final response = await client.documents.chat(',
            '  id: documentId,',
            '  documentChatRequestDto: DocumentChatRequestDto(',
            "    message: 'What due date is mentioned?',",
            '  ),',
            ');',
            'print(response.data?.reply.content);',
          ].join('\n'),
        },
      ],
    },
  },
};
