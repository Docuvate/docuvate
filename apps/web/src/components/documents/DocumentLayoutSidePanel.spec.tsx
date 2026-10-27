// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { DocumentRegionDto, LayoutIrDocument } from '@docuvate/contracts';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('../../lib/api', () => ({
  fetchDocumentLayoutTypst: vi.fn(),
}));

vi.mock('react-i18next', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-i18next')>();
  return {
    ...actual,
    useTranslation: () => ({
      t: (key: string) => key,
      i18n: { language: 'de' },
    }),
  };
});

import { DocumentLayoutSidePanel } from './DocumentLayoutSidePanel';

const layoutIr: LayoutIrDocument = {
  version: 1,
  pages: [
    {
      page: 1,
      widthPt: 595,
      heightPt: 842,
      blocks: [
        {
          page: 1,
          x: 0.1,
          y: 0.1,
          width: 0.5,
          height: 0.04,
          text: 'Test heading',
          fontSizePt: 13,
          weight: 'bold',
        },
      ],
      tables: [],
      widgets: [],
    },
  ],
};

const fieldRegion: DocumentRegionDto = {
  id: 'region-1',
  documentId: 'doc-1',
  page: 1,
  shape: 'rect',
  role: 'field',
  x0: 0.1,
  y0: 0.1,
  x1: 0.4,
  y1: 0.2,
  irSha256: 'ir',
  needsReview: false,
  blockIndexes: [],
  field: { fieldKey: 'datum', valueOverride: null },
  createdAt: '2026-01-01T00:00:00.000Z',
};

function renderFieldsPanel(hideInlineFieldList = false) {
  return render(
    <DocumentLayoutSidePanel
      documentId="doc-1"
      layoutIr={layoutIr}
      fields={[{ key: 'datum', value: '01.01.2026' }]}
      knownFieldKeys={new Set()}
      fieldLabelForKey={(key) => key}
      activeTab="fields"
      onTabChange={() => undefined}
      activeOverlayId={null}
      onOverlaySelect={() => undefined}
      onAcceptSuggestion={() => undefined}
      onDismissSuggestion={() => undefined}
      dismissedSuggestions={new Set()}
      fieldRegions={[fieldRegion]}
      hideInlineFieldList={hideInlineFieldList}
    />
  );
}

describe('DocumentLayoutSidePanel', () => {
  it('renders layout tab labels', () => {
    render(
      <DocumentLayoutSidePanel
        documentId="doc-1"
        layoutIr={layoutIr}
        fields={[{ key: 'datum', value: '01.01.2026' }]}
        knownFieldKeys={new Set()}
        fieldLabelForKey={(k) => k}
        activeTab="fields"
        onTabChange={() => undefined}
        activeOverlayId={null}
        onOverlaySelect={() => undefined}
        onAcceptSuggestion={() => undefined}
        onDismissSuggestion={() => undefined}
        dismissedSuggestions={new Set()}
      />
    );
    expect(screen.getByRole('tab', { name: 'documents.layoutTabOverview' })).toBeTruthy();
    expect(screen.getByText('datum')).toBeTruthy();
  });

  it('shows empty fields hint when no values are present', () => {
    render(
      <DocumentLayoutSidePanel
        documentId="doc-1"
        layoutIr={layoutIr}
        fields={[]}
        knownFieldKeys={new Set()}
        fieldLabelForKey={(k) => k}
        activeTab="fields"
        onTabChange={() => undefined}
        activeOverlayId={null}
        onOverlaySelect={() => undefined}
        onAcceptSuggestion={() => undefined}
        onDismissSuggestion={() => undefined}
        dismissedSuggestions={new Set()}
      />
    );
    expect(screen.getByText('documents.layoutFieldsEmpty')).toBeTruthy();
  });

  it('renders one source chip per field in the inline list', () => {
    const { container } = renderFieldsPanel();
    expect(container.querySelectorAll('.source-chip')).toHaveLength(1);
    expect(screen.getByRole('button', { name: 'Seite 1' })).toBeTruthy();
  });

  it('unmounts the inline field list when the correction sheet replaces it', async () => {
    const { container } = renderFieldsPanel(true);
    expect(container.querySelectorAll('.source-chip')).toHaveLength(0);
    expect(container.querySelector('.layout-side-fields')).toBeNull();
    expect(container.querySelector('.field-value-row')).toBeNull();
    await waitFor(() => {
      const body = container.querySelector('.layout-side-panel-body');
      expect(body?.hasAttribute('inert')).toBe(true);
      expect(body?.getAttribute('aria-hidden')).toBe('true');
    });
  });
});
