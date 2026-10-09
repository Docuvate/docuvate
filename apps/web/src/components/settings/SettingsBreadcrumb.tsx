import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

type Crumb = {
  label: string;
  to?: string;
};

export function SettingsBreadcrumb({ items }: { items: Crumb[] }) {
  const { t } = useTranslation();
  return (
    <nav className="settings-breadcrumb" aria-label={t('settings.breadcrumbAria')}>
      <ol>
        {items.map((item) => {
          const key = item.to ? `${item.to}:${item.label}` : item.label;
          return (
            <li key={key}>
              {item.to ? <Link to={item.to}>{item.label}</Link> : <span>{item.label}</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
