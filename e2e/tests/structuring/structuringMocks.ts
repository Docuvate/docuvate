// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { Page, Route } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Synthetic workspace for the structuring journey (dashboard → library → viewer → review → export).
 * Every `/api/` request is answered here; titles, labels and values are invented. Nothing reaches a
 * real Docuvate API or real documents.
 */

const NOW = '2026-10-01T09:00:00.000Z';
const PDF = fs.readFileSync(path.join(__dirname, '..', '..', 'fixtures', 'synthetic-upload.pdf'));

export const STRUCTURING_TAGS = [
  { id: 'tag-inbox', name: 'Posteingang', color: '#0369a1', isInbox: true },
  { id: 'tag-invoice', name: 'Rechnung', color: '#3b82f6', isInbox: false },
  { id: 'tag-insurance', name: 'Versicherung', color: '#10b981', isInbox: false },
  { id: 'tag-vehicle', name: 'Fahrzeug', color: '#f59e0b', isInbox: false },
  { id: 'tag-contract', name: 'Vertrag', color: '#7c3aed', isInbox: false },
];

type SyntheticStatus = 'uploaded' | 'queued' | 'extracting' | 'ready' | 'failed';

interface SyntheticSpec {
  title: string;
  status: SyntheticStatus;
  tags: string[];
  suggest?: string[];
}

const SPECS: SyntheticSpec[] = [
  {
    title: 'Stromrechnung Oktober',
    status: 'ready',
    tags: ['tag-inbox'],
    suggest: ['tag-invoice'],
  },
  {
    title: 'Kfz-Versicherung Beitrag',
    status: 'ready',
    tags: ['tag-inbox'],
    suggest: ['tag-insurance', 'tag-vehicle'],
  },
  {
    title: 'Mietvertrag Nachtrag',
    status: 'ready',
    tags: ['tag-inbox'],
    suggest: ['tag-contract'],
  },
  { title: 'Werkstattrechnung', status: 'extracting', tags: ['tag-inbox'] },
  { title: 'Scan 2026-10-02', status: 'queued', tags: ['tag-inbox'] },
  { title: 'Kontoauszug September', status: 'failed', tags: ['tag-inbox'] },
  { title: 'Internetvertrag', status: 'ready', tags: ['tag-contract'] },
  { title: 'Hausratversicherung', status: 'ready', tags: ['tag-insurance'] },
  { title: 'Tankquittung', status: 'ready', tags: ['tag-vehicle', 'tag-invoice'] },
  { title: 'Telefonrechnung', status: 'ready', tags: ['tag-invoice'] },
  { title: 'Handwerkerangebot', status: 'ready', tags: [] },
  { title: 'Reiseunterlagen', status: 'uploaded', tags: ['tag-inbox'] },
];

function tagById(id: string) {
  const tag = STRUCTURING_TAGS.find((t) => t.id === id);
  if (!tag) throw new Error(`unknown synthetic tag ${id}`);
  return tag;
}

function documentAt(index: number) {
  const spec = SPECS[index];
  if (!spec) throw new Error(`no synthetic document ${String(index)}`);
  const number = String(index + 1).padStart(4, '0');
  const id = `synthetic-doc-${number}`;
  const ready = spec.status === 'ready';
  return {
    id,
    filename: `beispiel-${number}.pdf`,
    title: spec.title,
    status: spec.status,
    extractionFailureReason:
      spec.status === 'failed' ? 'Synthetic: Datei konnte nicht gelesen werden.' : null,
    mimeType: 'application/pdf',
    fileSizeBytes: 120_000 + index * 1_000,
    formatBadge: 'PDF',
    previewAvailable: true,
    documentDate: ready ? `2026-0${String((index % 9) + 1)}-1${String(index % 9)}` : null,
    folderId: null,
    folder: null,
    tags: spec.tags.map(tagById),
    tagSuggestions: (spec.suggest ?? []).map((tagId, i) => ({
      tag: tagById(tagId),
      reason: 'Synthetic: ähnliche Dokumente',
      confidence: 0.92 - i * 0.1,
    })),
    createdAt: NOW,
    updatedAt: NOW,
    ownerLine: null,
    layoutIrAvailable: false,
  };
}

export const STRUCTURING_DOCUMENTS = SPECS.map((_, index) => documentAt(index));

