// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
/** @vitest-environment jsdom */
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { App } from './App';
import i18n from './i18n';

const installationId = 'inst-connector-route-1';

const api = vi.hoisted(() => ({
  listConnectorInstallations: vi.fn(),
  getPaperlessInstallation: vi.fn(),
  getLatestPaperlessImportRun: vi.fn(),
}));

vi.mock('./lib/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./lib/api')>();
  return { ...actual, ...api };
});

vi.mock('./lib/auth-client', () => ({
  authClient: {
    useSession: vi.fn(() => ({
      data: {
        session: { id: 'session-1' },
        user: { id: 'user-1', name: 'Test User', email: 'test@example.com' },
      },
      isPending: false,
      error: null,
    })),
  },
  authSessionUserId: () => 'user-1',
}));

vi.mock('./lib/remoteConfig', () => ({
  useFeatureFlags: () => ({
    layoutReconstructionCompare: false,
    sourceConnectors: false,
    experimentalResearchModels: false,
    exactAnswers: false,
    smartDuplicates: false,
    answerAbstention: false,
    learnedValueTypes: true,
    layoutKeyValueRoles: false,
    localChatModel: false,
  }),
  ensureRemoteConfigLoaded: vi.fn(() => Promise.resolve({})),
  readFeatureFlags: vi.fn(),
  isSourceConnectorPlugin: (pluginId: string) =>
    pluginId === 'paperless' || pluginId === 'sftp_fetch',
}));

vi.mock('./components/AppShell', () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => <div data-testid="app-shell">{children}</div>,
}));

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

vi.mock('./components/save/PageFormSaveKit', () => ({
  PageFormSaveKit: () => null,
}));

beforeEach(async () => {
  await i18n.changeLanguage('de');
  api.listConnectorInstallations.mockResolvedValue([
    {
      id: installationId,
      pluginId: 'paperless',
      displayName: 'Paperless-ngx',
      enabled: true,
      sourceScope: { mode: 'all', paths: [] },
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
  ]);
  api.getPaperlessInstallation.mockResolvedValue({
    displayName: 'Paperless-ngx',
    baseUrl: 'https://paperless.example.com',
    keepOcrText: true,
    rerunOcr: false,
    includeArchivedPdf: false,
    hasStoredApiToken: true,
    hasStoredUsername: false,
    hasStoredPassword: false,
    lastSuccessfulModifiedAt: null,
  });
  api.getLatestPaperlessImportRun.mockRejectedValue(new Error('no run'));
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('App connector routes with sourceConnectors disabled', () => {
  it('still renders connector setup at /settings/connectors/paperless/:connectionId', async () => {
    render(
      <MemoryRouter initialEntries={[`/settings/connectors/paperless/${installationId}`]}>
        <App />
      </MemoryRouter>
    );
    await waitFor(() => {
      expect(screen.getByPlaceholderText('https://paperless.example.com')).toBeTruthy();
    });
  });
});
