// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { afterEach, describe, expect, it, vi } from 'vitest';

import i18n from '../i18n';
import { fetchDocumentContentBlob } from './api';

describe('fetchDocumentContentBlob errors', () => {
  afterEach(async () => {
    vi.unstubAllGlobals();
    await i18n.changeLanguage('de');
  });

  it('uses the active language when the preview cannot be loaded', async () => {
    await i18n.changeLanguage('en');
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve({ ok: false }))
    );
    await expect(fetchDocumentContentBlob('doc-1')).rejects.toThrow('Could not load the preview.');
  });
});
