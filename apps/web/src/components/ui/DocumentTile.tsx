// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { useTranslation } from 'react-i18next';

import { Checkbox } from './Checkbox';

export interface DocumentTileProps {
  title: string;
  meta: string;
  selected?: boolean;
  excluded?: boolean;
  exclusionHint?: string;
  onToggleSelect?: (selected: boolean) => void;
}

export function DocumentTile({
  title,
  meta,
  selected = false,
  excluded = false,
  exclusionHint,
  onToggleSelect,
}: DocumentTileProps) {
  const { t } = useTranslation();
  const resolvedHint = exclusionHint ?? t('ui.documentTile.exclusionHint');
  const hintHidden = !excluded;
  return (
    <article
      className={`document-tile${selected ? ' document-tile-selected' : ''}${excluded ? ' document-tile-excluded' : ''}`.trim()}
    >
      <div className="document-tile-preview">
        <Checkbox
          checked={selected}
          aria-label={t('ui.documentTile.select', { title })}
          onChange={(event) => onToggleSelect?.(event.target.checked)}
        />
        <span className="document-tile-skel" aria-hidden />
        <span className="document-tile-skel document-tile-skel-mid" aria-hidden />
        <span className="document-tile-skel document-tile-skel-short" aria-hidden />
      </div>
      <div className="document-tile-text">
        <div className="document-tile-title">{title}</div>
        <div className="document-tile-meta">{meta}</div>
      </div>
      <p className={`document-tile-hint${hintHidden ? ' document-tile-hint-hidden' : ''}`.trim()}>{resolvedHint}</p>
    </article>
  );
}
