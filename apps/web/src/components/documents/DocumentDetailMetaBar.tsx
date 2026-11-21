// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { DocumentDto } from '@docuvate/contracts';
import { ChevronDown, MoreHorizontal, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { documentContentUrl } from '../../lib/api';
import { documentStageState } from '../../lib/documentPipeline';
import { ribbonActionClass } from '../../lib/ribbonAction';
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

/**
 * One Actions control for the floating inspector: open a panel, close it again, or add a field.
 * Keeps act-row peers from competing with Apply / review commands.
 */
export function DocumentDetailPanelMenu({
  panels,
  activeTab,
  labelCount,
  onTabChange,
  onAddField,
}: {
  panels: readonly InspectorPanel[];
  activeTab: InspectorPanel | null;
  labelCount: number;
  onTabChange: (tab: InspectorPanel | null) => void;
  onAddField?: () => void;
}) {
  const { t } = useTranslation();
  const label: Record<InspectorPanel, string> = {
    fields: t('documents.tabFields'),
    details: t('documents.tabDetails'),
    labels: t('documents.tabLabels'),
  };
  const count: Record<InspectorPanel, number> = { fields: 0, details: 0, labels: labelCount };
  const triggerLabel = activeTab ? label[activeTab] : t('ribbon.panel');

  return (
    <div className="detail-panel-menu detail-tabs-bar" data-testid="document-detail-panel-menu">
      <Menu>
        <MenuTrigger
          className={`detail-panel-menu-trigger ${ribbonActionClass(activeTab ? 'secondary' : 'tertiary')}`}
          aria-label={t('ribbon.panelAria')}
          title={t('ribbon.panel')}
        >
          <span className="detail-panel-menu-label">{triggerLabel}</span>
          {activeTab === 'labels' && labelCount > 0 ? (
            <span className="document-detail-tab-count" aria-hidden>
              {labelCount}
            </span>
          ) : null}
          <ChevronDown size={14} aria-hidden />
        </MenuTrigger>
        <MenuContent className="detail-panel-menu-panel popover-surface" align="end">
          {panels.map((tab) => (
            <button
              key={tab}
              type="button"
              role="menuitem"
              id={`document-detail-tab-${tab}`}
              className={`document-detail-overflow-item${activeTab === tab ? ' is-active' : ''}`}
              aria-controls={DOCUMENT_DETAIL_TAB_PANEL_IDS[tab]}
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
          {onAddField ? (
            <button
              type="button"
              role="menuitem"
              className="document-detail-overflow-item"
              data-testid="document-add-recognized-field"
              onClick={onAddField}
            >
              <Plus size={14} aria-hidden />
              {t('recognizedFields.addField')}
            </button>
          ) : null}
          {activeTab ? (
            <button
              type="button"
              role="menuitem"
              className="document-detail-overflow-item"
              onClick={() => {
                onTabChange(null);
              }}
            >
              {t('ribbon.panelClose')}
            </button>
          ) : null}
        </MenuContent>
      </Menu>
    </div>
  );
}

/** @deprecated Prefer DocumentDetailPanelMenu — kept for loading shell layout. */
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
  return (
    <DocumentDetailPanelMenu
      panels={panels}
      activeTab={activeTab}
      labelCount={labelCount}
      onTabChange={onTabChange}
    />
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
            <MenuContent className="document-detail-overflow-panel popover-surface" align="end">
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
                  onClick={() => {
                    onShowTechnicalDetailsChange(!showTechnicalDetails);
                  }}
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
