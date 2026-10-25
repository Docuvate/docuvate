// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
/** @vitest-environment jsdom */
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

import i18n from '../../i18n';
import { DocuvateErrorPage } from './DocuvateErrorPage';

vi.mock('../../lib/apiHealth', () => ({
  probeApiHealth: vi.fn(async () => ({ ok: false, errorType: 'network' })),
  apiHealthCheckUrl: () => 'http://localhost/api/health',
}));

describe('DocuvateErrorPage', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders German unreachable copy with reconnect affordances', async () => {
    await i18n.changeLanguage('de');
    render(
      <MemoryRouter>
        <DocuvateErrorPage variant="server-unreachable" enableAutoReconnect />
      </MemoryRouter>
    );
    expect(screen.getByRole('alert')).toBeTruthy();
    expect(screen.getByText('Docuvate ist gerade nicht erreichbar')).toBeTruthy();
    expect(screen.getByRole('button', { name: /Jetzt erneut versuchen/i })).toBeTruthy();
  });

  it('exposes technical details for admins', async () => {
    await i18n.changeLanguage('de');
    render(
      <MemoryRouter>
        <DocuvateErrorPage
          variant="server-error-page"
          sourceError={new TypeError('Failed to fetch')}
          httpStatus={503}
        />
      </MemoryRouter>
    );
    expect(screen.getByTestId('docuvate-error-server-error-page').querySelector('.ds-error-technical-details-toggle')).toBeTruthy();
  });
});
