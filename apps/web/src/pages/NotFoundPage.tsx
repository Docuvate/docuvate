// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { Card } from '../components/ui/Card';
import { routes } from '../lib/routes';

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
