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

  it('renders playful German unreachable copy with reconnect controls', async () => {
    await i18n.changeLanguage('de');
    render(
      <MemoryRouter>
        <DocuvateErrorPage variant="server-unreachable" enableAutoReconnect />
      </MemoryRouter>
    );
    expect(screen.getByRole('alert')).toBeTruthy();
    expect(screen.getByText('Unsere Dokumente machen gerade Kaffeepause.')).toBeTruthy();
    expect(screen.getByRole('button', { name: /Jetzt erneut versuchen/i })).toBeTruthy();
    expect(screen.getByRole('progressbar')).toBeTruthy();
  });

  it('exposes technical details link for admins', async () => {
    await i18n.changeLanguage('de');
    render(
      <MemoryRouter>
        <DocuvateErrorPage variant="server-error-page" httpStatus={503} />
      </MemoryRouter>
    );
    expect(screen.getByRole('button', { name: 'Status / technische Details' })).toBeTruthy();
  });
});
