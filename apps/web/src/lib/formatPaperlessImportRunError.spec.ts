// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it } from 'vitest';

import i18n from '../i18n';
import { formatPaperlessImportRunError } from './formatPaperlessImportRunError';

describe('formatPaperlessImportRunError', () => {
  it('translates documentTooLarge with maxMb and never returns the raw key', () => {
    const message = formatPaperlessImportRunError(i18n.t.bind(i18n), {
      id: 'err-1',
      sourceDocumentId: '170',
      sourceDocumentTitle: 'Große PDF',
      messageKey: 'connectors.paperlessImport.documentTooLarge',
      messageDetail: null,
      messageParams: { maxMb: 200 },
      createdAt: '2026-01-01T00:00:00.000Z',
    });
    expect(message).toMatch(/200/);
    expect(message).not.toMatch(/connectors\.paperlessImport/);
  });
});
