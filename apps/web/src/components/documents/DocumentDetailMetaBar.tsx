// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { DocumentDto } from '@docuvate/contracts';
import { ChevronDown, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { documentStageState } from '../../lib/documentPipeline';
import { ribbonActionClass } from '../../lib/ribbonAction';
import { StagePill } from '../pipeline';
import { Menu, MenuContent, MenuTrigger } from '../ui/overlay/Menu';
import { DocumentDetailOverflowMenu } from './DocumentDetailOverflowMenu';

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

export function DocumentDetailMetaBar({
  doc,
  onDelete,
  onRequeueExtraction,
  requeueBusy = false,
  showTechnicalDetails = false,
  onShowTechnicalDetailsChange,
}: DocumentDetailMetaBarProps) {
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
          <DocumentDetailOverflowMenu
            doc={doc}
            onDelete={onDelete}
            onRequeueExtraction={onRequeueExtraction}
            requeueBusy={requeueBusy}
            showTechnicalDetails={showTechnicalDetails}
            onShowTechnicalDetailsChange={onShowTechnicalDetailsChange}
          />
        </div>
      </div>
    </header>
  );
}
