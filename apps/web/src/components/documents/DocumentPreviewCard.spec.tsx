// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
/** @vitest-environment jsdom */
import type { DocumentDto } from '@docuvate/contracts';
import { render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { describe, expect, it } from 'vitest';

import i18n from '../../i18n';
import { DocumentPreviewCard } from './DocumentPreviewCard';

function stubDoc(overrides: Partial<DocumentDto> = {}): DocumentDto {
  return {
    id: 'doc-1',
    filename: 'note.txt',
    title: 'note.txt',
    status: 'ready',
    mimeType: 'text/plain',
    fileSizeBytes: 12,
    formatBadge: 'TXT',
    previewAvailable: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    tags: [],
    tagSuggestions: [],
    folderId: null,
    folder: null,
    documentDate: null,
    notes: null,
    extraction: { text: 'Hello from txt', fields: [] },
    ...overrides,
  };
}

describe('DocumentPreviewCard plain text', () => {
  it('shows txt body even when previewUnavailable is set', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <DocumentPreviewCard
          doc={stubDoc()}
          isPdf={false}
          isImage={false}
          isPlainText
          plainTextPreview="Hello from txt"
          previewUnavailable
        />
      </I18nextProvider>
    );
    expect(screen.getByTestId('doc-preview-text').textContent).toBe('Hello from txt');
    expect(screen.queryByText(/nicht verfügbar|not available/i)).toBeNull();
  });
});
