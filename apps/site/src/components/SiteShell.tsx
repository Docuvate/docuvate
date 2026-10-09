import { Link, useLocation } from 'react-router-dom';
import { Moon, Sun } from 'lucide-react';
import { useEffect, type ReactNode } from 'react';
import { observeSiteHeaderHeight } from '../lib/siteHeaderHeight';
import { useLocale } from '../context/LocaleContext';
import { withLocale, type SiteLocale } from '../lib/routes';
import { useDocuvateTheme } from '../lib/useDocuvateTheme';
import { MobileNav } from './MobileNav';
import { SiteLogo } from './SiteLogo';

const GITHUB_URL = 'https://github.com/Docuvate/docuvate';
const LICENSE_URL = `${GITHUB_URL}/blob/main/LICENSE`;

function LocaleSwitcher({ locale, onDarkHero }: { locale: SiteLocale; onDarkHero: boolean }) {
  const location = useLocation();
  const pathWithoutLocale =
    locale === 'en' ? location.pathname.replace(/^\/en/, '') || '/' : location.pathname;
  const targetLocale: SiteLocale = locale === 'de' ? 'en' : 'de';
  const href = withLocale(targetLocale, pathWithoutLocale);
  return (
    <Link
      className={`btn btn-ghost locale-switch${onDarkHero ? ' locale-switch-on-hero' : ''}`}
      to={href}
      hrefLang={targetLocale === 'en' ? 'en' : 'de'}
    >
      {targetLocale === 'en' ? 'EN' : 'DE'}
    </Link>
  );
}

function FooterLocaleLinks({ locale }: { locale: SiteLocale }) {
  const location = useLocation();
  const pathWithoutLocale =
    locale === 'en' ? location.pathname.replace(/^\/en/, '') || '/' : location.pathname;
  const label = locale === 'de' ? 'Sprachauswahl' : 'Language';
  return (
    <nav className="footer-locale-links" aria-label={label}>
      <Link
        to={withLocale('de', pathWithoutLocale)}
        hrefLang="de"
        aria-current={locale === 'de' ? 'page' : undefined}
      >
        Deutsch
      </Link>
      <span className="footer-locale-sep" aria-hidden>
        /
      </span>
      <Link
        to={withLocale('en', pathWithoutLocale)}
        hrefLang="en"
        aria-current={locale === 'en' ? 'page' : undefined}
      >
        English
      </Link>
    </nav>
  );
}

function ThemeToggle({ onDarkHero }: { onDarkHero: boolean }) {
  const { theme, setTheme } = useDocuvateTheme();
  const { locale } = useLocale();
  const label = locale === 'de' ? 'Farbschema umschalten' : 'Toggle color theme';

  function toggle() {
    setTheme(theme === 'light' ? 'dark' : 'light');
  }

  return (
    <button
      type="button"
      className={`icon-btn icon-btn-touch theme-toggle${onDarkHero ? ' icon-btn-on-hero' : ''}`}
      onClick={toggle}
      aria-label={label}
    >
      {theme === 'light' ? <Moon size={20} aria-hidden /> : <Sun size={20} aria-hidden />}
    </button>
  );
}

export function SiteShell({ children }: { children: ReactNode }) {
  useEffect(() => observeSiteHeaderHeight(), []);

  const { locale, content, localizePath } = useLocale();
  const location = useLocation();
  const path = location.pathname.replace(/^\/en/, '') || '/';
  const onLanding = path === '/';
  const onLegal = path === '/impressum' || path === '/datenschutz';

  const navLink = (to: string, label: string) => {
    const localized = localizePath(to);
    const active = path === to || path.startsWith(`${to}/`);
    return (
      <Link to={localized} aria-current={active ? 'page' : undefined}>
        {label}
      </Link>
    );
  };

  const quickstartPath = localizePath('/docs#quickstart');
  const headerCtaLabel = content.landing.hero.primaryCta;
  const headerCta = (
    <Link
      className={`btn btn-primary header-cta${onLanding ? ' landing-btn-primary' : ''}`}
      to={quickstartPath}
    >
      {headerCtaLabel}
    </Link>
  );

  return (
    <div className="site-chrome">
      <header className={`site-header${onLanding ? ' site-header-on-hero' : ''}`}>
        <div className="site-container site-header-inner">
          <Link className="site-brand" to={localizePath('/')}>
            <SiteLogo />
          </Link>
          <nav className="site-nav" aria-label="Primary">
            {navLink('/docs', content.nav.docs)}
            {navLink('/docs/api', content.nav.api)}
            {navLink('/docs/sdks', content.nav.sdks)}
            <a href={GITHUB_URL} target="_blank" rel="noreferrer">
              {content.nav.github}
            </a>
          </nav>
          <div className="site-header-actions">
            <ThemeToggle onDarkHero={onLanding} />
            <LocaleSwitcher locale={locale} onDarkHero={onLanding} />
            {headerCta}
            <MobileNav
              onLanding={onLanding}
              ctaTo={quickstartPath}
              ctaLabel={headerCtaLabel}
              ctaLandingPrimary={onLanding}
            />
          </div>
        </div>
      </header>
      <main
        className={`site-main${onLanding ? ' site-main-landing' : ''}${onLegal ? ' site-main-legal' : ''}`}
      >
        {children}
      </main>
      <footer
        className={`site-footer${onLanding ? ' site-footer-landing' : ''}${onLegal ? ' site-footer-legal' : ''}`}
      >
        <div className="site-container site-footer-grid site-footer-grid-rich">
          <div className="site-footer-brand">
            <Link className="site-brand site-footer-logo" to={localizePath('/')}>
              <SiteLogo />
            </Link>
            <p>{content.footer.tagline}</p>
          </div>
          <div>
            <strong className="site-footer-heading">{content.footer.product}</strong>
            <div className="site-footer-links site-footer-links-col">
              <Link to={localizePath('/')}>{locale === 'de' ? 'Startseite' : 'Home'}</Link>
              <Link to={localizePath('/docs')}>{content.nav.docs}</Link>
              <Link to={quickstartPath}>{content.landing.hero.primaryCta}</Link>
            </div>
          </div>
          <div>
            <strong className="site-footer-heading">{content.footer.developers}</strong>
            <div className="site-footer-links site-footer-links-col">
              <Link to={localizePath('/docs/api')}>{content.nav.api}</Link>
              <Link to={localizePath('/docs/sdks')}>{content.nav.sdks}</Link>
            </div>
          </div>
          <div>
            <strong className="site-footer-heading">{content.footer.project}</strong>
            <div className="site-footer-links site-footer-links-col">
              <a href={GITHUB_URL} target="_blank" rel="noreferrer">
                {content.footer.github}
              </a>
              <a href={LICENSE_URL} target="_blank" rel="noreferrer">
                {content.footer.license}
              </a>
              <Link to={localizePath('/impressum')}>{content.footer.imprint}</Link>
              <Link to={localizePath('/datenschutz')}>{content.footer.privacy}</Link>
            </div>
          </div>
          <div>
            <strong className="site-footer-heading">{content.footer.language}</strong>
            <FooterLocaleLinks locale={locale} />
          </div>
        </div>
      </footer>
    </div>
  );
}
