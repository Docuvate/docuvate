// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { DocumentDto } from '@docuvate/contracts';
import { MoreHorizontal } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { documentContentUrl } from '../../lib/api';
import { documentStageState } from '../../lib/documentPipeline';
import { StagePill, useDocumentFieldExport } from '../pipeline';
import { Menu, MenuContent, MenuTrigger } from '../ui/overlay/Menu';

/** Inspector panels: the field review (when there is something to review), details and labels. */
export type InspectorPanel = 'fields' | 'details' | 'labels';

interface DocumentDetailMetaBarProps {
  doc: DocumentDto;
  onDelete: () => void;
  onRequeueExtraction?: () => void;
  requeueBusy?: boolean;
  showTechnicalDetails?: boolean;
  onShowTechnicalDetailsChange?: (open: boolean) => void;
}

export const DOCUMENT_DETAIL_TAB_PANEL_IDS: Record<InspectorPanel, string> = {
  fields: 'document-detail-panel-fields',
  details: 'document-detail-panel-details',
  labels: 'document-detail-panel-labels',
};

/** Ribbon tabs that choose what the floating inspector shows; the active tab closes it again. */
export function DocumentDetailTabStrip({
  panels,
  activeTab,
  labelCount,
  onTabChange,
}: {
  panels: readonly InspectorPanel[];
  activeTab: InspectorPanel | null;
  labelCount: number;
  onTabChange: (tab: InspectorPanel | null) => void;
}) {
  const { t } = useTranslation();
  const label: Record<InspectorPanel, string> = {
    fields: t('documents.tabFields'),
    details: t('documents.tabDetails'),
    labels: t('documents.tabLabels'),
  };
  const count: Record<InspectorPanel, number> = { fields: 0, details: 0, labels: labelCount };

  return (
    <div className="detail-tabs-bar" role="tablist" aria-label={t('documents.tabsAria')}>
      {panels.map((tab) => (
        <button
          key={tab}
          id={`document-detail-tab-${tab}`}
          type="button"
          role="tab"
          aria-selected={activeTab === tab}
          aria-controls={DOCUMENT_DETAIL_TAB_PANEL_IDS[tab]}
          className={`detail-tab${activeTab === tab ? ' active' : ''}`}
          onClick={() => {
            onTabChange(activeTab === tab ? null : tab);
          }}
        >
          {label[tab]}
          {count[tab] > 0 ? (
            <span className="document-detail-tab-count" aria-label={`(${String(count[tab])})`}>
              {count[tab]}
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
  const fieldExport = useDocumentFieldExport(doc.id);
  const title = doc.title.trim() || doc.filename;

  return (
    <header className="document-detail-meta">
      <div className="document-detail-meta-top">
        <div className="document-detail-meta-primary">
          <StagePill state={documentStageState(doc)} status={doc.status} />
          <h1
            className="document-detail-title"
            data-ux="page-title"
            title={`${title}${doc.filename !== title ? ` · ${doc.filename}` : ''}`}
          >
            {title}
          </h1>
        </div>
        <div className="document-detail-meta-actions">
          <Menu>
            <MenuTrigger
              className="document-detail-overflow-trigger btn btn-ghost"
              aria-label={t('documents.moreActionsAria')}
            >
              <MoreHorizontal size={18} strokeWidth={2} aria-hidden />
            </MenuTrigger>
            <MenuContent
              className="document-detail-overflow-panel popover-surface"
              align="end"
            >
              <a
                className="document-detail-overflow-item"
                role="menuitem"
                href={documentContentUrl(doc.id, true)}
                download={doc.filename}
              >
                {t('documents.downloadOriginal')}
              </a>
              {doc.status === 'ready' ? (
                <>
                  <button
                    type="button"
                    className="document-detail-overflow-item"
                    role="menuitem"
                    disabled={fieldExport.busy}
                    onClick={() => void fieldExport.exportAs('csv')}
                  >
                    {t('pipeline.viewer.export.csv')}
                  </button>
                  <button
                    type="button"
                    className="document-detail-overflow-item"
                    role="menuitem"
                    disabled={fieldExport.busy}
                    onClick={() => void fieldExport.exportAs('json')}
                  >
                    {t('pipeline.viewer.export.json')}
                  </button>
                  <hr className="document-detail-overflow-divider" />
                </>
              ) : null}
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
            </MenuContent>
          </Menu>
        </div>
      </div>
    </header>
  );
}