function detailFor(id: string) {
  const base = STRUCTURING_DOCUMENTS.find((d) => d.id === id);
  if (!base) return null;
  const ready = base.status === 'ready';
  return {
    ...base,
    extraction: ready
      ? {
          text: 'Beispiel GmbH\nMusterstraße 1\nRechnung Nr. 2026-0042\nBetrag: 84,20 EUR\nFällig: 15.10.2026',
          fields: [
            { key: 'invoice_number', value: '2026-0042', confidence: 0.97 },
            { key: 'total_amount', value: '84,20 EUR', confidence: 0.64 },
            { key: 'date', value: '01.10.2026', confidence: 0.91 },
          ],
          blocks: [
            {
              page: 1,
              x: 0.1,
              y: 0.1,
              width: 0.5,
              height: 0.05,
              text: 'Beispiel GmbH',
              blockIndex: 0,
            },
            {
              page: 1,
              x: 0.1,
              y: 0.2,
              width: 0.6,
              height: 0.05,
              text: 'Rechnung Nr. 2026-0042',
              blockIndex: 1,
            },
            {
              page: 1,
              x: 0.1,
              y: 0.3,
              width: 0.4,
              height: 0.05,
              text: 'Betrag: 84,20 EUR',
              blockIndex: 2,
            },
          ],
          layoutIrAvailable: false,
        }
      : undefined,
    recognizedFieldAttempts: [],
  };
}

const REVIEW_ITEMS = STRUCTURING_DOCUMENTS.filter((d) => d.tagSuggestions.length > 0).map((d) => ({
  documentId: d.id,
  title: d.title,
  filename: d.filename,
  documentDate: d.documentDate,
  suggestedDocumentDate: d.documentDate,
  uploadDate: NOW,
  labelSuggestions: d.tagSuggestions,
  fieldSuggestions: [
    { key: 'total_amount', displayLabel: 'Betrag', value: '84,20 EUR', confidence: 0.64 },
  ],
  duplicateStack: null,
}));

const MOCK_SESSION = {
  session: {
    id: 'st-session',
    token: 'st-token',
    userId: 'st-user',
    expiresAt: '2099-01-01T00:00:00.000Z',
  },
  user: {
    id: 'st-user',
    email: 'journey@example.test',
    name: 'Journey Review',
    emailVerified: true,
  },
};

function json(route: Route, body: unknown, status = 200): Promise<void> {
  return route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
}

const EMPTY_PAGE = { items: [], nextCursor: null, hasMore: false, total: 0 };

export interface StructuringMockOptions {
  theme?: 'light' | 'dark';
  /** Empty workspace (onboarding states). */
  empty?: boolean;
  /** Make the document list fail (error states). */
  listError?: boolean;
  /** Make dashboard statistics fail (dashboard error state). */
  statsError?: boolean;
}

export interface StructuringMockLog {
  unmatched: string[];
  calls: string[];
  /** Field lists sent with each document PATCH, in order (synthetic). */
  fieldWrites: { documentId: string; fields: SyntheticField[] }[];
}

export interface SyntheticField {
  key: string;
  value: string;
  confidence?: number;
  userConfirmed?: boolean;
}

/** Catalog so the synthetic fields count as recognized (not heuristic) values. */
const RECOGNIZED_CATALOG = [
  ['invoice_number', 'Rechnungsnummer'],
  ['total_amount', 'Betrag'],
  ['net_amount', 'Nettobetrag'],
  ['date', 'Datum'],
].map(([key, label], index) => ({
  id: `00000000-0000-4000-8000-0000000001${String(index).padStart(2, '0')}`,
  key,
  label,
  fieldType: 'text',
  sortOrder: index,
  extractForAllDocuments: true,
  gateLabelIds: [],
  gateLabelMatch: 'any',
  minLabelConfidence: null,
  confidenceGateEnabled: null,
  showInFilter: false,
}));

function isSyntheticFieldList(value: unknown): value is SyntheticField[] {
  return (
    Array.isArray(value) &&
    value.every(
      (row: unknown) =>
        typeof row === 'object' &&
        row !== null &&
        'key' in row &&
        'value' in row &&
        typeof row.key === 'string' &&
        typeof row.value === 'string'
    )
  );
}

