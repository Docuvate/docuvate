// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Menu, Settings } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, NavLink } from 'react-router-dom';

import { writeAdvancedFeaturesEnabled } from '../lib/advancedFeatures';
import { getUserSettings } from '../lib/api';
import { authClient, authSessionUserId } from '../lib/auth-client';
import { markAuthenticatedSessionHint } from '../lib/authSessionHint';
import { ensureRemoteConfigLoaded } from '../lib/remoteConfig';
import { routes } from '../lib/routes';
import { applyUserSettingsUiPreferences } from '../lib/syncUserUiPreferences';
import { useNarrowTopbar } from '../lib/useNarrowTopbar';
import { ConnectionStatusBanners } from './errors/ConnectionStatusBanners';
import { AppPrimaryNav } from './layout/AppPrimaryNav';
import { AppSectionRibbon } from './layout/AppRibbon';
import { AppRibbonSlotContext } from './layout/appRibbonContext';
import { AppSidebar } from './layout/AppSidebar';
import { UserAccountMenu } from './layout/UserAccountMenu';
import { SaveBarLayoutSync } from './save/SaveBarLayoutSync';
import { ToastGlobalBridge, ToastProvider } from './save/ToastProvider';
import { GlobalSearch } from './search/GlobalSearch';
import { Logo } from './ui/Logo';

export function AppShell({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [ribbonSlot, setRibbonSlot] = useState<HTMLDivElement | null>(null);
  const menuTriggerRef = useRef<HTMLButtonElement>(null);
  const closeMobileNav = () => {
    setMobileNavOpen(false);
    menuTriggerRef.current?.focus();
  };
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
    void ensureRemoteConfigLoaded();
  }, [session]);

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
        menuTriggerRef.current?.focus();
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [mobileNavOpen]);

  return (
    <ToastProvider>
      <ToastGlobalBridge />
      <SaveBarLayoutSync />
      <AppRibbonSlotContext.Provider value={ribbonSlot}>
        <div className={`app-shell${mobileNavOpen ? ' app-shell-mobile-nav-open' : ''}`}>
          <a className="skip-link" href="#app-main-content">
            {t('shell.skipToMain')}
          </a>
          <div className="app-header">
            <header className="app-topbar">
              <div className="topbar-brand">
                {narrowTopbar ? (
                  <button
                    ref={menuTriggerRef}
                    type="button"
                    className="topbar-icon-btn topbar-menu-trigger"
                    aria-expanded={mobileNavOpen}
                    aria-label={t('nav.main')}
                    onClick={() => {
                      setMobileNavOpen((open) => !open);
                    }}
                  >
                    <Menu size={20} strokeWidth={2} aria-hidden />
                  </button>
                ) : null}
                <Link to={routes.home} className="topbar-brand-link">
                  <Logo type="full" />
                </Link>
              </div>
              {!narrowTopbar ? <AppPrimaryNav /> : null}
              {narrowTopbar ? (
                <div className="topbar-search-slot">
                  <GlobalSearch narrowTopbar />
                </div>
              ) : (
                <div className="global-search-desktop-host">
                  <GlobalSearch narrowTopbar={false} />
                </div>
              )}
              <div className="topbar-user">
                {!narrowTopbar ? (
                  <NavLink
                    to={routes.settings}
                    className={({ isActive }) =>
                      `topbar-icon-btn topbar-settings-link${isActive ? ' active' : ''}`
                    }
                    aria-label={t('nav.settings')}
                    title={t('nav.settings')}
                  >
                    <Settings size={18} strokeWidth={1.75} aria-hidden />
                  </NavLink>
                ) : null}
                <UserAccountMenu />
              </div>
            </header>
            <div className="app-ribbon" data-testid="app-ribbon">
              <AppSectionRibbon />
              <div className="app-ribbon-actions" ref={setRibbonSlot} />
            </div>
          </div>
          {mobileNavOpen ? (
            <button
              type="button"
              className="app-sidebar-backdrop"
              aria-label={t('common.close')}
              onClick={closeMobileNav}
            />
          ) : null}
          <div className="app-body">
            {narrowTopbar ? <AppSidebar open={mobileNavOpen} onClose={closeMobileNav} /> : null}
            <main id="app-main-content" className="app-main" tabIndex={-1}>
              <ConnectionStatusBanners />
              {children}
            </main>
          </div>
        </div>
      </AppRibbonSlotContext.Provider>
    </ToastProvider>
  );
}
