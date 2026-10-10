// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
/** @vitest-environment jsdom */
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import i18n from '../../i18n';
import { UserAccountMenu } from './UserAccountMenu';

vi.mock('../../lib/auth-client', () => ({
  authClient: {
    useSession: vi.fn(() => ({
      data: { user: { id: 'user-1', name: 'Elena Krämer', email: 'elena@beispiel.de' } },
    })),
  },
}));

vi.mock('../../lib/useDocuvateTheme', () => ({
  useDocuvateTheme: () => ({
    themePreference: 'light' as const,
    setThemePreference: vi.fn(),
  }),
}));

vi.mock('../../lib/persistUserUiPreference', () => ({
  persistUserUiPreference: vi.fn(),
}));

vi.mock('../../lib/authSignOut', () => ({
  performSignOut: vi.fn(),
}));

vi.mock('./ThemePreferencePicker', () => ({
  ThemePreferencePicker: () => <div data-testid="theme-picker">theme</div>,
}));

vi.mock('./LocaleSwitcher', () => ({
  LocaleSwitcher: () => <div data-testid="locale-switcher">locale</div>,
}));

function renderMenu(showLocaleSwitcher = false) {
  return render(
    <MemoryRouter>
      <UserAccountMenu showLocaleSwitcher={showLocaleSwitcher} />
    </MemoryRouter>
  );
}

describe('UserAccountMenu', () => {
  beforeEach(() => {
    void i18n.changeLanguage('en');
  });

  afterEach(() => {
    cleanup();
    document.body.innerHTML = '';
  });

  it('renders the open menu panel in a portal on document.body', () => {
    renderMenu();
    fireEvent.click(screen.getByRole('button', { name: /user menu/i }));
    const panel = document.body.querySelector('.user-account-menu-panel--portal');
    expect(panel).not.toBeNull();
    expect(panel?.parentElement).toBe(document.body);
  });

  it('keeps the menu open when clicking inside the portaled panel', () => {
    renderMenu();
    fireEvent.click(screen.getByRole('button', { name: /user menu/i }));
    const panel = document.body.querySelector('.user-account-menu-panel--portal');
    expect(panel).not.toBeNull();
    fireEvent.mouseDown(panel!);
    expect(document.body.querySelector('.user-account-menu-panel--portal')).not.toBeNull();
  });

  it('closes the menu on an outside click', () => {
    renderMenu();
    fireEvent.click(screen.getByRole('button', { name: /user menu/i }));
    expect(document.body.querySelector('.user-account-menu-panel--portal')).not.toBeNull();
    fireEvent.mouseDown(document.body);
    expect(document.body.querySelector('.user-account-menu-panel--portal')).toBeNull();
  });

  it('closes on Escape and returns focus to the trigger', () => {
    renderMenu();
    const trigger = screen.getByRole('button', { name: /user menu/i });
    fireEvent.click(trigger);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(document.body.querySelector('.user-account-menu-panel--portal')).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });
});
