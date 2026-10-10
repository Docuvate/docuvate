// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
/** @vitest-environment jsdom */
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import i18n from '../i18n';
import { PaperlessConnectorSetupPage } from './PaperlessConnectorSetupPage';

const api = vi.hoisted(() => ({
  listConnectorInstallations: vi.fn(),
  getPaperlessInstallation: vi.fn(),
  getLatestPaperlessImportRun: vi.fn(),
  getPaperlessImportRun: vi.fn(),
  testPaperlessInstallationConnection: vi.fn(),
  paperlessImportDryRun: vi.fn(),
  startPaperlessImport: vi.fn(),
  updatePaperlessInstallation: vi.fn(),
}));

vi.mock('../lib/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../lib/api')>();
  return { ...actual, ...api };
});

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useBlocker: () => ({
      state: 'unblocked',
      proceed: vi.fn(),
      reset: vi.fn(),
    }),
  };
});

vi.mock('../components/save/PageFormSaveKit', () => ({
  PageFormSaveKit: () => null,
}));

const installationId = 'inst-paperless-1';

const baseInstallation = {
  id: installationId,
  pluginId: 'paperless',
  displayName: 'Archiv',
  enabled: true,
};

const baseSettings = {
  displayName: 'Archiv',
  baseUrl: 'https://paperless.example.com',
  keepOcrText: true,
  rerunOcr: false,
  includeArchivedPdf: false,
  hasStoredApiToken: true,
  hasStoredUsername: false,
  hasStoredPassword: false,
};

function renderPage() {
  return render(
    <MemoryRouter initialEntries={[`/settings/connectors/paperless/${installationId}`]}>
      <Routes>
        <Route
          path="/settings/connectors/paperless/:installationId"
          element={<PaperlessConnectorSetupPage />}
        />
      </Routes>
    </MemoryRouter>
  );
}

beforeEach(async () => {
  await i18n.changeLanguage('de');
  api.listConnectorInstallations.mockResolvedValue([baseInstallation]);
  api.getPaperlessInstallation.mockResolvedValue(baseSettings);
  api.getLatestPaperlessImportRun.mockRejectedValue(new Error('no run'));
  api.getPaperlessImportRun.mockResolvedValue({
    run: {
      id: 'run-1',
      status: 'completed',
      progressProcessed: 3,
      progressTotal: 3,
      fatalErrorKey: null,
    },
    errors: [],
  });
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.useRealTimers();
});

describe('PaperlessConnectorSetupPage', () => {
  it('shows stored-secret placeholder instead of the API token', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Gespeichert')).toBeTruthy();
    });
    const tokenInput = screen.getByPlaceholderText('Gespeichert');
    expect((tokenInput as HTMLInputElement).type).toBe('password');
    expect((tokenInput as HTMLInputElement).value).toBe('');
  });

  it('shows test-connection success message', async () => {
    api.testPaperlessInstallationConnection.mockResolvedValue({ apiVersion: 3 });
    renderPage();
    await waitFor(() => screen.getByRole('button', { name: /Verbindung testen/i }));
    fireEvent.click(screen.getByRole('button', { name: /Verbindung testen/i }));
    await waitFor(() => {
      expect(screen.getByText(/Verbindung erfolgreich \(API Version 3\)/i)).toBeTruthy();
    });
  });

  it('shows test-connection error message', async () => {
    api.testPaperlessInstallationConnection.mockRejectedValue(
      new Error('connectors.plugins.paperless.errors.unreachable')
    );
    renderPage();
    await waitFor(() => screen.getByRole('button', { name: /Verbindung testen/i }));
    fireEvent.click(screen.getByRole('button', { name: /Verbindung testen/i }));
    await waitFor(() => {
      expect(screen.getByText(/Paperless ist nicht erreichbar/i)).toBeTruthy();
    });
  });

  it('renders dry-run summary counts', async () => {
    api.paperlessImportDryRun.mockResolvedValue({
      summary: {
        documentCount: 10,
        tagCount: 4,
        correspondentCount: 2,
        documentTypeCount: 1,
        storagePathCount: 1,
        customFieldCount: 1,
        mappingConflicts: [],
      },
    });
    renderPage();
    await waitFor(() => screen.getByRole('button', { name: /Import-Vorschau/i }));
    fireEvent.click(screen.getByRole('button', { name: /Import-Vorschau/i }));
    await waitFor(() => {
      expect(screen.getByText('10 Dokumente')).toBeTruthy();
      expect(screen.getByText('4 Labels')).toBeTruthy();
    });
  });

  it('polls import run until completed and shows German status', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    api.getLatestPaperlessImportRun.mockResolvedValue({
      run: {
        id: 'run-1',
        status: 'running',
        progressProcessed: 1,
        progressTotal: 5,
        fatalErrorKey: null,
      },
      errors: [],
    });
    api.getPaperlessImportRun
      .mockResolvedValueOnce({
        run: {
          id: 'run-1',
          status: 'running',
          progressProcessed: 2,
          progressTotal: 5,
          fatalErrorKey: null,
        },
        errors: [],
      })
      .mockResolvedValueOnce({
        run: {
          id: 'run-1',
          status: 'completed',
          progressProcessed: 5,
          progressTotal: 5,
          fatalErrorKey: null,
        },
        errors: [],
      });
    api.startPaperlessImport.mockResolvedValue({
      run: {
        id: 'run-1',
        status: 'running',
        progressProcessed: 1,
        progressTotal: 5,
        fatalErrorKey: null,
      },
    });

    renderPage();
    await waitFor(() => screen.getByRole('button', { name: /^Import starten$/i }));
    fireEvent.click(screen.getByRole('button', { name: /^Import starten$/i }));

    await waitFor(() => {
      expect(screen.getByText(/Läuft:/i)).toBeTruthy();
    });

    await vi.advanceTimersByTimeAsync(2000);
    await waitFor(() => {
      expect(api.getPaperlessImportRun).toHaveBeenCalled();
    });
    await vi.advanceTimersByTimeAsync(2000);
    await waitFor(() => {
      expect(screen.getByText(/Abgeschlossen:/i)).toBeTruthy();
    });
  });

  it('shows translated fatal error when run failed', async () => {
    api.getLatestPaperlessImportRun.mockResolvedValue({
      run: {
        id: 'run-2',
        status: 'failed',
        progressProcessed: 0,
        progressTotal: 0,
        fatalErrorKey: 'connectors.plugins.paperless.errors.unauthorized',
      },
      errors: [],
    });
    renderPage();
    await waitFor(() => {
      expect(screen.getByText(/Fehlgeschlagen:/i)).toBeTruthy();
      expect(screen.getByText(/Paperless hat die Anmeldung abgelehnt/i)).toBeTruthy();
    });
  });
});
