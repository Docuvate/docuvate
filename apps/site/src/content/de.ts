import { SDK_FLUTTER_PUBSPEC, SDK_NODE_INSTALL_PNPM } from '../lib/sdkInstallSnippets.ts';
import type { SiteContent } from './types';

export const deContent: SiteContent = {
  nav: {
    docs: 'Dokumentation',
    api: 'API',
    sdks: 'SDKs',
    github: 'GitHub',
  },
  footer: {
    tagline: 'Selbst gehostete Dokumentenanalyse für Ihre Infrastruktur.',
    product: 'Produkt',
    developers: 'Entwickler',
    project: 'Projekt',
    language: 'Sprache',
    legal: 'Rechtliches',
    privacy: 'Datenschutz',
    imprint: 'Impressum',
    license: 'Lizenz (AGPL)',
    github: 'GitHub',
  },
  legal: {
    emptyValue: 'Noch nicht hinterlegt',
    imprint: {
      title: 'Impressum',
      ddgFallback: 'Angaben gemäß § 5 DDG',
      emailLabel: 'E-Mail',
    },
    privacy: {
      title: 'Datenschutz',
      contactLabel: 'Kontakt',
      paragraphs: [
        'Diese Marketing-Website ist eine statische Seite, die über GitHub Pages ausgeliefert wird.',
        'Beim Aufruf kann GitHub (GitHub, Inc.) technische Daten wie IP-Adressen in Server-Logfiles verarbeiten. Details finden Sie in der Datenschutzerklärung von GitHub.',
        'Wir setzen auf dieser Site keine eigenen Cookies ein und nutzen kein Tracking oder Analytics durch Docuvate.',
      ],
    },
  },
  landing: {
    meta: {
      title: 'Docuvate: Selbst gehostete Dokumentenanalyse',
      description:
        'OCR, automatisches Labeling, Suche und Chat über Ihre Dokumente. Open Source, auf Ihrer Hardware.',
    },
    hero: {
      eyebrow: 'Selbst gehostete Dokumentenanalyse',
      titleLine1: 'Dokumente verstehen.',
      titleAccent: 'Auf Ihrer Hardware.',
      lead:
        'OCR, automatisches Labeling, Suche und Chat über Ihre Dokumente. Open Source, mit API für Ihre eigenen Systeme.',
      primaryCta: 'Selbst hosten',
      secondaryCta: 'Schnellstart',
      productCards: [
        {
          id: 'library',
          title: 'Bibliothek',
          subtitle: 'Upload, Status und Erkennung in einer Oberfläche.',
          screenshotId: 'library',
          imageAlt: 'Docuvate Bibliothek mit Dokumentliste',
        },
        {
          id: 'chat',
          title: 'Dokumenten-\u200bChat',
          subtitle: 'Fragen stellen, Antworten aus Ihrem Dokumenttext.',
          screenshotId: 'chat',
          imageAlt: 'Chat-Panel in der Dokumentenansicht',
        },
      ],
    },
    proof: {
      items: [
        { id: 'agpl', label: 'AGPL-Lizenz' },
        { id: 'docker', label: 'Docker Compose' },
        { id: 'stack', label: 'PostgreSQL, Valkey, S3' },
        { id: 'api', label: 'HTTP-API für Integrationen' },
      ],
    },
    featuresSection: {
      kicker: 'Produkt',
      heading: 'Ein Workspace für Ablage, Struktur und Antworten',
      lead:
        'Echte App-Ansichten: Bibliothek, Felder, Labels, Ordner und Dokumenten-Chat auf Infrastruktur, die Sie betreiben.',
    },
    features: [
      {
        id: 'library',
        title: 'Bibliothek und Upload',
        body:
          'Laden Sie PDFs und Scans hoch, filtern Sie nach Status und Metadaten und behalten Sie den Überblick über laufende Erkennung.',
        bullets: [
          'Zentraler Upload und Import aus Verbindungen',
          'Filter nach Status, Labels und Metadaten',
          'Fortschritt der Erkennung pro Dokument',
        ],
        imageAlt: 'Docuvate Bibliothek mit Dokumentliste',
      },
      {
        id: 'fields',
        title: 'Erkannte Felder',
        body:
          'Betrag, Datum, Absender und weitere Felder werden vorgeschlagen. Sie bestätigen Vorschläge mit einem Klick.',
        bullets: [
          'Vorschläge für Betrag, Datum und Absender',
          'Eigene Felder und Bestätigung mit einem Klick',
          'Gleiche Daten für Suche, Chat und API',
        ],
        imageAlt: 'Dokumentdetail mit erkannten Feldern',
      },
      {
        id: 'labels',
        title: 'Labels und Ordner',
        body:
          'Labels gruppieren Themen, Ordner spiegeln Ihre Ablage. Empfehlungen helfen beim Zuordnen, ohne Pflicht zur Automatik.',
        bullets: [
          'Farbige Labels für Themen und Projekte',
          'Ordnerbaum wie in Ihrer Ablage',
          'Empfehlungen, die Sie annehmen oder ignorieren',
        ],
        imageAlt: 'Label- und Ordneransicht',
      },
      {
        id: 'chat',
        title: 'Dokumenten-Chat',
        body:
          'Fragen zum Dokument stellen Sie lokal mit einem angebundenen Chat-Modell (z. B. Ollama). Antworten stützen sich auf den erkannten Text in Ihrer Datei.',
        bullets: [
          'Chat pro Dokument auf erkanntem Text',
          'Lokal angebundenes Modell (z. B. Ollama)',
          'Kein Versand Ihrer Dateien an Drittanbieter',
        ],
        imageAlt: 'Chat-Panel in der Dokumentenansicht',
      },
    ],
    steps: {
      heading: 'So funktioniert es',
      items: [
        {
          title: '1. Ablage',
          body: 'Datei hochladen oder über eine Verbindung importieren. Docuvate speichert das Original sicher in Ihrer Ablage.',
        },
        {
          title: '2. Erkennung',
          body: 'Text und Felder werden automatisch erkannt. Fortschritt und Ergebnis sehen Sie in der Oberfläche.',
        },
        {
          title: '3. Nutzung',
          body:
            'Finden Sie Dokumente über Labels, Ordner und Volltextsuche wieder. Chat und API greifen auf dieselben Daten zu.',
        },
      ],
    },
    developers: {
      heading: 'API für Ihren Stack',
      body:
        'Binden Sie Skripte, Portale und Backoffice-Tools per Service-Schlüssel an. Dieselben Dokumente und Labels wie in der Web-Oberfläche, ohne Bildschirmautomation.',
      primaryCta: 'API-Referenz',
      secondaryCta: 'SDK-Anleitung',
      codeCaption: 'Node.js',
      installSnippet: SDK_NODE_INSTALL_PNPM,
      code: `import { DocuvateClient } from '@docuvate/sdk';

const client = new DocuvateClient({
  baseUrl: 'https://ihr-host/v1',
  apiKey: process.env.DOCUVATE_API_KEY,
});

const { data, error } = await client.api.listDocuments({
  query: { q: 'Mietvertrag', status: 'ready' },
});
if (error) throw error;

for (const doc of data.items) {
  console.log(doc.title, doc.documentDate);
}`,
    },
    closingCta: {
      heading: 'Selbst hosten auf Ihrer Infrastruktur',
      body:
        'Keine Cloud-Gebühr pro Sitzplatz. Docuvate läuft auf Ihrem Server, Ihrer VM oder Ihrem NAS. Sie entscheiden über Upgrades, optional ganz ohne Cloud-KI. Lizenz: AGPL. Sie betreiben den Stack, Sie besitzen die Daten.',
      note: '',
      primaryCta: 'Installationsanleitung',
      secondaryCta: 'Quellcode auf GitHub',
    },
    integrations: {
      heading: 'Integrationen',
      lead: 'Anbindungen für Import und Automatisierung, von Cloud-Speichern bis zu Diensten in Ihrem Netzwerk.',
      items: [
        {
          id: 'amazon_s3',
          name: 'Amazon S3',
          description: 'Import aus einem Bucket in Ihre Bibliothek.',
        },
        {
          id: 'paperless',
          name: 'Paperless-ngx',
          description: 'DMS-Anbindung für bestehende Ablagen.',
        },
        {
          id: 'home_assistant',
          name: 'Home Assistant',
          description: 'Automationen und Benachrichtigungen an Ihr Smart Home.',
        },
        {
          id: 'gmail',
          name: 'Gmail',
          description: 'E-Mail-Anhänge als Quelle.',
        },
        {
          id: 'outlook',
          name: 'Microsoft Outlook',
          description: 'E-Mail-Anhänge als Quelle.',
        },
      ],
    },
    faq: {
      heading: 'Häufige Fragen',
      items: [
        {
          question: 'Für wen ist Docuvate gedacht?',
          answer:
            'Für Steuerkanzleien, Kleinunternehmen und private Ablagen, die Scans und PDFs strukturiert halten wollen, ohne Cloud-Zwang.',
        },
        {
          question: 'Brauche ich GPU-Hardware?',
          answer:
            'Nein für den Einstieg. OCR und Chat laufen CPU-tauglich; schwere Modelle sind optional und dokumentiert.',
        },
        {
          question: 'Wie verbinde ich Docuvate mit anderen Systemen?',
          answer:
            'In der Web-Oberfläche melden Sie sich normal an. Für Skripte und Drittsysteme legen Sie einen Service-Schlüssel an und nutzen die HTTP-API aus der API-Referenz.',
        },
        {
          question: 'Wie sieht es mit Updates aus?',
          answer:
            'Sie deployen selbst und wählen den Zeitpunkt für Upgrades. Breaking Changes werden versioniert; das exportierte OpenAPI-Dokument beschreibt den Vertrag.',
        },
      ],
    },
  },
  docs: {
    meta: {
      title: 'Docuvate Dokumentation',
      description: 'Schnellstart, Konzepte und Self-Hosting-Konfiguration für Docuvate.',
    },
    intro: {
      heading: 'Einstieg',
      lead:
        'Docuvate besteht aus Web-Oberfläche, API und Erkennungsdienst. Diese Seite erklärt Betrieb, Konzepte und Self-Hosting.',
    },
    quickstart: {
      heading: 'Schnellstart mit Docker Compose',
      steps: [
        'Repository klonen und `.env.example` nach `.env` kopieren.',
        'Secrets anpassen: BETTER_AUTH_SECRET (mindestens 32 Zeichen), DOCUVATE_CONNECTOR_SECRETS_KEY.',
        '`docker compose up --build` im Repository-Root (Docker Compose). Web unter Port 5173, API unter 3001.',
        'Ersten Benutzer in der Web-Oberfläche registrieren und ein Testdokument hochladen.',
      ],
    },
    concepts: {
      heading: 'Konzepte',
      items: [
        {
          title: 'Dokumente',
          body: 'Jede Datei hat Status, Vorschau, extrahierten Text und Metadaten. Inhalte liegen in MinIO, Metadaten in PostgreSQL.',
        },
        {
          title: 'Labels',
          body: 'Freie Schlagworte mit Farben. Empfehlungen schlagen Zuordnungen vor; Sie entscheiden über Annahme.',
        },
        {
          title: 'Ordner',
          body: 'Hierarchische Ablage (Dateisystem). Dokumente können mehreren Ordnern zugeordnet sein.',
        },
        {
          title: 'Erkannte Felder',
          body: 'In den Einstellungen legen Sie fest, welche Felder gesucht werden. Vorschläge erscheinen mit Hinweis zur Sicherheit.',
        },
        {
          title: 'Chat',
          body: 'Pro Dokument eigene Unterhaltungen. Den Dienst für Antworten wählen Sie in den Einstellungen.',
        },
        {
          title: 'Verbindungen',
          body: 'Verbindungen binden Quellen wie S3 oder E-Mail an. Zugangsdaten werden verschlüsselt gespeichert.',
        },
      ],
    },
    selfHosting: {
      heading: 'Self-Hosting-Konfiguration',
      intro: 'Relevante Variablen aus `.env.example`. Werte sind Beispiele für lokale Entwicklung.',
      envGroups: [
        {
          title: 'Datenbank und Cache',
          vars: [
            { name: 'DATABASE_URL', description: 'PostgreSQL-Verbindung für API und Migrationen.' },
            { name: 'VALKEY_URL', description: 'Valkey (Redis-kompatibel) für Queues und Cache.' },
          ],
        },
        {
          title: 'Objektspeicher (S3)',
          vars: [
            { name: 'MINIO_ENDPOINT', description: 'Hostname des S3-kompatiblen Endpunkts.' },
            { name: 'MINIO_PORT', description: 'Port des Storage-Dienstes.' },
            { name: 'MINIO_ACCESS_KEY', description: 'Zugangsschlüssel für Buckets.' },
            { name: 'MINIO_SECRET_KEY', description: 'Geheimer Schlüssel für Buckets.' },
            { name: 'MINIO_BUCKET', description: 'Bucket-Name für Dokumentdateien (z. B. documents).' },
          ],
        },
        {
          title: 'Auth und Web',
          vars: [
            { name: 'BETTER_AUTH_SECRET', description: 'Signing-Secret für Sessions (lang und zufällig).' },
            { name: 'BETTER_AUTH_URL', description: 'Öffentliche API-URL für Auth-Callbacks.' },
            { name: 'WEB_ORIGIN', description: 'Erlaubter Browser-Origin für CORS und Cookies.' },
            { name: 'VITE_API_URL', description: 'API-Basis für die Web-App im Dev-Build.' },
          ],
        },
        {
          title: 'Erkennung und Chat',
          vars: [
            { name: 'WORKER_URL', description: 'Interne URL des Erkennungsdienstes.' },
            { name: 'WORKER_SECRET', description: 'Gemeinsames Geheimnis zwischen API und Erkennung.' },
            { name: 'DOCUMENT_CHAT_PROVIDER', description: 'Chat-Backend für Dokumentenfragen.' },
            { name: 'OLLAMA_URL', description: 'Optional: Endpunkt für lokale Sprachmodelle.' },
            { name: 'OLLAMA_MODEL', description: 'Optional: Modellname für lokale Antworten.' },
          ],
        },
        {
          title: 'Service-API und Verbindungen',
          vars: [
            { name: 'DOCUVATE_SERVICE_API_KEYS', description: 'JSON-Array mit keyId, secret, tenantUserId, claims.' },
            { name: 'DOCUVATE_CONNECTOR_SECRETS_KEY', description: 'AES-Schlüssel für Geheimnisse von Verbindungen.' },
            { name: 'DOCUVATE_GMAIL_OAUTH_CLIENT_ID', description: 'Optional für die Gmail-Verbindung.' },
            { name: 'DOCUVATE_OUTLOOK_OAUTH_CLIENT_ID', description: 'Optional für die Outlook-Verbindung.' },
          ],
        },
      ],
    },
  },
  apiPage: {
    lead:
      'HTTP-Schnittstelle für Dokumente, Labels, Ordner und Chat. Vertrag: `GET /v1/openapi.json` auf Ihrer Instanz, dieselbe Beschreibung wie in der [interaktiven API-Referenz](/docs/api).',
  },
  sdks: {
    meta: {
      title: 'Docuvate SDKs',
      description: 'Node- und Flutter-Clients für die Headless-API /v1.',
    },
    pageLead:
      'Offizielle Clients für Skripte und Integrationen. Vertrag und Codegenerierung folgen dem exportierten OpenAPI-Dokument Ihrer Instanz.',
    previewBadge: 'Preview',
    overviewTable: {
      headings: {
        sdk: 'SDK',
        package: 'Paket',
        status: 'Status',
        section: 'Abschnitt',
      },
      rows: [
        {
          sdk: 'Node.js und TypeScript',
          packageName: '@docuvate/sdk',
          sectionId: 'node-sdk',
          sectionLabel: 'Node.js und TypeScript',
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
      'Offizielle Node- und Flutter-Clients für die Headless-API /v1. Vertrag und Codegenerierung folgen dem exportierten OpenAPI-Dokument.',
    introRuntimeSpec:
      'Ihre Instanz liefert die OpenAPI-Beschreibung unter `GET /v1/openapi.json`, identisch mit der [interaktiven API-Referenz](/docs/api).',
    introCodegenNote:
      'Nach API-Änderungen im Selbst-Hosting-Setup: OpenAPI exportieren und SDK-Code neu erzeugen (`pnpm openapi:export`, `pnpm sdk:codegen`).',
    copyCode: 'Kopieren',
    copiedCode: 'Kopiert',
    serviceCredentials: {
      heading: 'Service-Zugang einrichten',
      body:
        'Für Skripte und Integrationen legen Sie einen Service-API-Schlüssel an. Der Schlüssel ist an einen Benutzer gebunden und kann Berechtigungen für Dokumente tragen.',
      steps: [
        'In `.env` die Variable `DOCUVATE_SERVICE_API_KEYS` als JSON-Array setzen (keyId, secret, tenantUserId, claims).',
        'API unter `https://ihr-host/v1` ansprechen.',
        'Schlüssel im Header `Authorization: Bearer <secret>` oder `X-Docuvate-Api-Key` senden.',
      ],
    },
    node: {
      id: 'node-sdk',
      heading: 'Node.js und TypeScript',
      preview: true,
      previewNote: '',
      installHeading: 'Node.js installieren',
      installBody: 'Installieren Sie `@docuvate/sdk` direkt aus dem öffentlichen Git-Repository:',
      installSnippet: SDK_NODE_INSTALL_PNPM,
      installSnippetLanguage: 'typescript',
      auth:
        '`DocuvateClient` mit `baseUrl` und `apiKey` (Service-API-Schlüssel). Service-Schlüssel richten Sie im Abschnitt [Service-Zugang einrichten](#service-credentials) ein.',
      examples: [
        {
          title: 'Dokumente suchen',
          language: 'typescript',
          code: [
            "import { DocuvateClient } from '@docuvate/sdk';",
            '',
            'const client = new DocuvateClient({',
            "  baseUrl: 'https://ihr-host/v1',",
            "  apiKey: process.env.DOCUVATE_API_KEY,",
            '});',
            '',
            'const { data, error } = await client.api.listDocuments({',
            "  query: { q: 'Mietvertrag', status: 'ready' },",
            '});',
            'if (error) throw error;',
            '',
            'for (const doc of data.items) {',
            '  console.log(doc.title, doc.documentDate);',
            '}',
          ].join('\n'),
        },
        {
          title: 'Label anlegen',
          language: 'typescript',
          code: "await client.api.createTag({ body: { name: 'Eingang' } });",
        },
        {
          title: 'Chat-Frage stellen',
          language: 'typescript',
          code: [
            'const reply = await client.api.chat({',
            '  path: { id: documentId },',
            "  body: { message: 'Welche Fälligkeit ist genannt?' },",
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
      installHeading: 'Flutter installieren',
      installBody: 'Tragen Sie die Git-Abhängigkeit in `pubspec.yaml` ein und führen Sie `flutter pub get` aus:',
      installSnippet: SDK_FLUTTER_PUBSPEC,
      installSnippetLanguage: 'yaml',
      auth: '`DocuvateClientConfig` mit `baseUrl` und `apiKey` für Headless-Zugriff.',
      examples: [
        {
          title: 'Dokument hochladen',
          language: 'dart',
          code: [
            'final client = DocuvateClient(',
            '  DocuvateClientConfig(',
            "    baseUrl: 'https://ihr-host/v1',",
            '    apiKey: apiKey,',
            '  ),',
            ');',
            'await client.documents.createDocument(/* MultipartFile */);',
          ].join('\n'),
        },
        {
          title: 'Labels lesen',
          language: 'dart',
          code: [
            'final tags = await client.taxonomy.listTags();',
            'print(tags.data?.items);',
          ].join('\n'),
        },
        {
          title: 'Chat-Frage stellen',
          language: 'dart',
          code: [
            'final response = await client.documents.chat(',
            '  id: documentId,',
            '  documentChatRequestDto: DocumentChatRequestDto(',
            "    message: 'Welche Fälligkeit ist genannt?',",
            '  ),',
            ');',
            'print(response.data?.reply.content);',
          ].join('\n'),
        },
      ],
    },
  },
};
