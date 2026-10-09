import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { ExtractedField, ExtractionBlock, LayoutIrDocument } from '@docuvate/contracts';
import {
  buildLayoutOutline,
  buildLayoutOverlays,
  buildLayoutTables,
  fieldSuggestionKeys,
  allLayoutWidgets,
  type LayoutOverlayRegion,
} from '../../lib/layoutOverlayModel';
import { DocumentLayoutExportTab } from './DocumentLayoutExportTab';
import { Button } from '../ui/Button';

export type LayoutSideTab = 'fields' | 'tables' | 'outline' | 'export';

interface DocumentLayoutSidePanelProps {
  documentId: string;
  documentTitle?: string;
  layoutIr: LayoutIrDocument;
  fields: ExtractedField[];
  blocks: ExtractionBlock[];
  markdown?: string | null;
  knownFieldKeys: Set<string>;
  fieldLabelForKey: (key: string) => string;
  activeTab: LayoutSideTab;
  onTabChange: (tab: LayoutSideTab) => void;
  activeOverlayId: string | null;
  onOverlaySelect: (overlayId: string, page: number) => void;
  onAcceptSuggestion: (key: string, value: string) => void;
  onDismissSuggestion: (key: string) => void;
  dismissedSuggestions: Set<string>;
}

export function DocumentLayoutSidePanel({
  documentId,
  documentTitle,
  layoutIr,
  fields,
  blocks,
  markdown,
  knownFieldKeys,
  fieldLabelForKey,
  activeTab,
  onTabChange,
  activeOverlayId,
  onOverlaySelect,
  onAcceptSuggestion,
  onDismissSuggestion,
  dismissedSuggestions,
}: DocumentLayoutSidePanelProps) {
  const { t } = useTranslation();

  const overlays = useMemo(() => buildLayoutOverlays(layoutIr), [layoutIr]);
  const tables = useMemo(() => buildLayoutTables(layoutIr, overlays), [layoutIr, overlays]);
  const outline = useMemo(() => buildLayoutOutline(layoutIr, overlays), [layoutIr, overlays]);
  const suggestions = useMemo(() => {
    const widgets = allLayoutWidgets(layoutIr);
    return fieldSuggestionKeys(widgets, knownFieldKeys, fields).filter(
      (s) => !dismissedSuggestions.has(s.key)
    );
  }, [layoutIr, knownFieldKeys, fields, dismissedSuggestions]);

  const tabs: { id: LayoutSideTab; label: string }[] = [
    { id: 'fields', label: t('documents.layoutTabFields') },
    { id: 'tables', label: t('documents.layoutTabTables') },
    { id: 'outline', label: t('documents.layoutTabOutline') },
    { id: 'export', label: t('documents.layoutTabExport') },
  ];

  return (
    <aside className="layout-side-panel" aria-label={t('documents.layoutSidePanelAria')}>
      <div className="layout-side-tabs" role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            className={`layout-side-tab${activeTab === tab.id ? ' layout-side-tab-active' : ''}`}
            onClick={() => onTabChange(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="layout-side-panel-body" role="tabpanel">
        {activeTab === 'fields' ? (
          <div className="layout-side-fields">
            <h3 className="layout-side-section-title">{t('documents.layoutFieldsDetected')}</h3>
            <ul className="layout-field-list">
              {fields.map((field) => (
                <li key={field.key} className="layout-field-row">
                  <span className="layout-field-label">{fieldLabelForKey(field.key)}</span>
                  <span className="layout-field-value">{field.value}</span>
                </li>
              ))}
            </ul>
            {suggestions.length > 0 ? (
              <>
                <h3 className="layout-side-section-title">{t('documents.layoutFieldSuggestions')}</h3>
                <ul className="layout-field-suggestion-list">
                  {suggestions.map((s) => (
                    <li key={s.key} className="layout-field-suggestion">
                      <div className="layout-field-suggestion-head">
                        <span className="layout-field-suggestion-tag">{t('documents.layoutSuggestionTag')}</span>
                        <span className="layout-field-label">{fieldLabelForKey(s.key)}</span>
                      </div>
                      <p className="layout-field-value">{s.value}</p>
                      <p className="muted layout-field-suggestion-note">
                        {t('documents.layoutSuggestionNotInSchema')}
                      </p>
                      <div className="layout-field-suggestion-actions">
                        <Button type="button" variant="secondary" onClick={() => onAcceptSuggestion(s.key, s.value)}>
                          {t('documents.layoutSuggestionAccept')}
                        </Button>
                        <Button type="button" variant="ghost" onClick={() => onDismissSuggestion(s.key)}>
                          {t('documents.layoutSuggestionDismiss')}
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              </>
            ) : null}
          </div>
        ) : null}

        {activeTab === 'tables' ? (
          <div className="layout-side-tables">
            {tables.length === 0 ? (
              <p className="muted">{t('documents.layoutTablesEmpty')}</p>
            ) : (
              tables.map((table) => (
                <section
                  key={table.tableIndex}
                  className={`layout-table-card${
                    activeOverlayId === table.overlayId ? ' layout-table-card-active' : ''
                  }`}
                >
                  <button
                    type="button"
                    className="layout-table-card-head"
                    onClick={() => onOverlaySelect(table.overlayId, table.page)}
                  >
                    <span>{table.title}</span>
                    <span className="muted">
                      {t('documents.layoutTableMeta', {
                        rows: table.rows.length,
                        cols: table.columnCount,
                      })}
                    </span>
                  </button>
                  <div className="layout-table-scroll">
                    <table className="layout-data-table">
                      <tbody>
                        {table.rows.map((row, rowIdx) => (
                          <tr key={rowIdx}>
                            {row.map((cell, colIdx) => (
                              <td key={colIdx}>{cell}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              ))
            )}
          </div>
        ) : null}

        {activeTab === 'outline' ? (
          <div className="layout-side-outline">
            {outline.length === 0 ? (
              <p className="muted">{t('documents.layoutOutlineEmpty')}</p>
            ) : (
              <ul className="layout-outline-list">
                {outline.map((entry) => (
                  <li key={entry.id}>
                    <button
                      type="button"
                      className={`layout-outline-item layout-outline-level-${entry.level}${
                        activeOverlayId === entry.overlayId ? ' layout-outline-item-active' : ''
                      }`}
                      onClick={() => onOverlaySelect(entry.overlayId, entry.page)}
                    >
                      <span className="layout-outline-title">{entry.title}</span>
                      <span className="muted layout-outline-page">
                        {t('documents.layoutOutlinePage', { page: entry.page })}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : null}

        {activeTab === 'export' ? (
          <DocumentLayoutExportTab
            documentId={documentId}
            documentTitle={documentTitle}
            hasLayoutIr={layoutIr.pages.length > 0}
            markdown={markdown}
            blocks={blocks}
          />
        ) : null}
      </div>
    </aside>
  );
}

export function overlayRegionById(
  overlays: LayoutOverlayRegion[],
  id: string
): LayoutOverlayRegion | undefined {
  return overlays.find((o) => o.id === id);
}
