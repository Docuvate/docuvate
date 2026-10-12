// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { ExtractedField, LayoutIrDocument, RecognizedFieldDefinitionDto } from '@docuvate/contracts';
import { type KeyboardEvent, useCallback, useEffect, useId, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import { fieldSuggestionOutsideUserSchema } from '../../lib/fieldSuggestionSchema';
import { formatExtractedFieldDisplayValue } from '../../lib/formatExtractedFieldDisplayValue';
import {
  allLayoutWidgets,
  buildLayoutOutline,
  buildLayoutOutlineTree,
  buildLayoutOverlays,
  buildLayoutTables,
  fieldSuggestionKeys,
  type LayoutOutlineNode,
  type LayoutOverlayRegion,
} from '../../lib/layoutOverlayModel';
import { fieldsForLayoutPanel } from '../../lib/layoutPanelFields';
import {
  buildRecognizedFieldDefinitionIndex,
  definitionIdForFieldKey,
  persistedRecognizedDefinitionIds,
  suggestionMatchesPersistedDefinition,
} from '../../lib/recognizedFieldDefinitionIndex';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { DocumentChatPanel } from './DocumentChatPanel';

export type LayoutSideTab = 'fields' | 'tables' | 'outline' | 'chat';

const LAYOUT_SIDE_TAB_ORDER: LayoutSideTab[] = ['fields', 'tables', 'outline', 'chat'];

interface DocumentLayoutSidePanelProps {
  documentId: string;
  layoutIr: LayoutIrDocument;
  fields: ExtractedField[];
  knownFieldKeys: Set<string>;
  fieldLabelForKey: (key: string) => string;
  activeTab: LayoutSideTab;
  onTabChange: (tab: LayoutSideTab) => void;
  activeOverlayId: string | null;
  onOverlaySelect: (overlayId: string, page: number) => void;
  onAcceptSuggestion: (key: string, value: string) => void;
  onFieldValueChange?: (key: string, value: string) => void;
  onDismissSuggestion: (key: string) => void;
  dismissedSuggestions: Set<string>;
  heuristicSuggestions?: { key: string; value: string }[];
  recognizedCatalog?: RecognizedFieldDefinitionDto[];
  documentChatAvailable?: boolean;
  documentChatUiEnabled?: boolean;
  showChatTab?: boolean;
}

export function DocumentLayoutSidePanel({
  documentId,
  layoutIr,
  fields,
  knownFieldKeys,
  fieldLabelForKey,
  activeTab,
  onTabChange,
  activeOverlayId,
  onOverlaySelect,
  onAcceptSuggestion,
  onFieldValueChange,
  onDismissSuggestion,
  dismissedSuggestions,
  heuristicSuggestions = [],
  recognizedCatalog = [],
  documentChatAvailable = false,
  documentChatUiEnabled = true,
  showChatTab = true,
}: DocumentLayoutSidePanelProps) {
  const { t, i18n } = useTranslation();
  const tabsBaseId = useId();
  const tabRefs = useRef<Partial<Record<LayoutSideTab, HTMLButtonElement | null>>>({});
  const panelBodyRef = useRef<HTMLDivElement>(null);

  const overlays = useMemo(() => buildLayoutOverlays(layoutIr), [layoutIr]);
  const tables = useMemo(() => buildLayoutTables(layoutIr, overlays), [layoutIr, overlays]);
  const outline = useMemo(() => buildLayoutOutline(layoutIr, overlays), [layoutIr, overlays]);
  const outlineTree = useMemo(() => buildLayoutOutlineTree(outline), [outline]);
  const definitionIndex = useMemo(
    () => buildRecognizedFieldDefinitionIndex(recognizedCatalog),
    [recognizedCatalog]
  );
  const persistedDefinitionIds = useMemo(
    () => persistedRecognizedDefinitionIds(fields, definitionIndex),
    [definitionIndex, fields]
  );
  const fieldOverlayIdByKey = useMemo(() => {
    const map = new Map<string, string>();
    for (const overlay of overlays) {
      if (overlay.kind !== 'field') continue;
      const key = overlay.label.trim();
      if (key) map.set(key, overlay.id);
    }
    return map;
  }, [overlays]);

  const panelFields = useMemo(() => fieldsForLayoutPanel(fields), [fields]);
  const locale = i18n.language;
  const formatFieldValue = useCallback(
    (key: string, value: string) => formatExtractedFieldDisplayValue(key, value, locale),
    [locale]
  );

  const acceptedFieldValues = useMemo(
    () => new Set(fields.map((field) => `${field.key}\u0000${field.value}`)),
    [fields]
  );

  const isDuplicateSuggestion = useCallback(
    (key: string, value: string) => acceptedFieldValues.has(`${key}\u0000${value}`),
    [acceptedFieldValues]
  );

  const suggestions = useMemo(() => {
    const widgets = allLayoutWidgets(layoutIr);
    const definitionIdForKey = (key: string) => definitionIdForFieldKey(key, definitionIndex);
    const fromWidgets = fieldSuggestionKeys(
      widgets,
      knownFieldKeys,
      fields,
      persistedDefinitionIds,
      definitionIdForKey
    ).map((s) => ({
      ...s,
      label: fieldLabelForKey(s.key),
    }));
    const fromHeuristics = heuristicSuggestions
      .filter(
        (s) =>
          !knownFieldKeys.has(s.key) &&
          !fields.some((f) => f.key === s.key) &&
          !suggestionMatchesPersistedDefinition(s.key, persistedDefinitionIds, definitionIndex)
      )
      .map((s) => ({
        key: s.key,
        label: fieldLabelForKey(s.key),
        value: s.value,
      }));
    const merged = [...fromHeuristics, ...fromWidgets];
    const seen = new Set<string>();
    const unique = merged.filter((s) => {
      const dedupeKey = `${s.key}\u0000${s.value}`;
      if (seen.has(dedupeKey)) return false;
      seen.add(dedupeKey);
      return true;
    });
    return unique.filter(
      (s) => !dismissedSuggestions.has(s.key) && !isDuplicateSuggestion(s.key, s.value)
    );
  }, [
    layoutIr,
    knownFieldKeys,
    fields,
    dismissedSuggestions,
    heuristicSuggestions,
    fieldLabelForKey,
    isDuplicateSuggestion,
    definitionIndex,
    persistedDefinitionIds,
  ]);

  const tabOrder = useMemo(
    () =>
      showChatTab && documentChatUiEnabled
        ? LAYOUT_SIDE_TAB_ORDER
        : LAYOUT_SIDE_TAB_ORDER.filter((id) => id !== 'chat'),
    [documentChatUiEnabled, showChatTab]
  );

  const tabs = useMemo(
    () =>
      tabOrder.map((id) => ({
        id,
        label: t(
          id === 'fields'
            ? 'documents.layoutTabOverview'
            : id === 'tables'
              ? 'documents.layoutTabTables'
              : id === 'outline'
                ? 'documents.layoutTabOutline'
                : 'documents.tabChat'
        ),
      })),
    [t, tabOrder]
  );

  const activeTabMeta = tabs.find((tab) => tab.id === activeTab) ?? tabs[0];
  const activePanelId = `${tabsBaseId}-panel-${activeTabMeta.id}`;
  const activeTabId = `${tabsBaseId}-tab-${activeTabMeta.id}`;

  const focusTab = useCallback(
    (tabId: LayoutSideTab) => {
      tabRefs.current[tabId]?.focus();
      onTabChange(tabId);
    },
    [onTabChange]
  );

  const onTabListKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      const idx = tabOrder.indexOf(activeTab);
      if (idx < 0) return;
      let nextIdx: number | null = null;
      const tabCount = tabOrder.length;
      switch (event.key) {
        case 'ArrowRight':
          nextIdx = (idx + 1) % tabCount;
          break;
        case 'ArrowLeft':
          nextIdx = (idx - 1 + tabCount) % tabCount;
          break;
        case 'Home':
          nextIdx = 0;
          break;
        case 'End':
          nextIdx = tabCount - 1;
          break;
        default:
          return;
      }
      event.preventDefault();
      focusTab(tabOrder[nextIdx]);
    },
    [activeTab, focusTab, tabOrder]
  );

  useEffect(() => {
    if (!tabOrder.includes(activeTab)) {
      onTabChange(tabOrder[0] ?? 'fields');
    }
  }, [activeTab, onTabChange, tabOrder]);

  useEffect(() => {
    if (!activeOverlayId) return;
    const root = panelBodyRef.current;
    if (!root) return;
    const target = root.querySelector<HTMLElement>(
      `[data-layout-overlay-target="${activeOverlayId}"]`
    );
    target?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [activeOverlayId, activeTab]);

  return (
    <aside
      className={`layout-side-panel${activeTab === 'chat' ? ' layout-side-panel--chat' : ''}`}
      aria-label={t('documents.layoutSidePanelAria')}
    >
      <div
        className="layout-side-tabs"
        role="tablist"
        tabIndex={0}
        onKeyDown={onTabListKeyDown}
      >
        {tabs.map((tab) => {
          const selected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              ref={(el) => {
                tabRefs.current[tab.id] = el;
              }}
              id={`${tabsBaseId}-tab-${tab.id}`}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls={`${tabsBaseId}-panel-${tab.id}`}
              tabIndex={selected ? 0 : -1}
              className={`layout-side-tab${selected ? ' layout-side-tab-active' : ''}`}
              onClick={() => { onTabChange(tab.id); }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <div
        ref={panelBodyRef}
        className="layout-side-panel-body"
        role="tabpanel"
        id={activePanelId}
        aria-labelledby={activeTabId}
      >
        {activeTab === 'fields' ? (
          <div className="layout-side-fields">
            <h3 className="layout-side-section-title">{t('documents.layoutFieldsDetected')}</h3>
            {panelFields.length === 0 && suggestions.length === 0 ? (
              <p className="muted">{t('documents.layoutFieldsEmpty')}</p>
            ) : null}
            <ul className="layout-field-list">
              {panelFields.map((field) => (
                <li
                  key={field.key}
                  className="layout-field-row"
                  data-layout-overlay-target={fieldOverlayIdByKey.get(field.key) ?? undefined}
                >
                  <span className="layout-field-label">{fieldLabelForKey(field.key)}</span>
                  {onFieldValueChange ? (
                    <Input
                      className="layout-field-input"
                      value={field.value}
                      aria-label={fieldLabelForKey(field.key)}
                      onChange={(e) => { onFieldValueChange(field.key, e.target.value); }}
                    />
                  ) : (
                    <span className="layout-field-value">
                      {formatFieldValue(field.key, field.value)}
                    </span>
                  )}
                </li>
              ))}
            </ul>
            {suggestions.length > 0 ? (
              <>
                <h3 className="layout-side-section-title">{t('documents.layoutFieldSuggestions')}</h3>
                <ul className="layout-field-suggestion-list">
                  {suggestions.map((s) => (
                    <li
                      key={s.key}
                      className="layout-field-suggestion"
                      data-layout-overlay-target={fieldOverlayIdByKey.get(s.key) ?? undefined}
                    >
                      <div className="layout-field-suggestion-head">
                        <span className="layout-field-suggestion-tag">{t('documents.layoutSuggestionTag')}</span>
                        <span className="layout-field-label">{fieldLabelForKey(s.key)}</span>
                      </div>
                      <p className="layout-field-value">{formatFieldValue(s.key, s.value)}</p>
                      {fieldSuggestionOutsideUserSchema(s.key, knownFieldKeys) ? (
                        <p className="muted layout-field-suggestion-note">
                          <span className="layout-field-suggestion-badge">
                            {t('documents.layoutSuggestionNotInSchema')}
                          </span>
                          <span className="layout-field-suggestion-badge-hint">
                            {t('documents.layoutSuggestionNotInSchemaHint')}
                          </span>
                        </p>
                      ) : null}
                      <div className="layout-field-suggestion-actions">
                        <Button type="button" variant="secondary" onClick={() => { onAcceptSuggestion(s.key, s.value); }}>
                          {t('documents.layoutSuggestionAccept')}
                        </Button>
                        <Button type="button" variant="ghost" onClick={() => { onDismissSuggestion(s.key); }}>
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
                  data-layout-overlay-target={table.overlayId}
                >
                  <button
                    type="button"
                    className="layout-table-card-head"
                    onClick={() => { onOverlaySelect(table.overlayId, table.page); }}
                  >
                    <span>{t('documents.layoutTableLabel', { n: table.tableIndex + 1 })}</span>
                    <span className="muted">
                      {t('documents.layoutTableMeta', {
                        rows: table.rows.length,
                        cols: table.columnCount,
                      })}
                    </span>
                  </button>
                  <div className="layout-table-scroll">
                    <table className="layout-data-table">
                      {table.headerRow ? (
                        <thead>
                          <tr>
                            {table.headerRow.map((cell, colIdx) => (
                              <th key={colIdx} scope="col">{cell}</th>
                            ))}
                          </tr>
                        </thead>
                      ) : null}
                      <tbody>
                        {table.bodyRows.map((row, rowIdx) => (
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
              <ul className="layout-outline-list layout-outline-list-nested">
                {outlineTree.map((node) => (
                  <OutlineTreeNode
                    key={node.entry.id}
                    node={node}
                    activeOverlayId={activeOverlayId}
                    onOverlaySelect={onOverlaySelect}
                    t={t}
                  />
                ))}
              </ul>
            )}
          </div>
        ) : null}

        {activeTab === 'chat' ? (
          <div className="layout-side-chat">
            <DocumentChatPanel
              documentId={documentId}
              compact
              sidePanel
              chatAvailable={documentChatAvailable}
              chatUiEnabled={documentChatUiEnabled}
            />
          </div>
        ) : null}
      </div>
    </aside>
  );
}

function OutlineTreeNode({
  node,
  activeOverlayId,
  onOverlaySelect,
  t,
}: {
  node: LayoutOutlineNode;
  activeOverlayId: string | null;
  onOverlaySelect: (overlayId: string, page: number) => void;
  t: (key: string, options?: Record<string, unknown>) => string;
}) {
  const entry = node.entry;
  return (
    <li className="layout-outline-node">
      <button
        type="button"
        className={`layout-outline-item layout-outline-level-${String(entry.level)}${
          activeOverlayId === entry.overlayId ? ' layout-outline-item-active' : ''
        }`}
        data-layout-overlay-target={entry.overlayId}
        onClick={() => { onOverlaySelect(entry.overlayId, entry.page); }}
      >
        <span className="layout-outline-title">{entry.title}</span>
        <span className="muted layout-outline-page">
          {t('documents.layoutOutlinePage', { page: entry.page })}
        </span>
      </button>
      {node.children.length > 0 ? (
        <ul className="layout-outline-list layout-outline-list-nested">
          {node.children.map((child) => (
            <OutlineTreeNode
              key={child.entry.id}
              node={child}
              activeOverlayId={activeOverlayId}
              onOverlaySelect={onOverlaySelect}
              t={t}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

export function overlayRegionById(
  overlays: LayoutOverlayRegion[],
  id: string
): LayoutOverlayRegion | undefined {
  return overlays.find((o) => o.id === id);
}
