import { Link, useLocation } from 'react-router-dom';
import { getDocsExtended } from '../content/docsExtended';
import { useLocale } from '../context/LocaleContext';
import { useMemo } from 'react';

function sidebarHashFragments(
  groups: ReturnType<typeof getDocsExtended>['nav'],
): Set<string> {
  const fragments = new Set<string>();
  for (const group of groups) {
    for (const item of group.items) {
      if (!item.path.includes('#')) continue;
      const fragment = item.path.split('#')[1];
      if (fragment) fragments.add(fragment);
    }
  }
  return fragments;
}

function isActive(
  pathname: string,
  hash: string,
  itemPath: string,
  sidebarHashFragments: Set<string>,
): boolean {
  const normalizedPath = pathname.replace(/\/$/, '') || '/';
  const normalizedHash = hash || '';

  if (itemPath.includes('#')) {
    const [base, fragment] = itemPath.split('#');
    const normalizedBase = (base ?? '').replace(/\/$/, '') || '/';
    if (normalizedPath !== normalizedBase) return false;
    return normalizedHash === `#${fragment ?? ''}`;
  }

  const normalizedItem = itemPath.replace(/\/$/, '') || '/';
  if (normalizedItem === '/docs') {
    if (normalizedPath !== '/docs') return false;
    if (normalizedHash) {
      const frag = normalizedHash.slice(1);
      if (sidebarHashFragments.has(frag)) return false;
    }
    return true;
  }

  if (normalizedPath === normalizedItem) return !normalizedHash;
  return normalizedPath.startsWith(`${normalizedItem}/`);
}

export function DocsSidebar() {
  const { localizePath, locale } = useLocale();
  const location = useLocation();
  const pathname = location.pathname.replace(/\/$/, '') || '/';
  const hash = location.hash;
  const groups = getDocsExtended(locale).nav;
  const hashFragments = useMemo(() => sidebarHashFragments(groups), [groups]);

  return (
    <nav className="docs-sidebar" aria-label="Documentation">
      {groups.map((group) => (
        <div key={group.title} className="docs-sidebar-group">
          <p className="docs-sidebar-group-title">{group.title}</p>
          <div className="docs-sidebar-links">
            {group.items.map((item) => {
              const to = localizePath(item.path);
              const matchPath = localizePath(item.path);
              const active = isActive(pathname, hash, matchPath, hashFragments);
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
