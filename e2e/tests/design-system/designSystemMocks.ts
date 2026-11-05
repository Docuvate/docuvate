// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { Page, Route } from '@playwright/test';

/**
 * Synthetic API for design-system screenshots. Every request under `/api/` is answered here,
 * so tests never reach a real Docuvate API or real documents. All titles and labels are invented.
 */

const NOW = '2026-10-01T09:00:00.000Z';

const SYNTHETIC_TAGS = [
  { id: 'tag-inbox', name: 'Posteingang', color: '#0369a1', isInbox: true },
  { id: 'tag-invoice', name: 'Rechnung', color: '#3b82f6', isInbox: false },
  { id: 'tag-insurance', name: 'Versicherung', color: '#10b981', isInbox: false },
  { id: 'tag-vehicle', name: 'Fahrzeug', color: '#f59e0b', isInbox: false },
  { id: 'tag-contract', name: 'Vertrag', color: '#7c3aed', isInbox: false },
  { id: 'tag-tax', name: 'Steuer', color: '#f43f5e', isInbox: false },
];

function syntheticDocument(index: number) {
  const tagSets = [
    ['tag-invoice'],
    ['tag-insurance', 'tag-contract'],
    ['tag-vehicle'],
    ['tag-inbox'],
    ['tag-tax', 'tag-invoice'],
    [],
  ];
  const tagIds = tagSets[index % tagSets.length] ?? [];
  const number = String(index + 1).padStart(4, '0');
  return {
    id: `synthetic-doc-${number}`,
    filename: `beispiel-${number}.pdf`,
    title: `Beispieldokument ${number}`,
    status: index === 3 ? 'extracting' : 'ready',
    mimeType: 'application/pdf',
    fileSizeBytes: 120_000 + index * 1_000,
    formatBadge: 'PDF',
    previewAvailable: false,
    documentDate: `2026-0${String((index % 9) + 1)}-1${String(index % 9)}`,
    folderId: null,
    folder: null,
    tags: SYNTHETIC_TAGS.filter((tag) => tagIds.includes(tag.id)),
    tagSuggestions: [],
    createdAt: NOW,
    updatedAt: NOW,
    ownerLine: null,
    layoutIrAvailable: false,
  };
}

const SYNTHETIC_DOCUMENTS = Array.from({ length: 12 }, (_, index) => syntheticDocument(index));

const MOCK_SESSION = {
  session: {
    id: 'ds-session',
    token: 'ds-token',
    userId: 'ds-user',
    expiresAt: '2099-01-01T00:00:00.000Z',
  },
  user: {
    id: 'ds-user',
    email: 'designer@example.test',
    name: 'Design Review',
    emailVerified: true,
  },
};

function json(route: Route, body: unknown, status = 200): Promise<void> {
  return route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
}

const EMPTY_PAGE = { items: [], nextCursor: null, hasMore: false, total: 0 };

export interface DesignSystemMockLog {
  unmatched: string[];
}

