import { Link, useLocation } from 'react-router-dom';
import { getDocsExtended } from '../content/docsExtended';
import { useLocale } from '../context/LocaleContext';

function isActive(pathname: string, itemPath: string): boolean {
  if (itemPath.includes('#')) {
    const base = itemPath.split('#')[0];
    return pathname === base || pathname === `${base}/`;
  }
  if (itemPath === '/docs') {
    return pathname === '/docs' || pathname === '/docs/';
  }
  return pathname === itemPath || pathname.startsWith(`${itemPath}/`);
}

export function DocsSidebar() {
  const { localizePath, locale } = useLocale();
  const location = useLocation();
  const pathname = location.pathname.replace(/\/$/, '') || '/';
  const groups = getDocsExtended(locale).nav;

  return (
    <nav className="docs-sidebar" aria-label="Documentation">
      {groups.map((group) => (
        <div key={group.title} className="docs-sidebar-group">
          <p className="docs-sidebar-group-title">{group.title}</p>
          <div className="docs-sidebar-links">
            {group.items.map((item) => {
              const to = localizePath(item.path);
              const targetPath = localizePath(item.path.split('#')[0] ?? item.path);
              const active = isActive(pathname, targetPath.replace(/\/$/, '') || '/');
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
