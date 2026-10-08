import { FormEvent, useEffect, useState } from 'react';
import { Menu } from 'lucide-react';
import { authClient } from '../lib/auth-client';
import { markAuthenticatedSessionHint } from '../lib/authSessionHint';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { normalizeFilterQueryForSubmit } from '../lib/documentFilterQuery';
import { routes } from '../lib/routes';
import { AppSidebar } from './layout/AppSidebar';
import { LocaleSwitcher } from './layout/LocaleSwitcher';
import { UserAccountMenu } from './layout/UserAccountMenu';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { getUserSettings } from '../lib/api';
import { writeAdvancedFeaturesEnabled } from '../lib/advancedFeatures';
import { SaveBarLayoutSync } from './save/SaveBarLayoutSync';
import { ToastGlobalBridge, ToastProvider } from './save/ToastProvider';
import { applyUserSettingsUiPreferences } from '../lib/syncUserUiPreferences';
import { useNarrowTopbar } from '../lib/useNarrowTopbar';

export function AppShell({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState('');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const narrowTopbar = useNarrowTopbar();
  const { data: session } = authClient.useSession();

  useEffect(() => {
    if (session?.session) {
      markAuthenticatedSessionHint();
    }
  }, [session?.session]);

  useEffect(() => {
    const filter = searchParams.get('filter');
    if (filter?.trim()) {
      setQuery(filter);
      return;
    }
    setQuery(searchParams.get('q') ?? '');
  }, [searchParams]);

  useEffect(() => {
    const userId = session?.user?.id;
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
  }, [session?.user?.id]);

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
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [mobileNavOpen]);

  function onSearch(e: FormEvent) {
    e.preventDefault();
    const q = normalizeFilterQueryForSubmit(query.trim(), t);
    navigate(
      q ? `${routes.documents}?filter=${encodeURIComponent(q)}` : routes.documents
    );
  }

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
                onClick={() => setMobileNavOpen((open) => !open)}
              >
                <Menu size={20} strokeWidth={2} aria-hidden />
              </button>
            ) : null}
            <strong>Docuvate</strong>
          </div>
          {narrowTopbar ? (
            <div className="topbar-search-slot" aria-hidden="true" />
          ) : (
            <form className="topbar-search topbar-search--desktop" onSubmit={onSearch}>
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t('shell.searchPlaceholder')}
                aria-label={t('shell.globalSearch')}
              />
              <Button type="submit" variant="secondary">
                {t('shell.search')}
              </Button>
            </form>
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
            onClick={() => setMobileNavOpen(false)}
          />
        ) : null}
        <div className="app-body">
          <AppSidebar />
          <main className="app-main">{children}</main>
        </div>
      </div>
    </ToastProvider>
  );
}
