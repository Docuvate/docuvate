import { Link, useLocation } from 'react-router-dom';
import { getDocsExtended } from '../content/docsExtended';
import { useLocale } from '../context/LocaleContext';

function isActive(pathname: string, hash: string, itemPath: string): boolean {
  const normalizedPath = pathname.replace(/\/$/, '') || '/';
  const normalizedHash = hash || '';

  if (itemPath.includes('#')) {
    const [base, fragment] = itemPath.split('#');
    const normalizedBase = (base ?? '').replace(/\/$/, '') || '/';
    if (normalizedPath !== normalizedBase) return false;
    return normalizedHash === `#${fragment ?? ''}`;
  }

  if (itemPath === '/docs') {
    return normalizedPath === '/docs' && !normalizedHash;
  }

  const normalizedItem = itemPath.replace(/\/$/, '') || '/';
  if (normalizedPath === normalizedItem) return !normalizedHash;
  return normalizedPath.startsWith(`${normalizedItem}/`);
}

export function DocsSidebar() {
  const { localizePath, locale } = useLocale();
  const location = useLocation();
  const pathname = location.pathname.replace(/\/$/, '') || '/';
  const hash = location.hash;
  const groups = getDocsExtended(locale).nav;

  return (
    <nav className="docs-sidebar" aria-label="Documentation">
      {groups.map((group) => (
        <div key={group.title} className="docs-sidebar-group">
          <p className="docs-sidebar-group-title">{group.title}</p>
          <div className="docs-sidebar-links">
            {group.items.map((item) => {
              const to = localizePath(item.path);
              const matchPath = localizePath(item.path);
              const active = isActive(pathname, hash, matchPath);
              return (
                <Link key={item.path} to={to} aria-current={active ? 'page' : undefined}>
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}
