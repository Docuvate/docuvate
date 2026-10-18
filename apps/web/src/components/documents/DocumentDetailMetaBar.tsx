// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { DocumentDto } from '@docuvate/contracts';
import { MoreVertical } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { documentContentUrl } from '../../lib/api';
import { Badge } from '../ui/Badge';

type DetailTab = 'details' | 'labels' | 'chat';

interface DocumentDetailMetaBarProps {
  doc: DocumentDto;
  onDelete: () => void;
  onRequeueExtraction?: () => void;
  requeueBusy?: boolean;
  showTechnicalDetails?: boolean;
  onShowTechnicalDetailsChange?: (open: boolean) => void;
}

export function DocumentDetailTabStrip({
  activeTab,
  labelCount,
  onTabChange,
  showChatTab = true,
}: {
  activeTab: DetailTab | null;
  labelCount: number;
  onTabChange: (tab: DetailTab | null) => void;
  showChatTab?: boolean;
}) {
  const { t } = useTranslation();
  const tabs: [DetailTab, string][] = showChatTab
    ? [
        ['details', t('documents.tabDetails')],
        ['labels', t('documents.tabLabels')],
        ['chat', t('documents.tabChat')],
      ]
    : [
        ['details', t('documents.tabDetails')],
        ['labels', t('documents.tabLabels')],
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
            <span className="document-detail-tab-count" aria-label={`(${String(labelCount)})`}>
              {' '}({labelCount})
            </span>
          ) : null}
        </button>
      ))}
    </div>
  );
}

export function DocumentDetailMetaBar({
  doc,
  onDelete,
  onRequeueExtraction,
  requeueBusy = false,
  showTechnicalDetails = false,
  onShowTechnicalDetailsChange,
}: DocumentDetailMetaBarProps) {
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
          <details className="document-detail-overflow-menu">
            <summary
              className="document-detail-overflow-trigger btn btn-ghost"
              aria-label={t('documents.moreActionsAria')}
            >
              <MoreVertical size={18} strokeWidth={2} aria-hidden />
            </summary>
            <div className="document-detail-overflow-panel" role="menu">
              {onRequeueExtraction ? (
                <button
                  type="button"
                  className="document-detail-overflow-item"
                  role="menuitem"
                  disabled={requeueBusy}
                  onClick={onRequeueExtraction}
                >
                  {t('documents.reprocess')}
                </button>
              ) : null}
              {onShowTechnicalDetailsChange ? (
                <button
                  type="button"
                  className="document-detail-overflow-item"
                  role="menuitemcheckbox"
                  aria-checked={showTechnicalDetails}
                  onClick={() => { onShowTechnicalDetailsChange(!showTechnicalDetails); }}
                >
                  {showTechnicalDetails
                    ? t('documents.technicalDetailsHide')
                    : t('documents.technicalDetailsShow')}
                </button>
              ) : null}
              <button
                type="button"
                className="document-detail-overflow-item document-detail-overflow-item-danger"
                role="menuitem"
                onClick={onDelete}
              >
                {t('common.delete')}
              </button>
            </div>
          </details>
        </div>
      </div>
    </header>
  );
}
