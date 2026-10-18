/** English customer-facing OpenAPI copy (apps/site EN locale). */
export const sitePublicOpenApiMetadataEn = {
  info: {
    title: 'Docuvate API',
    description:
      'Interface for documents, labels, folders, and chat. For automation and integrations. Version 1 is stably versioned.',
  },
  tagRenames: {
    'API metadata': 'System',
    Models: 'Extensions',
  },
  tagDescriptions: {
    System: 'API description and metadata',
    Documents: 'Upload, read, search, and document chat',
    Labels: 'Tags, recommendations, patterns, and custom fields',
    Correspondents: 'Senders and partners for document assignment',
    Organizer: 'Folders and saved views',
    Settings: 'Account and extraction settings',
    Connectors: 'Connections to external sources',
    Extensions: 'Model registry and training (optional)',
  },
  pathSummaries: {
    getOpenApiDocument: 'OpenAPI JSON',
  },
  pathDescriptions: {
    getOpenApiDocument: 'Machine-readable description of this API in JSON format.',
  },
};
