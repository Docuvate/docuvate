// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { errorCodeI18nKey,isErrorCode } from '@docuvate/contracts';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router-dom';

import { Card } from '../components/ui/Card';
import { routes } from '../lib/routes';

export function ErrorCodeDocPage() {
  const { t } = useTranslation();
  const params = useParams();
  const rawCode = params.code?.trim() ?? '';
  const code = isErrorCode(rawCode) ? rawCode : null;

  if (!code) {
    if (!rawCode) {
      return (
        <div className="page">
          <Card>
            <h1>{t('errors.docs.indexTitle')}</h1>
            <p className="muted">{t('errors.docs.indexLead')}</p>
            <Link className="btn btn-secondary" to={routes.documents}>
              {t('errors.pages.home')}
            </Link>
          </Card>
        </div>
      );
    }
    return (
      <div className="page">
        <Card>
          <h1>{t('errors.docs.unknownTitle')}</h1>
          <p className="muted">{t('errors.docs.unknownLead')}</p>
          <Link className="btn btn-secondary" to={routes.errorCodesIndex}>
            {t('errors.docs.back')}
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="page">
      <Card>
        <h1>{code}</h1>
        <p>{t(errorCodeI18nKey(code))}</p>
        <p className="muted">{t('errors.docs.supportHint')}</p>
        <Link className="btn btn-secondary" to={routes.documents}>
          {t('errors.pages.home')}
        </Link>
      </Card>
    </div>
  );
}
