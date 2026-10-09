import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useLocale } from '../context/LocaleContext';
import { resolvePrimaryNavKey, type PrimaryNavKey } from '../lib/sitePrimaryNav';

const GITHUB_URL = 'https://github.com/Docuvate/docuvate';

type MobileNavProps = {
  onLanding?: boolean;
  ctaTo: string;
  ctaLabel: string;
  ctaLandingPrimary?: boolean;
};

export function MobileNav({ onLanding = false, ctaTo, ctaLabel, ctaLandingPrimary = false }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const sheetRef = useRef<HTMLElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  const { content, localizePath, locale } = useLocale();
  const location = useLocation();
  const menuLabel = locale === 'de' ? 'Menü' : 'Menu';
  const closeLabel = locale === 'de' ? 'Menü schließen' : 'Close menu';

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  const comparePath = locale === 'de' ? '/docs/vergleiche/methodik' : '/docs/comparisons/methodology';
  const path = location.pathname.replace(/^\/en/, '') || '/';
  const activeNavKey = resolvePrimaryNavKey(path);
  const links: { key: PrimaryNavKey | null; to: string; label: string }[] = [
    { key: 'docs', to: '/docs', label: content.nav.docs },
    { key: 'comparisons', to: comparePath, label: content.nav.comparisons },
    { key: null, to: '/#editions-heading', label: content.nav.editions },
    { key: 'api', to: '/docs/api', label: content.nav.api },
    { key: 'sdks', to: '/docs/sdks', label: content.nav.sdks },
  ];

  useEffect(() => {
    if (!open) {
      document.body.classList.remove('mobile-nav-open');
      return undefined;
    }

    document.body.classList.add('mobile-nav-open');
    restoreFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const focusTarget =
      sheetRef.current?.querySelector<HTMLElement>('a, button:not(.mobile-nav-backdrop)') ?? sheetRef.current;
    focusTarget?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setOpen(false);
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.classList.remove('mobile-nav-open');
      if (restoreFocusRef.current && document.contains(restoreFocusRef.current)) {
        restoreFocusRef.current.focus();
      } else {
        toggleRef.current?.focus();
      }
    };
  }, [open]);

  const overlay =
    open && typeof document !== 'undefined'
      ? createPortal(
          <div className="mobile-nav-root" role="presentation">
            <button
              type="button"
              className="mobile-nav-backdrop"
              aria-label={closeLabel}
              tabIndex={-1}
              onClick={() => setOpen(false)}
            />
            <nav
              id="mobile-nav-panel"
              ref={sheetRef}
              className={`mobile-nav-sheet${onLanding ? ' mobile-nav-sheet-on-hero' : ''}`}
              role="dialog"
              aria-modal="true"
              aria-label={menuLabel}
            >
              <div className="mobile-nav-sheet-links">
                {links.map((link) => (
                  <Link
                    key={link.to}
                    to={localizePath(link.to)}
                    aria-current={link.key !== null && activeNavKey === link.key ? 'page' : undefined}
                    onClick={() => setOpen(false)}
                  >
                    {link.label}
                  </Link>
                ))}
                <a href={GITHUB_URL} target="_blank" rel="noreferrer" onClick={() => setOpen(false)}>
                  {content.nav.github}
                </a>
              </div>
              <Link
                className={`btn btn-primary mobile-nav-cta${ctaLandingPrimary ? ' landing-btn-primary' : ''}`}
                to={ctaTo}
                onClick={() => setOpen(false)}
              >
                {ctaLabel}
              </Link>
            </nav>
          </div>,
          document.body,
        )
      : null;

  return (
    <div className="mobile-nav">
      <button
        ref={toggleRef}
        type="button"
        className={`icon-btn mobile-nav-toggle icon-btn-touch${onLanding ? ' icon-btn-on-hero' : ''}${
          open ? ' mobile-nav-toggle-open' : ''
        }`}
        aria-expanded={open}
        aria-controls="mobile-nav-panel"
        aria-label={open ? closeLabel : menuLabel}
        onClick={() => setOpen((value) => !value)}
      >
        {open ? <X size={20} aria-hidden /> : <Menu size={20} aria-hidden />}
      </button>
      {overlay}
    </div>
  );
}
