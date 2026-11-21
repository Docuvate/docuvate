// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
/** @vitest-environment jsdom */
import { render, waitFor } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import i18n from '../../i18n';
import { GlobalSearch } from './GlobalSearch';

vi.mock('../../lib/api', () => ({
  getConnectorCatalog: vi.fn().mockResolvedValue({ viewerIsServerAdmin: false }),
  listRecognizedFields: vi.fn().mockResolvedValue([]),
  globalSearch: vi.fn().mockResolvedValue({ groups: [] }),
}));

vi.mock('../../lib/auth-client', () => ({
  authClient: { useSession: () => ({ data: null }) },
  authSessionUserId: () => null,
}));

describe('GlobalSearch Mod+K shortcut', () => {
  it('opens the palette even when a library search input is focused', async () => {
    const { container } = render(
      <I18nextProvider i18n={i18n}>
        <MemoryRouter>
          <div>
            <input data-testid="library-label-filter" type="search" defaultValue="" />
            <GlobalSearch narrowTopbar={false} />
          </div>
        </MemoryRouter>
      </I18nextProvider>
    );

    const filter = container.querySelector('[data-testid="library-label-filter"]');
    expect(filter instanceof HTMLInputElement).toBe(true);
    if (!(filter instanceof HTMLInputElement)) {
      throw new Error('expected library label filter input');
    }
    filter.focus();
    expect(document.activeElement).toBe(filter);

    window.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'k',
        ctrlKey: true,
        bubbles: true,
        cancelable: true,
      })
    );

    await waitFor(() => {
      expect(document.querySelector('.global-search-palette-input')).toBeTruthy();
    });
  });
});