function filterDocuments(url: URL) {
  const status = url.searchParams.get('status');
  const inbox = url.searchParams.get('inbox') === 'true';
  const unlabeled = url.searchParams.get('withoutNonInboxLabel') === 'true';
  return STRUCTURING_DOCUMENTS.filter((d) => {
    if (status && d.status !== status) return false;
    if (inbox && !d.tags.some((t) => t.isInbox)) return false;
    if (unlabeled && (d.status !== 'ready' || d.tags.some((t) => !t.isInbox))) return false;
    return true;
  });
}

export async function installStructuringMocks(
  page: Page,
  options: StructuringMockOptions = {}
): Promise<StructuringMockLog> {
  const theme = options.theme ?? 'light';
  const log: StructuringMockLog = { unmatched: [], calls: [], fieldWrites: [] };
  const fieldOverrides = new Map<string, SyntheticField[]>();
  const withOverrides = (detail: NonNullable<ReturnType<typeof detailFor>>) => {
    const override = fieldOverrides.get(detail.id);
    if (!override || !detail.extraction) return detail;
    return { ...detail, extraction: { ...detail.extraction, fields: override } };
  };
  const docs = options.empty ? [] : STRUCTURING_DOCUMENTS;
  const byStatus = { uploaded: 0, queued: 0, extracting: 0, ready: 0, failed: 0 };
  for (const d of docs) byStatus[d.status] += 1;

  await page.route(/\/api\//, async (route) => {
    const url = new URL(route.request().url());
    const p = url.pathname.replace(/^\/api/, '').replace(/^\/v1/, '');
    const method = route.request().method();
    log.calls.push(`${method} ${p}${url.search}`);

    if (p.startsWith('/auth/get-session')) return json(route, MOCK_SESSION);
    if (p.startsWith('/auth/')) return json(route, {});
    if (p === '/health' || p.startsWith('/health/')) return json(route, { status: 'ok' });
    if (p === '/remote-config') {
      return json(route, {
        featureFlags: {
          layoutReconstructionCompare: false,
          sourceConnectors: true,
          experimentalResearchModels: false,
          exactAnswers: false,
          smartDuplicates: false,
          answerAbstention: false,
          learnedValueTypes: true,
          layoutKeyValueRoles: false,
        },
      });
    }
    if (p === '/settings' && method === 'GET') {
      return json(route, {
        preferredExtractorEngine: 'pipeline',
        advancedFeaturesEnabled: false,
        useArenaWinnerAsDefault: false,
        themePreference: theme,
        locale: 'de',
      });
    }
    if (p === '/tags' && method === 'GET') return json(route, { items: STRUCTURING_TAGS });
    if (p.startsWith('/tags/search')) {
      return json(route, {
        items: STRUCTURING_TAGS,
        nextCursor: null,
        hasMore: false,
        total: STRUCTURING_TAGS.length,
      });
    }
    if (p === '/documents/export') {
      const format = url.searchParams.get('format') ?? 'csv';
      return route.fulfill({
        status: 200,
        contentType: format === 'json' ? 'application/json' : 'text/csv',
        body: format === 'json' ? '[]' : 'id,title\n',
      });
    }
    if (p === '/documents' && method === 'POST') {
      return json(route, {
        ...documentAt(11),
        id: 'synthetic-upload-0001',
        title: 'Neuer Upload',
        status: 'queued',
      });
    }
    if (p === '/documents' && method === 'GET') {
      if (options.listError) return json(route, { message: 'Synthetic failure' }, 500);
      const items = options.empty ? [] : filterDocuments(url);
      return json(route, {
        items,
        nextCursor: null,
        hasMore: false,
        total: items.length,
        libraryUi: { showDocumentOwnerLine: false },
      });
    }
    if (p === '/documents/tag-suggestions' && method === 'POST') return json(route, { items: [] });
    const previewMatch = /^\/documents\/([^/]+)\/(preview|content)$/.exec(p);
    if (previewMatch) {
      return route.fulfill({ status: 200, contentType: 'application/pdf', body: PDF });
    }
    const detailMatch = /^\/documents\/([^/]+)$/.exec(p);
    if (detailMatch?.[1]) {
      const detail = detailFor(detailMatch[1]);
      if (!detail) return json(route, { message: 'Not found' }, 404);
      if (method === 'GET') return json(route, withOverrides(detail));
      const body: unknown = route.request().postDataJSON();
      const fields =
        typeof body === 'object' && body !== null && 'extractionFields' in body
          ? body.extractionFields
          : undefined;
      if (isSyntheticFieldList(fields)) {
        fieldOverrides.set(detail.id, fields);
        log.fieldWrites.push({ documentId: detail.id, fields });
      }
      return json(route, {
        document: withOverrides(detail),
        fieldCorrectionsRecorded: 0,
        fieldConfirmationsRecorded: 0,
      });
    }
    if (/^\/documents\/[^/]+\/(duplicate-candidates|duplicates)/.test(p))
      return json(route, { items: [] });
    if (
      /^\/documents\/[^/]+\/requeue/.test(p) ||
      /^\/documents\/[^/]+\/extraction\/requeue/.test(p)
    ) {
      return json(route, {});
    }
    if (p === '/review-queue/summary')
      return json(route, { pendingCount: options.empty ? 0 : REVIEW_ITEMS.length });
    if (p === '/review-queue' && method === 'GET') {
      const items = options.empty ? [] : REVIEW_ITEMS;
      return json(route, { items, nextCursor: null, hasMore: false, total: items.length });
    }
    if (p.startsWith('/review-queue/') && method === 'POST') {
      return json(route, {
        documentId: 'x',
        acceptedLabels: 1,
        acceptedFields: 1,
        documentsProcessed: 0,
      });
    }
    if (p === '/dashboard' && method === 'GET') {
      return json(route, {
        editMode: false,
        widgets: [
          {
            id: 'w-recent',
            type: 'recent_documents',
            position: 0,
            widthCols: 12,
            heightRows: 2,
            itemLimit: 6,
          },
          { id: 'w-stats', type: 'statistics', position: 1, widthCols: 6, heightRows: 1 },
          { id: 'w-attention', type: 'attention', position: 2, widthCols: 6, heightRows: 1 },
        ],
      });
    }
    if (p === '/dashboard/statistics') {
      if (options.statsError) return json(route, { message: 'Synthetic failure' }, 500);
      return json(route, {
        documentsTotal: docs.length,
        byStatus,
        labelsAssignedCount: options.empty ? 0 : 9,
        unlabeledCount: options.empty ? 0 : 1,
        labelsTotalCount: STRUCTURING_TAGS.length - 1,
        topLabels: [],
      });
    }
    if (p === '/dashboard/widget-document-previews') {
      const type = url.searchParams.get('type');
      const limit = Number(url.searchParams.get('limit') ?? '6');
      if (type === 'attention') {
        const items = docs.filter((d) => d.status === 'failed');
        return json(route, { items, attentionCount: items.length });
      }
      return json(route, { items: docs.slice(0, limit) });
    }
    if (p === '/dashboard/installation-admin') return json(route, { isInstallationAdmin: true });
    if (p === '/admin/access')
      return json(route, { isAdministrator: true, role: 'admin', roleDescriptions: [] });
    if (p === '/settings/workspace-ml') {
      return json(route, {
        labelAutoAssign: 'cautious',
        labelSuggestions: 'normal',
        duplicateDetection: 'exact',
        fieldAcceptance: 'normal',
        editable: true,
      });
    }
    if (p === '/settings/extraction-engines') {
      return json(route, {
        engines: [{ id: 'pipeline', label: 'Pipeline', description: 'Synthetic engine' }],
      });
    }
    if (p === '/connectors/catalog')
      return json(route, { categories: [], plugins: [], viewerIsServerAdmin: true });
    if (p === '/recognized-fields') return json(route, { items: RECOGNIZED_CATALOG });
    if (p === '/saved-views' || p === '/folders')
      return json(route, { items: [] });
    if (p === '/duplicate-sets') return json(route, EMPTY_PAGE);
    if (method !== 'GET') return json(route, {});
    log.unmatched.push(`${method} ${p}`);
    return json(route, EMPTY_PAGE);
  });
  await page.addInitScript((resolved) => {
    window.localStorage.setItem('docuvate-theme-preference', resolved);
    window.localStorage.setItem('docuvate-theme', resolved);
    window.localStorage.setItem('docuvate.locale', 'de');
  }, theme);
  await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' });
  return log;
}
