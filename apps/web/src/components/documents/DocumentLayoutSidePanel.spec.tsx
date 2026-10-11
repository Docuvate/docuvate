// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { LayoutIrDocument } from '@docuvate/contracts';
import { render, screen } from '@testing-library/react';
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

describe('DocumentLayoutSidePanel', () => {
  it('renders layout tab labels', () => {
    render(
      <DocumentLayoutSidePanel
        documentId="doc-1"
        layoutIr={layoutIr}
        fields={[{ key: 'datum', value: '01.01.2026' }]}
        blocks={[]}
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
    expect(screen.getByRole('tab', { name: 'documents.layoutTabFields' })).toBeTruthy();
    expect(screen.getByText('datum')).toBeTruthy();
  });

  it('shows empty fields hint when no values are present', () => {
    render(
      <DocumentLayoutSidePanel
        documentId="doc-1"
        layoutIr={layoutIr}
        fields={[]}
        blocks={[]}
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
});
