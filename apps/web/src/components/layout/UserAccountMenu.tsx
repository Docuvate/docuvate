import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { ThemePreference } from '@docuvate/contracts';
import { authClient } from '../../lib/auth-client';
import { performSignOut } from '../../lib/authSignOut';
import { persistUserUiPreference } from '../../lib/persistUserUiPreference';
import { routes } from '../../lib/routes';
import { userInitials } from './userInitials';
import { useDocuvateTheme } from '../../lib/useDocuvateTheme';
import { ThemePreferencePicker } from './ThemePreferencePicker';
import { LocaleSwitcher } from './LocaleSwitcher';

export function UserAccountMenu({ showLocaleSwitcher = false }: { showLocaleSwitcher?: boolean }) {
  const { t } = useTranslation();
  const { data } = authClient.useSession();
  const user = data?.user;
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const firstItemRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const { themePreference, setThemePreference } = useDocuvateTheme();

  const close = useCallback(() => {
    setOpen(false);
    triggerRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }
    firstItemRef.current?.focus();
    function onPointerDown(event: MouseEvent) {
      const root = rootRef.current;
      if (root && !root.contains(event.target as Node)) {
        setOpen(false);
      }
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

  const displayName = user?.name?.trim();
  const email = user?.email?.trim();
  const initials = userInitials(user);

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
        onClick={() => setOpen((prev) => !prev)}
      >
        <span className="user-account-menu-avatar" aria-hidden="true">
          {initials}
        </span>
      </button>
      {open ? (
        <div id={menuId} className="user-account-menu-panel" role="menu">
          <div className="user-account-menu-identity" role="presentation">
            {displayName ? (
              <span className="user-account-menu-name">{displayName}</span>
            ) : null}
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
            onClick={() => setOpen(false)}
          >
            {t('shell.account')}
          </Link>
          <button
            type="button"
            role="menuitem"
            className="user-account-menu-item"
            onClick={signOut}
          >
            {t('shell.signOut')}
          </button>
        </div>
      ) : null}
    </div>
  );
}
