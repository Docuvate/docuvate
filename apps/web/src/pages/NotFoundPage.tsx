import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { routes } from '../lib/routes';
import { Card } from '../components/ui/Card';

export function NotFoundPage() {
  const { t } = useTranslation();

  return (
    <div className="not-found-page">
      <Card className="not-found-card">
        <h1>{t('notFoundPage.title')}</h1>
        <p className="muted">{t('notFoundPage.lead')}</p>
        <Link className="btn btn-primary" to={routes.documents}>
          {t('notFoundPage.documentsLink')}
        </Link>
      </Card>
    </div>
  );
}
