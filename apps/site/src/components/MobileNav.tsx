import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useLocale } from '../context/LocaleContext';

const GITHUB_URL = 'https://github.com/Docuvate/docuvate';

export function MobileNav({ onLanding = false }: { onLanding?: boolean }) {
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const { content, localizePath, locale } = useLocale();
  const menuLabel = locale === 'de' ? 'Menü' : 'Menu';

  const links = [
    { to: '/docs', label: content.nav.docs },
    { to: '/docs/api', label: content.nav.api },
    { to: '/docs/sdks', label: content.nav.sdks },
  ];

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open) {
      if (!dialog.open) dialog.showModal();
    } else if (dialog.open) {
      dialog.close();
    }
  }, [open]);

  return (
    <div className="mobile-nav">
      <button
        type="button"
        className={`icon-btn mobile-nav-toggle${onLanding ? ' icon-btn-on-hero' : ''}`}
        aria-expanded={open}
        aria-controls="mobile-nav-panel"
        aria-label={menuLabel}
        onClick={() => setOpen((v) => !v)}
      >
        {open ? <X size={18} aria-hidden /> : <Menu size={18} aria-hidden />}
      </button>
      <dialog
        id="mobile-nav-panel"
        ref={dialogRef}
        className={`mobile-nav-panel${onLanding ? ' mobile-nav-panel-on-hero' : ''}`}
        aria-label={menuLabel}
        onClose={() => setOpen(false)}
      >
        {links.map((link) => (
          <Link key={link.to} to={localizePath(link.to)} onClick={() => setOpen(false)}>
            {link.label}
          </Link>
        ))}
        <a href={GITHUB_URL} target="_blank" rel="noreferrer">
          {content.nav.github}
        </a>
      </dialog>
    </div>
  );
}
