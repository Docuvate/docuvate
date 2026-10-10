// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Menu } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { writeAdvancedFeaturesEnabled } from '../lib/advancedFeatures';
import { getUserSettings } from '../lib/api';
import { authClient, authSessionUserId } from '../lib/auth-client';
import { markAuthenticatedSessionHint } from '../lib/authSessionHint';
import { applyUserSettingsUiPreferences } from '../lib/syncUserUiPreferences';
import { useNarrowTopbar } from '../lib/useNarrowTopbar';
import { AppSidebar } from './layout/AppSidebar';
import { LocaleSwitcher } from './layout/LocaleSwitcher';
import { UserAccountMenu } from './layout/UserAccountMenu';
import { SaveBarLayoutSync } from './save/SaveBarLayoutSync';
import { ToastGlobalBridge, ToastProvider } from './save/ToastProvider';
import { GlobalSearch } from './search/GlobalSearch';

export function AppShell({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const narrowTopbar = useNarrowTopbar();
  const { data: session } = authClient.useSession();

  useEffect(() => {
    if (session?.session) {
      markAuthenticatedSessionHint();
    }
  }, [session?.session]);

  useEffect(() => {
    const userId = authSessionUserId(session);
    if (!userId) {
      return;
    }
    void getUserSettings()
      .then((settings) => {
        writeAdvancedFeaturesEnabled(settings.advancedFeaturesEnabled === true);
        applyUserSettingsUiPreferences(settings);
      })
      .catch(() => {
        /* keep local cache */
      });
  }, [session]);

  useEffect(() => {
    if (!narrowTopbar) {
      setMobileNavOpen(false);
    }
  }, [narrowTopbar]);

  useEffect(() => {
    if (!mobileNavOpen) {
      return;
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setMobileNavOpen(false);
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => { document.removeEventListener('keydown', onKeyDown); };
  }, [mobileNavOpen]);

  return (
    <ToastProvider>
      <ToastGlobalBridge />
      <SaveBarLayoutSync />
      <div className={`app-shell${mobileNavOpen ? ' app-shell-mobile-nav-open' : ''}`}>
        <header className="app-topbar">
          <div className="topbar-brand">
            {narrowTopbar ? (
              <button
                type="button"
                className="topbar-icon-btn topbar-menu-trigger"
                aria-expanded={mobileNavOpen}
                aria-label={t('nav.main')}
                onClick={() => { setMobileNavOpen((open) => !open); }}
              >
                <Menu size={20} strokeWidth={2} aria-hidden />
              </button>
            ) : null}
            <strong>Docuvate</strong>
          </div>
          {narrowTopbar ? (
            <div className="topbar-search-slot">
              <GlobalSearch narrowTopbar />
            </div>
          ) : (
            <div className="topbar-search topbar-search--desktop global-search-desktop-host">
              <GlobalSearch narrowTopbar={false} />
            </div>
          )}
          <div className="topbar-user">
            {!narrowTopbar ? <LocaleSwitcher placement="topbar" /> : null}
            <UserAccountMenu showLocaleSwitcher={narrowTopbar} />
          </div>
        </header>
        {mobileNavOpen ? (
          <button
            type="button"
            className="app-sidebar-backdrop"
            aria-label={t('common.close')}
            onClick={() => { setMobileNavOpen(false); }}
          />
        ) : null}
        <div className="app-body">
          <AppSidebar
            mobileDrawerOpen={narrowTopbar && mobileNavOpen}
            onCloseMobileDrawer={() => { setMobileNavOpen(false); }}
          />
          <main className="app-main">{children}</main>
        </div>
      </div>
    </ToastProvider>
  );
}
