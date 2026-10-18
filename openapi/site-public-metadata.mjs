/** Customer-facing OpenAPI copy applied after Nest export (also used by apps/site build). */
export const sitePublicOpenApiMetadata = {
  info: {
    title: 'Docuvate API',
    description:
      'Schnittstelle für Dokumente, Labels, Ordner und Chat. Für Automatisierung und Integrationen. Version 1 ist stabil versioniert.',
  },
  tagRenames: {
    'API metadata': 'System',
    Documents: 'Dokumente',
    Labels: 'Labels',
    Correspondents: 'Korrespondenten',
    Organizer: 'Ordner',
    Settings: 'Einstellungen',
    Connectors: 'Verbindungen',
    Models: 'Erweiterungen',
  },
  tagDescriptions: {
    System: 'API-Beschreibung und Metadaten',
    Dokumente: 'Hochladen, Lesen, Suchen und Dokumenten-Chat',
    Labels: 'Labels, Vorschläge, Muster und benutzerdefinierte Felder',
    Korrespondenten: 'Absender und Partner für die Dokumentzuordnung',
    Ordner: 'Ordner und Ablageorte',
    Einstellungen: 'Kontoeinstellungen',
    Verbindungen: 'Anbindungen an externe Quellen',
    Erweiterungen: 'Modellbetrieb (optional)',
  },
  pathSummaries: {
    getOpenApiDocument: 'OpenAPI-JSON',
  },
  pathDescriptions: {
    getOpenApiDocument: 'Maschinenlesbare Beschreibung dieser API im JSON-Format.',
  },
};
