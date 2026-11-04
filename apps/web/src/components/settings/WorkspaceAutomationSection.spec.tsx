// @vitest-environment jsdom
// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { WorkspaceMlSettingsDto } from '@docuvate/contracts';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import i18n from '../../i18n';
import { WorkspaceAutomationSection } from './WorkspaceAutomationSection';

const api = vi.hoisted(() => ({
  getWorkspaceMlSettings: vi.fn(),
  updateWorkspaceMlSettings: vi.fn(),
}));

const notify = vi.hoisted(() => ({
  notifySaved: vi.fn(),
  notifySaveError: vi.fn(),
}));

vi.mock('../../lib/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../lib/api')>();
  return { ...actual, ...api };
});

vi.mock('../../lib/saveNotify', () => notify);

function settings(overrides: Partial<WorkspaceMlSettingsDto> = {}): WorkspaceMlSettingsDto {
  return {
    labelAutoAssign: 'normal',
    labelSuggestions: 'normal',
    duplicateDetection: 'exact',
    fieldAcceptance: 'normal',
    editable: true,
    ...overrides,
  };
}

async function renderSection() {
  render(<WorkspaceAutomationSection icon={null} />);
  return screen.findByRole('radiogroup', { name: 'Duplikate erkennen' });
}

describe('WorkspaceAutomationSection', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('de');
    api.getWorkspaceMlSettings.mockReset();
    api.updateWorkspaceMlSettings.mockReset();
    notify.notifySaved.mockReset();
    notify.notifySaveError.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  it('shows the four German presets with the current values selected', async () => {
    api.getWorkspaceMlSettings.mockResolvedValue(settings());
    await renderSection();

    expect(screen.getByText('Automatik & Erkennung')).toBeTruthy();
    for (const name of ['Labels automatisch vergeben', 'Labels vorschlagen', 'Felder übernehmen']) {
      expect(screen.getByRole('radiogroup', { name })).toBeTruthy();
    }
    expect(screen.getByRole('radio', { name: 'Nur exakt' }).getAttribute('aria-checked')).toBe('true');
  });

  it('saves a changed duplicate mode for admins', async () => {
    api.getWorkspaceMlSettings.mockResolvedValue(settings());
    api.updateWorkspaceMlSettings.mockResolvedValue(settings({ duplicateDetection: 'similar' }));
    await renderSection();

    fireEvent.click(screen.getByRole('radio', { name: 'Auch ähnliche' }));

    await waitFor(() => {
      expect(notify.notifySaved).toHaveBeenCalledTimes(1);
    });
    expect(api.updateWorkspaceMlSettings).toHaveBeenCalledWith({ duplicateDetection: 'similar' });
    expect(screen.getByRole('radio', { name: 'Auch ähnliche' }).getAttribute('aria-checked')).toBe('true');
  });

  it('reverts the choice and reports when saving fails', async () => {
    api.getWorkspaceMlSettings.mockResolvedValue(settings());
    api.updateWorkspaceMlSettings.mockRejectedValue(new Error('offline'));
    const duplicates = await renderSection();

    fireEvent.click(within(duplicates).getByRole('radio', { name: 'Aus' }));

    await waitFor(() => {
      expect(notify.notifySaveError).toHaveBeenCalledTimes(1);
    });
    expect(screen.getByRole('radio', { name: 'Nur exakt' }).getAttribute('aria-checked')).toBe('true');
  });

  it('is read-only for members', async () => {
    api.getWorkspaceMlSettings.mockResolvedValue(settings({ editable: false }));
    await renderSection();

    expect(screen.getByText('Nur Admins können diese Einstellungen ändern.')).toBeTruthy();
    const similar = screen.getByRole('radio', { name: 'Auch ähnliche' });
    expect(similar.hasAttribute('disabled')).toBe(true);
    fireEvent.click(similar);
    expect(api.updateWorkspaceMlSettings).not.toHaveBeenCalled();
  });
});
