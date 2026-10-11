// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { routes } from '../../lib/routes';
import { Card } from '../ui/Card';

export function DocumentDetailNotFound({ message }: { message?: string }) {
  const { t } = useTranslation();

  return (
    <div className="page document-detail-page document-detail-not-found" data-ux="page">
      <p className="document-detail-back">
        <Link to={routes.documents} className="document-detail-back-link">
          <ArrowLeft size={16} strokeWidth={2} aria-hidden />
          {t('documents.breadcrumbDocuments')}
        </Link>
      </p>
      <Card className="document-detail-not-found-card">
        <h1 data-ux="page-title">{t('documents.notFoundTitle')}</h1>
        <p className="muted">{message ?? t('documents.notFound')}</p>
        <div className="document-detail-not-found-actions">
          <Link to={routes.documents} className="btn btn-primary">
            {t('documents.notFoundBack')}
          </Link>
        </div>
      </Card>
    </div>
  );
}
