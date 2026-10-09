import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const siteScripts = dirname(fileURLToPath(import.meta.url));
const siteRoot = join(siteScripts, '..');
const src = join(siteRoot, '..', '..', 'openapi', 'docuvate.v1.json');
const destDir = join(siteRoot, 'src', 'generated');

const metaDe = (await import(pathToFileURL(join(siteScripts, 'site-public-metadata.mjs')).href))
  .sitePublicOpenApiMetadata;
const metaEn = (
  await import(pathToFileURL(join(siteScripts, 'site-public-metadata.en.mjs')).href)
).sitePublicOpenApiMetadataEn;

const baseSpec = JSON.parse(readFileSync(src, 'utf8'));

const LABEL_MAP_POINT_SCHEMA = {
  type: 'object',
  properties: {
    id: { type: 'string', example: 'doc-7f2c' },
    kind: { type: 'string', example: 'document' },
    x: { type: 'number', example: 0.18 },
    y: { type: 'number', example: -0.42 },
    label: { type: 'string', example: 'Mietvertrag' },
    documentId: { type: 'string', format: 'uuid', nullable: true },
    tagId: { type: 'string', format: 'uuid', nullable: true },
    tagIds: { type: 'array', items: { type: 'string', format: 'uuid' } },
    tagNames: { type: 'array', items: { type: 'string' } },
    unlabeled: { type: 'boolean' },
    coverageStatus: { type: 'string' },
  },
  required: ['id', 'kind', 'x', 'y', 'label'],
};

const RESPONSE_DESC = {
  de: {
    200: 'OK',
    201: 'Erstellt',
    204: 'Kein Inhalt',
    400: 'Ungültige Anfrage',
    401: 'Nicht angemeldet',
    403: 'Keine Berechtigung',
    404: 'Nicht gefunden',
    409: 'Konflikt',
    422: 'Ungültige Eingabe',
    500: 'Serverfehler',
  },
  en: {
    200: 'OK',
    201: 'Created',
    204: 'No content',
    400: 'Bad request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not found',
    409: 'Conflict',
    422: 'Unprocessable entity',
    500: 'Server error',
  },
};

function applyResponseDescriptions(spec, locale) {
  const map = RESPONSE_DESC[locale];
  for (const pathItem of Object.values(spec.paths ?? {})) {
    for (const method of Object.values(pathItem)) {
      if (!method || typeof method !== 'object' || !method.responses) continue;
      for (const [code, resp] of Object.entries(method.responses)) {
        if (!resp || typeof resp !== 'object') continue;
        const status = code.replace(/[^0-9]/g, '');
        if (map[status]) {
          resp.description = map[status];
        }
      }
    }
  }
}

const BINARY_DESC_DE = 'Binärdaten (Datei)';
const BINARY_DESC_EN = 'Binary data (file)';

const ADMIN_PARAM_DESC_DE = {
  limit: 'Maximale Anzahl der Ergebnisse (1 bis 100)',
  offset: 'Anzahl der zu überspringenden Einträge',
  search: 'Suchbegriff für Name oder E-Mail',
  userId: 'Benutzer-ID',
};

const ADMIN_SCHEMA_PROP_DESC_DE = {
  email: 'E-Mail-Adresse des eingeladenen Benutzers',
  name: 'Anzeigename',
  role: 'Rolle (admin oder member)',
  reason: 'Grund für die Sperre (optional)',
  token: 'Einladungstoken aus der E-Mail',
  password: 'Neues Passwort (mindestens 8 Zeichen)',
};

function patchAdminLocaleCopy(spec, locale) {
  if (locale !== 'de') return;
  const adminPaths = [
    '/admin/access',
    '/admin/users',
    '/admin/users/{userId}/ban',
    '/admin/users/{userId}/unban',
    '/admin/users/{userId}/role',
    '/admin/users/{userId}/resend-invitation',
    '/admin/users/{userId}/revoke-invitation',
    '/admin/users/{userId}/revoke-sessions',
    '/invitations/accept',
  ];
  for (const pathKey of adminPaths) {
    const pathItem = spec.paths?.[pathKey];
    if (!pathItem) continue;
    for (const method of Object.values(pathItem)) {
      if (!method || typeof method !== 'object' || !('operationId' in method)) continue;
      for (const param of method.parameters ?? []) {
        if (!param?.name || !ADMIN_PARAM_DESC_DE[param.name]) continue;
        param.description = ADMIN_PARAM_DESC_DE[param.name];
      }
      const schema = method.requestBody?.content?.['application/json']?.schema?.$ref;
      if (typeof schema === 'string') {
        const name = schema.split('/').pop();
        const dto = spec.components?.schemas?.[name];
        if (dto?.properties) {
          for (const [prop, node] of Object.entries(dto.properties)) {
            if (node && typeof node === 'object' && ADMIN_SCHEMA_PROP_DESC_DE[prop]) {
              node.description = ADMIN_SCHEMA_PROP_DESC_DE[prop];
            }
          }
        }
      }
    }
  }
}

