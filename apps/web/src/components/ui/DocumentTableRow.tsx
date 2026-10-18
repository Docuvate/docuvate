// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { FileText } from 'lucide-react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { Checkbox } from './Checkbox';

export interface DocumentTableRowProps {
  selected?: boolean;
  title: ReactNode;
  meta?: ReactNode;
  correspondent?: ReactNode;
  labels?: ReactNode;
  date?: ReactNode;
  status?: ReactNode;
  onToggleSelect?: (selected: boolean) => void;
}

export function DocumentTableRow({
  selected = false,
  title,
  meta,
  correspondent,
  labels,
  date,
  status,
  onToggleSelect,
}: DocumentTableRowProps) {
  const { t } = useTranslation();
  return (
    <div
      className={`doc-table-row${selected ? ' doc-table-row-selected' : ''}`.trim()}
    >
      <Checkbox
        checked={selected}
        aria-label={t('ui.table.selectRow')}
        onChange={(event) => onToggleSelect?.(event.target.checked)}
      />
      <span className="doc-table-thumb" aria-hidden>
        <FileText size={18} />
      </span>
      <div className="doc-table-title-cell">
        <div className="doc-table-title">{title}</div>
        {meta ? <div className="doc-table-meta">{meta}</div> : null}
      </div>
      <div className="doc-table-correspondent">{correspondent}</div>
      <div className="doc-table-labels">{labels}</div>
      <div className="doc-table-date">{date}</div>
      <div className="doc-table-status">{status}</div>
    </div>
  );
}
