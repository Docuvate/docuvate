import { sitePublicDePathSummaries } from './site-public-metadata-de-path-summaries.mjs';

/** Site-only OpenAPI display metadata (apps/site build; not the Nest export). */
export const sitePublicOpenApiMetadata = {
  exampleServerUrl: 'https://ihre-instanz.example/v1',
  serverDescription:
    'Beispiel-URL Ihrer selbst gehosteten API (in Docker Compose durch Ihre Domain ersetzen).',
  info: {
    title: 'Docuvate API',
    description:
      'Schnittstelle für Dokumente, Labels, Ordner und Chat. Für Automatisierung und Integrationen. Version 1 ist stabil versioniert.',
  },
  tagRenames: {
    'API metadata': 'System',
    search: 'Suche',
    Documents: 'Dokumente',
    Labels: 'Labels',
    Correspondents: 'Korrespondenten',
    Organizer: 'Ordner',
    Settings: 'Einstellungen',
    Connectors: 'Verbindungen',
    Models: 'Erweiterungen',
    admin: 'Benutzerverwaltung',
    invitations: 'Einladungen',
  },
  tagDisplayNames: {
    Suche: 'Suche',
  },
  tagDescriptions: {
    System: 'API-Beschreibung und Metadaten',
    Suche: 'Globale Suche (Volltext, Ähnlichkeit, semantisch)',
    Dokumente: 'Hochladen, Lesen, Suchen und Dokumenten-Chat',
    Labels: 'Labels, Vorschläge, Muster und benutzerdefinierte Felder',
    Korrespondenten: 'Absender und Partner für die Dokumentzuordnung',
    Ordner: 'Ordner und Ablageorte',
    Einstellungen: 'Kontoeinstellungen',
    Verbindungen: 'Anbindungen an externe Quellen',
    Erweiterungen: 'Modellbetrieb (optional)',
    Benutzerverwaltung: 'Benutzer, Rollen, Einladungen und Sitzungen verwalten',
    Einladungen: 'Einladungen annehmen und Passwort setzen',
  },
  pathSummaries: sitePublicDePathSummaries,
  pathDescriptions: {
    getOpenApiDocument: 'Maschinenlesbare Beschreibung dieser API im JSON-Format.',
  },
};
