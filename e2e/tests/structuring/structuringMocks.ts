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
const INVOICE_PDF = fs.readFileSync(
  path.join(__dirname, '..', '..', 'fixtures', 'synthetic-invoice-table.pdf')
);

type RuleLine = 'unknown' | 'none' | 'thin' | 'thick' | 'double';
const RULE_LINES: readonly RuleLine[] = ['unknown', 'none', 'thin', 'thick', 'double'];

/** Table as stored in the fixture file (text-only detection: no bands or line evidence). */
interface FixtureTable {
  tableType: 'line_items' | 'key_value' | 'other';
  headerRows: number;
  headerCols: number;
  rules: { axis: 'row' | 'col'; ord: number; pos: number }[];
  merges: { row0: number; col0: number; rowSpan: number; colSpan: number }[];
  cells: { row: number; col: number; text: string }[];
}

interface SyntheticTable extends Omit<FixtureTable, 'rules'> {
  footerRows: number;
  trailingHeaderCols: number;
  banded: boolean;
  rowRoles: { row: number; role: 'section' | 'subtotal' }[];
  rules: { axis: 'row' | 'col'; ord: number; pos: number; line: RuleLine }[];
}

function isRuleLineEntry(
  value: unknown
): value is { axis: 'row' | 'col'; ord: number; line: RuleLine } {
  return (
    typeof value === 'object' &&
    value !== null &&
    'axis' in value &&
    'ord' in value &&
    'line' in value &&
    RULE_LINES.some((line) => line === value.line)
  );
}

function isRowRoleEntry(value: unknown): value is SyntheticTable['rowRoles'][number] {
  return (
    typeof value === 'object' &&
    value !== null &&
    'row' in value &&
    typeof value.row === 'number' &&
    'role' in value &&
    (value.role === 'section' || value.role === 'subtotal')
  );
}

interface SyntheticLayoutFixture {
  ir: { version: 1; pages: { blocks: { text: string }[] }[] };
  tokens: unknown[];
  tableRegion: { x0: number; y0: number; x1: number; y1: number; table: FixtureTable };
}

function isLayoutFixture(value: unknown): value is SyntheticLayoutFixture {
  return typeof value === 'object' && value !== null && 'ir' in value && 'tableRegion' in value;
}

const layoutFixtureRaw: unknown = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'synthetic-invoice-layout.json'), 'utf8')
);
if (!isLayoutFixture(layoutFixtureRaw)) throw new Error('invalid synthetic layout fixture');
const LAYOUT_FIXTURE = layoutFixtureRaw;

/** Synthetic invoice with layout IR and one recognised table (structuring editor views). */
export const LAYOUT_DOCUMENT_ID = 'synthetic-layout-0001';

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

function layoutDocumentDetail() {
  const text = LAYOUT_FIXTURE.ir.pages.flatMap((pg) => pg.blocks.map((b) => b.text)).join('\n');
  return {
    ...documentAt(5),
    id: LAYOUT_DOCUMENT_ID,
    title: 'Rechnung Strukturierung Oktober',
    filename: 'rechnung-strukturierung.pdf',
    status: 'ready' as const,
    extractionFailureReason: null,
    documentDate: '2026-10-14',
    tags: [tagById('tag-invoice')],
    tagSuggestions: [],
    layoutIrAvailable: true,
    extraction: {
      text,
      fields: [
        { key: 'invoice_number', value: 'RE-2026-0042', confidence: 0.98, userConfirmed: true },
        { key: 'total_amount', value: '1.570,80 €', confidence: 0.95 },
        { key: 'date', value: '14.10.2026', confidence: 0.71 },
      ],
      blocks: [],
      layoutIrAvailable: true,
      layoutIrPages: [{ page: 1, widthPt: 595.28, heightPt: 841.89 }],
    },
    recognizedFieldAttempts: [],
  };
}

