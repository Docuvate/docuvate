/** English site OpenAPI display metadata (apps/site EN locale). */
export const sitePublicOpenApiMetadataEn = {
  exampleServerUrl: 'https://your-instance.example/v1',
  serverDescription:
    'Example URL for your self-hosted API (replace with your domain in docker compose).',
  info: {
    title: 'Docuvate API',
    description:
      'Interface for documents, labels, folders, and chat. For automation and integrations. Version 1 is stably versioned.',
  },
  tagRenames: {
    'API metadata': 'System',
    Documents: 'Documents',
    Labels: 'Labels',
    Correspondents: 'Correspondents',
    Organizer: 'Folders',
    Settings: 'Settings',
    Connectors: 'Connections',
    Models: 'Extensions',
  },
  tagDescriptions: {
    System: 'API description and metadata',
    Documents: 'Upload, read, search, and document chat',
    Labels: 'Labels, suggestions, patterns, and custom fields',
    Correspondents: 'Senders and partners for document assignment',
    Folders: 'Folders and storage locations',
    Settings: 'Account settings',
    Connections: 'Connections to external sources',
    Extensions: 'Model operations (optional)',
  },
  pathSummaries: {
    getOpenApiDocument: 'OpenAPI JSON',
  },
  pathDescriptions: {
    getOpenApiDocument: 'Machine-readable description of this API in JSON format.',
  },
};
