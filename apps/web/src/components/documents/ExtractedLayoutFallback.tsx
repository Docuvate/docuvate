// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { useTranslation } from 'react-i18next';
import { Button } from '../ui/Button';

interface ExtractedLayoutFallbackProps {
  requeueBusy?: boolean;
  onRequeue?: () => void;
  variant?: 'missing' | 'htmlFailed';
}

export function ExtractedLayoutFallback({
  requeueBusy = false,
  onRequeue,
  variant = 'missing',
}: ExtractedLayoutFallbackProps) {
  const { t } = useTranslation();
  const titleKey =
    variant === 'htmlFailed'
      ? 'documents.layoutIrHtmlFailedTitle'
      : 'documents.layoutIrUnavailableTitle';
  const bodyKey =
    variant === 'htmlFailed'
      ? 'documents.layoutIrHtmlFailedBody'
      : 'documents.layoutIrUnavailableBody';
  return (
    <div className="layout-ir-fallback">
      <p className="layout-ir-fallback-title">{t(titleKey)}</p>
      <p className="muted layout-ir-fallback-body">{t(bodyKey)}</p>
      {onRequeue ? (
        <Button type="button" variant="primary" disabled={requeueBusy} onClick={onRequeue}>
          {requeueBusy ? t('documents.reprocessPending') : t('documents.reprocess')}
        </Button>
      ) : null}
    </div>
  );
}