function patchBinarySchemaDescriptions(spec, locale) {
  const desc = locale === 'de' ? BINARY_DESC_DE : BINARY_DESC_EN;
  const visit = (node) => {
    if (!node || typeof node !== 'object') return;
    if (node.format === 'binary') {
      if (!node.description || /binary data/i.test(node.description)) {
        node.description = desc;
      }
    }
    for (const value of Object.values(node)) {
      if (value && typeof value === 'object') visit(value);
    }
  };
  visit(spec.components?.schemas);
  for (const pathItem of Object.values(spec.paths ?? {})) {
    for (const method of Object.values(pathItem)) {
      if (method && typeof method === 'object') visit(method);
    }
  }
}

function patchLabelMapSchema(spec) {
  const schema = spec.components?.schemas?.LabelMapResponseDtoClass;
  if (!schema?.properties?.points) return;
  schema.properties.points = {
    type: 'array',
    items: LABEL_MAP_POINT_SCHEMA,
  };
}

function enhanceSpec(spec, meta, locale) {
  const next = structuredClone(spec);
  next.info = { ...next.info, ...meta.info };

  const renameTag = (name) => meta.tagRenames[name] ?? name;

  for (const pathItem of Object.values(next.paths ?? {})) {
    for (const method of Object.values(pathItem)) {
      if (!method || typeof method !== 'object' || !('operationId' in method)) continue;
      if (Array.isArray(method.tags)) {
        method.tags = method.tags.map(renameTag);
      }
      const summaryOverride = meta.pathSummaries[method.operationId];
      const descriptionOverride = meta.pathDescriptions?.[method.operationId];
      if (summaryOverride) method.summary = summaryOverride;
      if (descriptionOverride) method.description = descriptionOverride;
    }
  }

  const usedTagNames = new Set();
  for (const pathItem of Object.values(next.paths ?? {})) {
    for (const method of Object.values(pathItem)) {
      if (!method || typeof method !== 'object' || !('operationId' in method)) continue;
      for (const tag of method.tags ?? []) {
        usedTagNames.add(tag);
      }
    }
  }

  const tagEntries = Object.entries(meta.tagDescriptions)
    .filter(([name]) => usedTagNames.has(name))
    .map(([name, description]) => {
      const entry = { name, description };
      const displayName = meta.tagDisplayNames?.[name];
      if (displayName) {
        entry['x-displayName'] = displayName;
      }
      return entry;
    });

  next.tags = tagEntries;

  if (locale === 'de') {
    next.info = {
      ...next.info,
      'x-docuvate-scalar': {
        sidebarSearchLabel: 'Suche',
      },
    };
  }

  next.servers = [
    {
      url: meta.exampleServerUrl,
      description: meta.serverDescription,
    },
  ];

  patchLabelMapSchema(next);
  patchBinarySchemaDescriptions(next, locale);
  patchAdminLocaleCopy(next, locale);
  applyResponseDescriptions(next, locale);

  return next;
}

const SCHEMA_RENAMES = {
  DashboardStatisticsDtoClass: 'DashboardStatistics',
  DashboardWidgetDtoClass: 'DashboardWidget',
  LabelMapResponseDtoClass: 'LabelMapResponse',
  SavedDocumentViewDtoClass: 'SavedDocumentView',
};

function renamePublicSchemas(spec) {
  const next = structuredClone(spec);
  const schemas = next.components?.schemas;
  if (!schemas) return next;
  for (const [from, to] of Object.entries(SCHEMA_RENAMES)) {
    if (!schemas[from]) continue;
    schemas[to] = schemas[from];
    delete schemas[from];
  }
  const rewriteRef = (node) => {
    if (!node || typeof node !== 'object') return;
    if (typeof node.$ref === 'string') {
      for (const [from, to] of Object.entries(SCHEMA_RENAMES)) {
        if (node.$ref.endsWith(`/components/schemas/${from}`)) {
          node.$ref = node.$ref.replace(from, to);
        }
      }
    }
    for (const value of Object.values(node)) {
      if (value && typeof value === 'object') rewriteRef(value);
    }
  };
  rewriteRef(next);
  return next;
}

const deSpec = enhanceSpec(baseSpec, metaDe, 'de');
const enSpec = enhanceSpec(baseSpec, metaEn, 'en');

mkdirSync(destDir, { recursive: true });
writeFileSync(join(destDir, 'openapi.v1.json'), JSON.stringify(deSpec, null, 2));
writeFileSync(join(destDir, 'openapi.v1.en.json'), JSON.stringify(enSpec, null, 2));

const publicDir = join(siteRoot, 'public');
mkdirSync(publicDir, { recursive: true });
writeFileSync(join(publicDir, 'openapi.json'), JSON.stringify(renamePublicSchemas(deSpec), null, 2));
writeFileSync(join(publicDir, 'openapi.en.json'), JSON.stringify(renamePublicSchemas(enSpec), null, 2));

console.log('Enhanced OpenAPI specs at', destDir, 'and public/openapi*.json');
