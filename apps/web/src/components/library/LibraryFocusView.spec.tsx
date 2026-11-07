// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { DocumentDto } from '@docuvate/contracts';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import i18n from '../../i18n';
import { LibraryFocusView } from './LibraryFocusView';

vi.mock('../documents', () => ({
  DocumentPreviewCard: () => null,
  ExtractionProgressBar: () => null,
}));

vi.mock('../../lib/documentPreviewCache', () => ({
  fetchDocumentPreviewBuffer: vi.fn(() => Promise.resolve(new ArrayBuffer(8))),
}));

function documentFixture(id: string, title: string): DocumentDto {
  return {
    id,
    filename: `${title}.pdf`,
    title,
    status: 'ready',
    mimeType: 'application/pdf',
    fileSizeBytes: 1200,
    documentDate: '2026-10-22',
    tags: [],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-02T00:00:00.000Z',
  };
}

const items = [
  documentFixture('doc-a', 'Lease agreement'),
  documentFixture('doc-b', 'Tax notice'),
  documentFixture('doc-c', 'Meeting minutes'),
];

function renderFocus(documents: DocumentDto[]) {
  return render(
    <MemoryRouter>
      <LibraryFocusView
        items={documents}
        selected={new Set()}
        onToggleSelect={() => undefined}
        onContextMenu={() => undefined}
      />
    </MemoryRouter>
  );
}

describe('LibraryFocusView', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en');
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage('de');
  });

  it('moves focus with each ArrowDown so later rows can be reached', () => {
    renderFocus(items);
    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(3);
    options[0]?.focus();
    fireEvent.keyDown(options[0] ?? document.body, { key: 'ArrowDown' });
    expect(document.activeElement).toBe(options[1]);
    fireEvent.keyDown(document.activeElement ?? document.body, { key: 'ArrowDown' });
    expect(document.activeElement).toBe(options[2]);
    expect(options[2]?.getAttribute('aria-selected')).toBe('true');
  });

  it('formats the document calendar date in the active language', () => {
    renderFocus(items.slice(0, 1));
    expect(screen.getAllByText('Oct 22, 2026').length).toBeGreaterThan(0);
  });

  it('shows a translated preview error instead of a hard-coded German sentence', async () => {
    const cache = await import('../../lib/documentPreviewCache');
    vi.mocked(cache.fetchDocumentPreviewBuffer).mockRejectedValueOnce(new Error('preview down'));
    renderFocus(items.slice(0, 1));
    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toBe('Could not load the preview.');
    expect(screen.queryByText('Vorschau konnte nicht geladen werden')).toBeNull();
  });
});