export async function installDesignSystemMocks(
  page: Page,
  theme: 'light' | 'dark'
): Promise<DesignSystemMockLog> {
  const log: DesignSystemMockLog = { unmatched: [] };
  await page.route(/\/api\//, async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname.replace(/^\/api/, '').replace(/^\/v1/, '');
    const method = route.request().method();

    if (path.startsWith('/auth/get-session')) return json(route, MOCK_SESSION);
    if (path.startsWith('/auth/')) return json(route, {});
    if (path === '/health' || path.startsWith('/health/')) return json(route, { status: 'ok' });
    if (path === '/remote-config') {
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
    if (path === '/settings' && method === 'GET') {
      return json(route, {
        preferredExtractorEngine: 'pipeline',
        advancedFeaturesEnabled: false,
        useArenaWinnerAsDefault: false,
        themePreference: theme,
        locale: 'de',
      });
    }
    if (path === '/tags' && method === 'GET') return json(route, { items: SYNTHETIC_TAGS });
    if (path.startsWith('/tags/search')) {
      return json(route, {
        items: SYNTHETIC_TAGS,
        nextCursor: null,
        hasMore: false,
        total: SYNTHETIC_TAGS.length,
      });
    }
    if (path === '/documents' && method === 'GET') {
      return json(route, {
        items: SYNTHETIC_DOCUMENTS,
        nextCursor: null,
        hasMore: false,
        total: SYNTHETIC_DOCUMENTS.length,
        libraryUi: { showDocumentOwnerLine: false },
      });
    }
    if (path === '/documents/review-queue/summary') return json(route, { pendingCount: 0 });
    if (path === '/dashboard' && method === 'GET') {
      return json(route, {
        editMode: false,
        widgets: [
          { id: 'w-stats', type: 'statistics', position: 0, widthCols: 6, heightRows: 1 },
          { id: 'w-attention', type: 'attention', position: 1, widthCols: 6, heightRows: 1 },
          {
            id: 'w-recent',
            type: 'recent_documents',
            position: 2,
            widthCols: 12,
            heightRows: 2,
            itemLimit: 6,
          },
        ],
      });
    }
    if (path === '/dashboard/statistics') {
      return json(route, {
        documentsTotal: SYNTHETIC_DOCUMENTS.length,
        byStatus: { queued: 0, extracting: 1, ready: SYNTHETIC_DOCUMENTS.length - 1, failed: 0 },
        labelsAssignedCount: 14,
        unlabeledCount: 2,
        labelsTotalCount: SYNTHETIC_TAGS.length - 1,
        topLabels: SYNTHETIC_TAGS.filter((tag) => !tag.isInbox).map((tag, index) => ({
          tagId: tag.id,
          id: tag.id,
          name: tag.name,
          color: tag.color,
          count: 6 - index,
          documentCount: 6 - index,
        })),
      });
    }
    if (path === '/dashboard/installation-admin') return json(route, { isInstallationAdmin: true });
    if (path === '/labels/document-inventory/summary') {
      return json(route, {
        inventory: { total: SYNTHETIC_DOCUMENTS.length, labeled: 10, unlabeled: 2 },
        documentCountByTagId: Object.fromEntries(
          SYNTHETIC_TAGS.map((tag, index) => [tag.id, 6 - index])
        ),
      });
    }
    if (path === '/labels/recommendations') return json(route, { items: [], state: 'ready' });
    if (path === '/labels/map') {
      return json(route, {
        points: [],
        documentCount: SYNTHETIC_DOCUMENTS.length,
        tagCount: SYNTHETIC_TAGS.length,
        extractedDocumentCount: SYNTHETIC_DOCUMENTS.length,
        emptyReason: null,
        coverageSummary: null,
      });
    }
    if (path === '/labels/recommendation-blocklist')
      return json(route, { items: [], patterns: [] });
    if (path === '/review-queue/summary') return json(route, { pendingCount: 3 });
    if (path === '/admin/access') {
      return json(route, { isAdministrator: true, role: 'admin', roleDescriptions: [] });
    }
    if (path === '/settings/workspace-ml') {
      return json(route, {
        labelAutoAssign: 'cautious',
        labelSuggestions: 'normal',
        duplicateDetection: 'exact',
        fieldAcceptance: 'normal',
        editable: true,
      });
    }
    if (path === '/settings/extraction-engines') {
      return json(route, {
        engines: [
          { id: 'pipeline', label: 'Pipeline', description: 'Synthetic engine description' },
        ],
      });
    }
    if (path === '/connectors/catalog') {
      return json(route, { categories: [], plugins: [], viewerIsServerAdmin: true });
    }
    if (path === '/saved-views' || path === '/recognized-fields' || path === '/folders') {
      return json(route, { items: [] });
    }
    if (method !== 'GET') return json(route, {});
    log.unmatched.push(`${method} ${path}`);
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
