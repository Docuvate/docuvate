// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { useTranslation } from 'react-i18next';

import { Button } from '../ui/Button';

interface ExtractedTextPageNavProps {
  pageNumbers: readonly number[];
  activePage: number;
  onPageChange: (page: number) => void;
}

/** Prev/next paging for the text view, which has no PDF viewer to page with. */
export function ExtractedTextPageNav({
  pageNumbers,
  activePage,
  onPageChange,
}: ExtractedTextPageNavProps) {
  const { t } = useTranslation();
  const index = pageNumbers.indexOf(activePage);
  const previous = index > 0 ? pageNumbers.at(index - 1) : undefined;
  const next = index >= 0 ? pageNumbers.at(index + 1) : pageNumbers.at(0);
  const total = pageNumbers.at(-1) ?? pageNumbers.length;

  return (
    <nav className="extracted-text-page-nav" aria-label={t('documents.extractedTextPageNavAria')}>
      <Button
        type="button"
        variant="ghost"
        disabled={previous === undefined}
        onClick={() => {
          if (previous !== undefined) onPageChange(previous);
        }}
      >
        {t('documents.extractedTextPagePrev')}
      </Button>
      <span className="muted extracted-text-page-nav-status" aria-live="polite">
        {t('documents.extractedTextPageOf', { page: activePage, total })}
      </span>
      <Button
        type="button"
        variant="ghost"
        disabled={next === undefined}
        onClick={() => {
          if (next !== undefined) onPageChange(next);
        }}
      >
        {t('documents.extractedTextPageNext')}
      </Button>
    </nav>
  );
}
