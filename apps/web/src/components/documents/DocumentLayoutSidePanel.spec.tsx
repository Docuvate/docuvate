import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { LayoutIrDocument } from '@docuvate/contracts';

vi.mock('../../lib/api', () => ({
  fetchDocumentLayoutTypst: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

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
        onTabChange={() => {}}
        activeOverlayId={null}
        onOverlaySelect={() => {}}
        onAcceptSuggestion={() => {}}
        onDismissSuggestion={() => {}}
        dismissedSuggestions={new Set()}
      />
    );
    expect(screen.getByRole('tab', { name: 'documents.layoutTabFields' })).toBeTruthy();
    expect(screen.getByText('datum')).toBeTruthy();
  });
});
