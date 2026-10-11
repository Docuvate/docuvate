// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { ThemePreference } from '@docuvate/contracts';
import {
  type ReactNode,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { authClient } from '../../lib/auth-client';
import { performSignOut } from '../../lib/authSignOut';
import { persistUserUiPreference } from '../../lib/persistUserUiPreference';
import { routes } from '../../lib/routes';
import { trimOptionalString } from '../../lib/trimOptionalString';
import { useDocuvateTheme } from '../../lib/useDocuvateTheme';
import { LocaleSwitcher } from './LocaleSwitcher';
import { ThemePreferencePicker } from './ThemePreferencePicker';
import { userInitials } from './userInitials';

function positionAccountMenuPanel(
  trigger: HTMLElement,
  panel: HTMLElement,
  pad = 8,
  gap = 4
): void {
  panel.style.visibility = 'hidden';
  panel.style.left = '0px';
  panel.style.top = '0px';

  const menuWidth = panel.offsetWidth;
  const menuHeight = panel.offsetHeight;
  const anchorRect = trigger.getBoundingClientRect();

  let left = anchorRect.right - menuWidth;
  let top = anchorRect.bottom + gap;

  if (top + menuHeight > window.innerHeight - pad) {
    const above = anchorRect.top - menuHeight - gap;
    if (above >= pad) {
      top = above;
    }
  }
  if (left + menuWidth > window.innerWidth - pad) {
    left = window.innerWidth - pad - menuWidth;
  }
  if (left < pad) {
    left = pad;
  }
  if (top + menuHeight > window.innerHeight - pad) {
    top = Math.max(pad, window.innerHeight - menuHeight - pad);
  }
  if (top < pad) {
    top = pad;
  }

  panel.style.left = `${String(left)}px`;
  panel.style.top = `${String(top)}px`;
  panel.style.visibility = '';
}

export function UserAccountMenu({ showLocaleSwitcher = false }: { showLocaleSwitcher?: boolean }) {
  const { t } = useTranslation();
  const { data } = authClient.useSession();
  const user = data?.user;
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const firstItemRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const { themePreference, setThemePreference } = useDocuvateTheme();

  const close = useCallback(() => {
    setOpen(false);
    triggerRef.current?.focus();
  }, []);

  const displayName = trimOptionalString(user?.name);
  const email = trimOptionalString(user?.email);
  const initials = userInitials(user);

  useLayoutEffect(() => {
    if (!open) {
      return;
    }
    const trigger = triggerRef.current;
    const panel = panelRef.current;
    if (!trigger || !panel) {
      return;
    }
    const reposition = () => {
      positionAccountMenuPanel(trigger, panel);
    };
    reposition();
    window.addEventListener('resize', reposition);
    window.addEventListener('scroll', reposition, true);
    return () => {
      window.removeEventListener('resize', reposition);
      window.removeEventListener('scroll', reposition, true);
    };
  }, [open, showLocaleSwitcher, displayName, email, saveError, themePreference]);

  useEffect(() => {
    if (!open) {
      return;
    }
    firstItemRef.current?.focus();
    function onPointerDown(event: MouseEvent) {
      const target = event.target;
      if (!(target instanceof Node)) {
        return;
      }
      const root = rootRef.current;
      const panel = panelRef.current;
      if (root?.contains(target) || panel?.contains(target)) {
        return;
      }
      setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault();
        close();
      }
    }
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open, close]);

  async function onThemePreferenceChange(next: ThemePreference) {
    if (next === themePreference) {
      return;
    }
    setSaveError(null);
    const previous = themePreference;
    if (!user?.id) {
      setThemePreference(next);
      return;
    }
    const result = await persistUserUiPreference({
      kind: 'theme',
      next,
      previous,
    });
    if (!result.ok) {
      setSaveError(result.message);
    }
  }

  function signOut() {
    close();
    void performSignOut();
  }

  const menuPanel: ReactNode = open ? (
    <div
      ref={panelRef}
      id={menuId}
      className="user-account-menu-panel user-account-menu-panel--portal"
      role="menu"
    >
      <div className="user-account-menu-identity" role="presentation">
        {displayName ? <span className="user-account-menu-name">{displayName}</span> : null}
        {email ? <span className="user-account-menu-email">{email}</span> : null}
      </div>
      <hr className="user-account-menu-divider" />
      {showLocaleSwitcher ? (
        <>
          <div role="presentation" className="user-account-menu-locale-section">
            <LocaleSwitcher placement="menu" />
          </div>
          <hr className="user-account-menu-divider" />
        </>
      ) : null}
      <div role="presentation" className="user-account-menu-theme-section">
        <ThemePreferencePicker
          value={themePreference}
          onChange={(next) => void onThemePreferenceChange(next)}
          firstOptionRef={firstItemRef}
        />
        {saveError ? (
          <p className="user-account-menu-error" role="alert">
            {saveError}
          </p>
        ) : null}
      </div>
      <hr className="user-account-menu-divider" />
      <Link
        to={routes.settings}
        role="menuitem"
        className="user-account-menu-item"
        onClick={() => { setOpen(false); }}
      >
        {t('shell.account')}
      </Link>
      <button type="button" role="menuitem" className="user-account-menu-item" onClick={signOut}>
        {t('shell.signOut')}
      </button>
    </div>
  ) : null;

  return (
    <div className="user-account-menu" ref={rootRef}>
      <button
        ref={triggerRef}
        type="button"
        className="user-account-menu-trigger"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={t('shell.userMenuLabel')}
        onClick={() => { setOpen((prev) => !prev); }}
      >
        <span className="user-account-menu-avatar" aria-hidden="true">
          {initials}
        </span>
      </button>
      {menuPanel ? createPortal(menuPanel, document.body) : null}
    </div>
  );
}
