// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { ChevronDown } from 'lucide-react';
import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';

export interface CollapsibleTechnicalDetailsProps {
  errorType: string;
  statusCode?: number;
  occurredAt: Date;
  className?: string;
}

export function CollapsibleTechnicalDetails({
  errorType,
  statusCode,
  occurredAt,
  className = '',
}: CollapsibleTechnicalDetailsProps) {
  const { t, i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const panelId = useId();

  const formattedTime = new Intl.DateTimeFormat(i18n.language, {
    dateStyle: 'medium',
    timeStyle: 'medium',
  }).format(occurredAt);

  return (
    <div className={`ds-error-technical-details${className ? ` ${className}` : ''}`.trim()}>
      <button
        type="button"
        className="ds-error-technical-details-toggle"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => {
          setOpen((value) => !value);
        }}
      >
        <ChevronDown
          size={16}
          strokeWidth={2}
          aria-hidden
          className={open ? 'ds-error-technical-details-chevron-open' : undefined}
        />
        {t('errors.pages.technicalDetails.toggle')}
      </button>
      {open ? (
        <dl id={panelId} className="ds-error-technical-details-panel">
          <div>
            <dt>{t('errors.pages.technicalDetails.errorType')}</dt>
            <dd>{errorType}</dd>
          </div>
          <div>
            <dt>{t('errors.pages.technicalDetails.statusCode')}</dt>
            <dd>{statusCode != null ? String(statusCode) : t('errors.pages.technicalDetails.none')}</dd>
          </div>
          <div>
            <dt>{t('errors.pages.technicalDetails.timestamp')}</dt>
            <dd>
              <time dateTime={occurredAt.toISOString()}>{formattedTime}</time>
            </dd>
          </div>
        </dl>
      ) : null}
    </div>
  );
}
