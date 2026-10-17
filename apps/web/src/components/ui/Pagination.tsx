// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { IconButton } from './IconButton';

export interface PaginationProps {
  from: number;
  to: number;
  total: number;
  onPrevious?: () => void;
  onNext?: () => void;
  previousDisabled?: boolean;
  nextDisabled?: boolean;
  className?: string;
}

export function Pagination({
  from,
  to,
  total,
  onPrevious,
  onNext,
  previousDisabled,
  nextDisabled,
  className = '',
}: PaginationProps) {
  const { t } = useTranslation();
  return (
    <div className={`pagination${className ? ` ${className}` : ''}`.trim()}>
      <span>{t('ui.pagination.range', { from, to, total })}</span>
      <IconButton
        icon={ChevronLeft}
        label={t('ui.pagination.previousPage')}
        size="sm"
        disabled={previousDisabled}
        onClick={onPrevious}
      />
      <IconButton
        icon={ChevronRight}
        label={t('ui.pagination.nextPage')}
        size="sm"
        disabled={nextDisabled}
        onClick={onNext}
      />
    </div>
  );
}
