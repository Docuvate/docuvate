import { Link, useLocation } from 'react-router-dom';
import { useLocale } from '../context/LocaleContext';

const DOC_LINKS = [
  { path: '/docs', key: 'docs' as const },
  { path: '/docs/api', key: 'api' as const },
  { path: '/docs/sdks', key: 'sdks' as const },
];

export function DocsSidebar() {
  const { content, localizePath } = useLocale();
  const location = useLocation();

  return (
    <nav className="docs-sidebar" aria-label="Documentation">
      {DOC_LINKS.map((item) => {
        const to = localizePath(item.path);
        const active = location.pathname === to;
        return (
          <Link key={item.path} to={to} aria-current={active ? 'page' : undefined}>
            {content.nav[item.key]}
          </Link>
        );
      })}
    </nav>
  );
}
