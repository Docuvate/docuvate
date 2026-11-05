// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { useTranslation } from 'react-i18next';

import { Button } from '../ui/Button';

interface LayoutMissingBadgeProps {
  requeueBusy?: boolean;
  onRequeue?: () => void;
  compact?: boolean;
}

export function LayoutMissingBadge({
  requeueBusy = false,
  onRequeue,
  compact = false,
}: LayoutMissingBadgeProps) {
  const { t } = useTranslation();
  return (
    <span className={`layout-missing-badge${compact ? ' layout-missing-badge--compact' : ''}`}>
      <span className="layout-missing-badge-label" title={t('library.layoutMissingTitle')}>
        {t('library.layoutMissingBadge')}
      </span>
      {onRequeue ? (
        <Button
          type="button"
          variant="secondary"
          className="layout-missing-reprocess-btn"
          disabled={requeueBusy}
          aria-label={t('documents.reprocess')}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onRequeue();
          }}
        >
          {requeueBusy ? t('documents.reprocessPending') : t('documents.reprocess')}
        </Button>
      ) : null}
    </span>
  );
}