function detailFor(id: string) {
  if (id === LAYOUT_DOCUMENT_ID) return layoutDocumentDetail();
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
  /** Bodies of table correction POSTs (synthetic). */
  tableCorrections: unknown[];
  /** Bodies of field correction POSTs (synthetic). */
  fieldCorrections: unknown[];
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
  const log: StructuringMockLog = {
    unmatched: [],
    calls: [],
    fieldWrites: [],
    tableCorrections: [],
    fieldCorrections: [],
  };
  let tableRevision = 0;
  const fixtureTable = LAYOUT_FIXTURE.tableRegion.table;
  let layoutTable: SyntheticTable = {
    ...fixtureTable,
    footerRows: 0,
    trailingHeaderCols: 0,
    banded: false,
    rowRoles: [],
    rules: fixtureTable.rules.map((rule) => ({ ...rule, line: 'unknown' })),
  };
  let tableBounds = {
    x0: LAYOUT_FIXTURE.tableRegion.x0,
    y0: LAYOUT_FIXTURE.tableRegion.y0,
    x1: LAYOUT_FIXTURE.tableRegion.x1,
    y1: LAYOUT_FIXTURE.tableRegion.y1,
  };
  let pageTransforms: Array<{
    page: number;
    rotationQuarterTurns: 0 | 1 | 2 | 3;
    deskewDeg: number;
    source: string;
    updatedAt: string;
  }> = [];
  const fieldSuggestionRejects: Array<{
  id: string;
  correctionId: string;
  fieldKey: string;
  value: string;
  valueNormalized: string;
  createdAt: string;
}> = [];
  let fieldBounds = { x0: 0.55, y0: 0.72, x1: 0.88, y1: 0.78 };
  const layoutFieldRegion = () => ({
    id: 'synthetic-field-total',
    documentId: LAYOUT_DOCUMENT_ID,
    page: 1,
    shape: 'rect' as const,
    role: 'field' as const,
    x0: fieldBounds.x0,
    y0: fieldBounds.y0,
    x1: fieldBounds.x1,
    y1: fieldBounds.y1,
    irSha256: 'synthetic',
    needsReview: false,
    blockIndexes: [],
    field: { fieldKey: 'total_amount', valueOverride: null },
    createdAt: NOW,
  });
    const layoutTableRegion = () => ({
    id: `synthetic-table-${String(tableRevision)}`,
    documentId: LAYOUT_DOCUMENT_ID,
    page: 1,
    shape: 'rect',
    role: 'table',
    x0: tableBounds.x0,
    y0: tableBounds.y0,
    x1: tableBounds.x1,
    y1: tableBounds.y1,
    irSha256: 'synthetic',
    needsReview: false,
    blockIndexes: [],
    table: layoutTable,
    createdAt: NOW,
  });
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
      const body = previewMatch[1] === LAYOUT_DOCUMENT_ID ? INVOICE_PDF : PDF;
      return route.fulfill({ status: 200, contentType: 'application/pdf', body });
    }
    if (p === `/documents/${LAYOUT_DOCUMENT_ID}/layout-ir`) return json(route, LAYOUT_FIXTURE.ir);
    if (p === `/documents/${LAYOUT_DOCUMENT_ID}/layout/tokens`) {
      return json(route, { page: null, irSha256: 'synthetic', tokens: LAYOUT_FIXTURE.tokens });
    }
    if (p === `/documents/${LAYOUT_DOCUMENT_ID}/regions`) {
      const role = url.searchParams.get('role');
      const field = layoutFieldRegion();
      const table = layoutTableRegion();
      const items =
        role === 'table' ? [table] : role === 'field' ? [field] : [field, table];
      return json(route, { irSha256: 'synthetic', items });
    }
    if (
      (p === `/documents/${LAYOUT_DOCUMENT_ID}/field-suggestion-decisions` ||
        /^\/documents\/[^/]+\/field-suggestion-decisions$/.test(p)) &&
      method === 'GET'
    ) {
      return json(route, {
        items: fieldSuggestionRejects.map((item) => ({
          ...item,
          decision: 'rejected' as const,
        })),
      });
    }
    if (p === `/documents/${LAYOUT_DOCUMENT_ID}/corrections` && method === 'POST') {
      const body: unknown = route.request().postDataJSON();
      log.fieldCorrections.push(body);
      const op =
        typeof body === 'object' && body && 'op' in body ? String(body.op) : 'reanchor';
      const fieldKey =
        typeof body === 'object' && body && 'fieldKey' in body
          ? String(body.fieldKey)
          : 'total_amount';
      const valueOverride =
        typeof body === 'object' &&
        body &&
        'valueOverride' in body &&
        typeof body.valueOverride === 'string'
          ? body.valueOverride
          : null;
      if (op === 'reject_suggestion' && valueOverride) {
        const correctionId =
          typeof body === 'object' && body && 'id' in body
            ? String(body.id)
            : `synthetic-reject-${String(fieldSuggestionRejects.length + 1)}`;
        const valueNormalized = valueOverride.replace(/\s+/g, ' ').trim().toLowerCase();
        const existing = fieldSuggestionRejects.find(
          (item) => item.fieldKey === fieldKey && item.valueNormalized === valueNormalized
        );
        if (existing) {
          return json(route, {
            noChange: true,
            correction: {
              id: existing.correctionId,
              documentId: LAYOUT_DOCUMENT_ID,
              kind: 'field',
              status: 'active',
              op: 'reject_suggestion',
              fieldKey,
              beforeRegionId: null,
              afterRegionId: null,
              oldValue: null,
              newValue: existing.value,
              createdAt: existing.createdAt,
            },
            region: null,
          });
        }
        fieldSuggestionRejects.push({
          id: `synthetic-decision-${String(fieldSuggestionRejects.length + 1)}`,
          correctionId,
          fieldKey,
          value: valueOverride,
          valueNormalized,
          createdAt: NOW,
        });
        return json(route, {
          noChange: false,
          correction: {
            id: correctionId,
            documentId: LAYOUT_DOCUMENT_ID,
            kind: 'field',
            status: 'active',
            op: 'reject_suggestion',
            fieldKey,
            beforeRegionId: null,
            afterRegionId: null,
            oldValue: null,
            newValue: valueOverride,
            createdAt: NOW,
          },
          region: null,
        });
      }
      const region = layoutFieldRegion();
      let nextRegion = region;
      if (
        typeof body === 'object' &&
        body !== null &&
        'x0' in body &&
        typeof body.x0 === 'number' &&
        typeof body.y0 === 'number' &&
        typeof body.x1 === 'number' &&
        typeof body.y1 === 'number'
      ) {
        fieldBounds = { x0: body.x0, y0: body.y0, x1: body.x1, y1: body.y1 };
        nextRegion = layoutFieldRegion();
      }
      return json(route, {
        noChange: false,
        correction: {
          id: `synthetic-field-correction-${String(log.fieldCorrections.length)}`,
          documentId: LAYOUT_DOCUMENT_ID,
          kind: 'field',
          status: 'active',
          op,
          fieldKey,
          beforeRegionId: region.id,
          afterRegionId: region.id,
          oldValue: null,
          newValue: null,
          createdAt: NOW,
        },
        region: nextRegion,
      });
    }
    if (p === `/documents/${LAYOUT_DOCUMENT_ID}/table-corrections` && method === 'POST') {
      const body: unknown = route.request().postDataJSON();
      log.tableCorrections.push(body);
      if (typeof body === 'object' && body !== null) {
        const next: SyntheticTable = { ...layoutTable };
        if (
          'tableType' in body &&
          (body.tableType === 'line_items' ||
            body.tableType === 'key_value' ||
            body.tableType === 'other')
        )
          next.tableType = body.tableType;
        if ('headerRows' in body && typeof body.headerRows === 'number')
          next.headerRows = body.headerRows;
        if ('headerCols' in body && typeof body.headerCols === 'number')
          next.headerCols = body.headerCols;
        if ('footerRows' in body && typeof body.footerRows === 'number')
          next.footerRows = body.footerRows;
        if ('trailingHeaderCols' in body && typeof body.trailingHeaderCols === 'number')
          next.trailingHeaderCols = body.trailingHeaderCols;
        if ('banded' in body && typeof body.banded === 'boolean') next.banded = body.banded;
        if ('rowRoles' in body && Array.isArray(body.rowRoles))
          next.rowRoles = body.rowRoles.filter(isRowRoleEntry);
        if ('ruleLines' in body && Array.isArray(body.ruleLines)) {
          const lines = body.ruleLines.filter(isRuleLineEntry);
          next.rules = next.rules.map((rule) => ({
            ...rule,
            line:
              lines.find((entry) => entry.axis === rule.axis && entry.ord === rule.ord)?.line ??
              rule.line,
          }));
        }
        if ('merges' in body && Array.isArray(body.merges)) {
          next.merges = body.merges.filter(
            (m: unknown): m is SyntheticTable['merges'][number] =>
              typeof m === 'object' && m !== null && 'row0' in m && 'colSpan' in m
          );
        }
        if (
          'x0' in body &&
          typeof body.x0 === 'number' &&
          typeof body.y0 === 'number' &&
          typeof body.x1 === 'number' &&
          typeof body.y1 === 'number'
        ) {
          tableBounds = { x0: body.x0, y0: body.y0, x1: body.x1, y1: body.y1 };
        }
        layoutTable = next;
      }
      const before = layoutTableRegion();
      tableRevision += 1;
      const region = layoutTableRegion();
      return json(route, {
        noChange: false,
        correction: {
          id: `synthetic-correction-${String(tableRevision)}`,
          documentId: LAYOUT_DOCUMENT_ID,
          kind: 'table',
          status: 'active',
          op: 'set_headers',
          fieldKey: '',
          beforeRegionId: before.id,
          afterRegionId: region.id,
          oldValue: null,
          newValue: null,
          createdAt: NOW,
        },
        region,
      });
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
    if (p.match(/^\/documents\/[^/]+\/page-transforms$/) && method === 'GET') {
      return json(route, { transforms: pageTransforms });
    }
    if (p.match(/^\/documents\/[^/]+\/pages\/\d+\/transform$/) && method === 'POST') {
      const body = route.request().postDataJSON() as {
        id: string;
        rotationQuarterTurns: 0 | 1 | 2 | 3;
      };
      const page = Number(p.split('/')[4]);
      const transform = {
        page,
        rotationQuarterTurns: body.rotationQuarterTurns,
        deskewDeg: 0,
        source: 'user',
        updatedAt: NOW,
      };
      pageTransforms = [
        ...pageTransforms.filter((item) => item.page !== page),
        transform,
      ];
      return json(route, { correctionId: body.id, transform });
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
    if (p === '/saved-views' || p === '/folders') return json(route, { items: [] });
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
