// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
/** @vitest-environment jsdom */
import { render } from '@testing-library/react';
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

describe('GlobalSearch trigger', () => {
  it('renders the search icon inside the desktop trigger', () => {
    const { container } = render(
      <I18nextProvider i18n={i18n}>
        <MemoryRouter>
          <GlobalSearch narrowTopbar={false} />
        </MemoryRouter>
      </I18nextProvider>
    );
    const trigger = container.querySelector('.global-search-trigger');
    expect(trigger).toBeTruthy();
    expect(trigger?.querySelector('.global-search-trigger-icon svg')).toBeTruthy();
  });
});
