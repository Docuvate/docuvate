// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { DocumentDto } from '@docuvate/contracts';
import { Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { documentContentUrl } from '../../lib/api';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

type DetailTab = 'details' | 'labels' | 'chat';

interface DocumentDetailMetaBarProps {
  doc: DocumentDto;
  onDelete: () => void;
}

export function DocumentDetailTabStrip({
  activeTab,
  labelCount,
  onTabChange,
}: {
  activeTab: DetailTab | null;
  labelCount: number;
  onTabChange: (tab: DetailTab | null) => void;
}) {
  const { t } = useTranslation();
  const tabs: [DetailTab, string][] = [
    ['details', t('documents.tabDetails')],
    ['labels', t('documents.tabLabels')],
    ['chat', t('documents.tabChat')],
  ];

  return (
    <div className="detail-tabs-bar" role="tablist" aria-label={t('documents.tabsAria')}>
      {tabs.map(([tab, label]) => (
        <button
          key={tab}
          type="button"
          role="tab"
          aria-selected={activeTab === tab}
          className={`detail-tab${activeTab === tab ? ' active' : ''}`}
          onClick={() => { onTabChange(activeTab === tab ? null : tab); }}
        >
          {label}
          {tab === 'labels' && labelCount > 0 ? (
            <span className="document-detail-tab-count">{labelCount}</span>
          ) : null}
        </button>
      ))}
    </div>
  );
}

export function DocumentDetailMetaBar({ doc, onDelete }: DocumentDetailMetaBarProps) {
  const { t } = useTranslation();
  const title = doc.title.trim() || doc.filename;

  return (
    <header className="document-detail-meta">
      <div className="document-detail-meta-top">
        <div className="document-detail-meta-primary">
          <Badge status={doc.status} />
          <h1
            className="document-detail-title"
            data-ux="page-title"
            title={`${title}${doc.filename !== title ? ` · ${doc.filename}` : ''}`}
          >
            {title}
          </h1>
        </div>
        <div className="document-detail-meta-actions">
          <a
            className="btn btn-secondary document-detail-download"
            data-ux="primary-action"
            href={documentContentUrl(doc.id, true)}
            download={doc.filename}
          >
            {t('documents.download')}
          </a>
          <Button
            type="button"
            variant="ghost"
            className="document-detail-delete"
            onClick={onDelete}
          >
            <Trash2 size={16} strokeWidth={2} aria-hidden />
            {t('common.delete')}
          </Button>
        </div>
      </div>
    </header>
  );
}
