// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type {
  DocumentRegionDto,
  ExtractedField,
  LayoutIrDocument,
  RecognizedFieldDefinitionDto,
} from '@docuvate/contracts';
import { normalizeSuggestionDecisionValue } from '@docuvate/contracts';
import {
  type KeyboardEvent,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';

import { isUserConfirmedField } from '../../lib/documentFieldValueRowState';
import { fieldSuggestionOutsideUserSchema } from '../../lib/fieldSuggestionSchema';
import { findFieldRegion } from '../../lib/findFieldRegion';
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
import {
  groupLayoutPanelFields,
  LAYOUT_FIELD_FILTER_MIN_FIELDS,
} from '../../lib/layoutPanelFieldGroups';
import { fieldsForLayoutPanel } from '../../lib/layoutPanelFields';
import {
  buildRecognizedFieldDefinitionIndex,
  definitionIdForFieldKey,
  persistedRecognizedDefinitionIds,
  suggestionMatchesPersistedDefinition,
} from '../../lib/recognizedFieldDefinitionIndex';
import { sourceChipPageLabel } from '../../lib/sourceChipLabel';
import type { TableStructureChoice } from '../../lib/tableLayouts';
import { Button } from '../ui/Button';
import { FieldValueRow } from '../ui/FieldValueRow';
import { Input } from '../ui/Input';
import { SourceChip } from '../ui/SourceChip';
import { CorrectedTableCard } from './CorrectedTableCard';

export type LayoutSideTab = 'fields' | 'tables' | 'outline';

const LAYOUT_SIDE_TAB_ORDER: LayoutSideTab[] = ['fields', 'tables', 'outline'];

interface DocumentLayoutSidePanelProps {
  layoutIr: LayoutIrDocument;
  fields: ExtractedField[];
  knownFieldKeys: Set<string>;
  fieldLabelForKey: (key: string) => string;
  activeTab: LayoutSideTab;
  onTabChange: (tab: LayoutSideTab) => void;
  activeOverlayId: string | null;
  onOverlaySelect: (overlayId: string, page: number) => void;
  onAcceptSuggestion: (key: string, value: string) => void;
  onDismissSuggestion: (key: string, value: string) => void;
  /** Identities `${fieldKey}\0${normalizedValue}` that were durably rejected. */
  dismissedSuggestions: Set<string>;
  heuristicSuggestions?: { key: string; value: string }[];
  recognizedCatalog?: RecognizedFieldDefinitionDto[];
  fieldRegions?: DocumentRegionDto[];
  tableRegions?: DocumentRegionDto[];
  onTableLayoutApply?: (regionId: string, choice: TableStructureChoice) => void;
  onTableCellChange?: (regionId: string, row: number, col: number, text: string) => void;
  onTableEditInDocument?: (regionId: string) => void;
  onConfirmField?: (key: string, value: string) => void;
  onCorrectField?: (key: string) => void;
  /** Saves a typed value for a field (recorded as a correction). */
  onSaveFieldValue?: (key: string, value: string) => void;
  onHighlightField?: (key: string) => void;
  onSelectField?: (key: string) => void;
  /** When the correction bottom sheet is open, unmount the inline field list so each field has one source chip. */
  hideInlineFieldList?: boolean;
  hideInlineTableList?: boolean;
}

export function DocumentLayoutSidePanel({
  layoutIr,
  fields,
  knownFieldKeys,
  fieldLabelForKey,
  activeTab,
  onTabChange,
  activeOverlayId,
  onOverlaySelect,
  onAcceptSuggestion,
  onDismissSuggestion,
  dismissedSuggestions,
  heuristicSuggestions = [],
  recognizedCatalog = [],
  fieldRegions = [],
  tableRegions = [],
  onTableLayoutApply,
  onTableCellChange,
  onTableEditInDocument,
  onConfirmField,
  onCorrectField,
  onSaveFieldValue,
  onHighlightField,
  onSelectField,
  hideInlineFieldList = false,
  hideInlineTableList = false,
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
  const [fieldQuery, setFieldQuery] = useState('');
  const fieldGroups = useMemo(
    () => groupLayoutPanelFields(panelFields, fieldQuery, fieldLabelForKey),
    [fieldLabelForKey, fieldQuery, panelFields]
  );
  const showFieldFilter = panelFields.length > LAYOUT_FIELD_FILTER_MIN_FIELDS;
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
      (s) =>
        !dismissedSuggestions.has(
          `${s.key}\0${normalizeSuggestionDecisionValue(s.value)}`
        ) && !isDuplicateSuggestion(s.key, s.value)
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

  const tabs = useMemo(
    () =>
      LAYOUT_SIDE_TAB_ORDER.map((id) => ({
        id,
        label: t(
          id === 'fields'
            ? 'documents.layoutTabOverview'
            : id === 'tables'
              ? 'documents.layoutTabTables'
              : 'documents.layoutTabOutline'
        ),
      })),
    [t]
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
      const idx = LAYOUT_SIDE_TAB_ORDER.indexOf(activeTab);
      if (idx < 0) return;
      let nextIdx: number | null = null;
      const tabCount = LAYOUT_SIDE_TAB_ORDER.length;
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
      focusTab(LAYOUT_SIDE_TAB_ORDER[nextIdx]);
    },
    [activeTab, focusTab]
  );

  useEffect(() => {
    if (!activeOverlayId) return;
    const root = panelBodyRef.current;
    if (!root) return;
    const target = root.querySelector<HTMLElement>(
      `[data-layout-overlay-target="${activeOverlayId}"]`
    );
    target?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [activeOverlayId, activeTab]);

  useEffect(() => {
    const root = panelBodyRef.current;
    if (!root) {
      return;
    }
    if (hideInlineFieldList) {
      root.setAttribute('inert', '');
      root.setAttribute('aria-hidden', 'true');
      return;
    }
    root.removeAttribute('inert');
    root.removeAttribute('aria-hidden');
  }, [hideInlineFieldList]);

  const renderFieldRow = (field: ExtractedField, missing: boolean) => {
    const region = findFieldRegion(field.key, fieldRegions);
    const sourceLabel = region ? sourceChipPageLabel(region.page, locale) : undefined;
    return (
      <li
        key={field.key}
        className="layout-field-row"
        data-layout-overlay-target={fieldOverlayIdByKey.get(field.key) ?? undefined}
      >
        <FieldValueRow
          fieldName={fieldLabelForKey(field.key)}
          value={
            missing
              ? ''
              : field.value.trim().length > 0
                ? formatFieldValue(field.key, field.value)
                : t('documents.fieldRegionEmptyHint')
          }
          state={missing ? 'missing' : isUserConfirmedField(field) ? 'confirmed' : 'suggested'}
          confidencePercent={
            field.confidence != null ? Math.round(field.confidence * 100) : undefined
          }
          sourceLabel={sourceLabel}
          onSelect={
            onSelectField
              ? () => {
                  onSelectField(field.key);
                }
              : undefined
          }
          onConfirm={
            onConfirmField && !missing
              ? () => {
                  onConfirmField(field.key, field.value);
                }
              : undefined
          }
          onCorrect={
            onCorrectField
              ? () => {
                  onCorrectField(field.key);
                }
              : undefined
          }
          onSaveValue={
            onSaveFieldValue
              ? (value) => {
                  onSaveFieldValue(field.key, value);
                }
              : undefined
          }
          onSourceClick={
            onHighlightField
              ? () => {
                  onHighlightField(field.key);
                }
              : undefined
          }
        />
      </li>
    );
  };

  return (
    <aside className="layout-side-panel" aria-label={t('documents.layoutSidePanelAria')}>
      <div className="layout-side-tabs" role="tablist" tabIndex={0} onKeyDown={onTabListKeyDown}>
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
              onClick={() => {
                onTabChange(tab.id);
              }}
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
        {activeTab === 'fields' && !hideInlineFieldList ? (
          <div className="layout-side-fields">
            <h3 className="layout-side-section-title">{t('documents.layoutFieldsDetected')}</h3>
            {panelFields.length === 0 && suggestions.length === 0 ? (
              <p className="muted">{t('documents.layoutFieldsEmpty')}</p>
            ) : null}
            {showFieldFilter ? (
              <Input
                type="search"
                className="layout-field-filter"
                value={fieldQuery}
                placeholder={t('documents.layoutFieldsFilterPlaceholder')}
                aria-label={t('documents.layoutFieldsFilterAria')}
                onChange={(event) => {
                  setFieldQuery(event.target.value);
                }}
              />
            ) : null}
            {fieldQuery.trim() &&
            fieldGroups.found.length === 0 &&
            fieldGroups.missing.length === 0 ? (
              <p className="muted">
                {t('documents.layoutFieldsFilterEmpty', { query: fieldQuery.trim() })}
              </p>
            ) : null}
            <ul className="layout-field-list" data-testid="layout-field-list-found">
              {fieldGroups.found.map((field) => renderFieldRow(field, false))}
            </ul>
            {fieldGroups.missing.length > 0 ? (
              <>
                <h4 className="layout-side-subsection-title">
                  {t('documents.layoutFieldsMissing', { count: fieldGroups.missing.length })}
                </h4>
                <ul className="layout-field-list" data-testid="layout-field-list-missing">
                  {fieldGroups.missing.map((field) => renderFieldRow(field, true))}
                </ul>
              </>
            ) : null}
            {suggestions.length > 0 ? (
              <>
                <h3 className="layout-side-section-title">
                  {t('documents.layoutFieldSuggestions')}
                </h3>
                <ul className="layout-field-suggestion-list">
                  {suggestions.map((s) => (
                    <li
                      key={s.key}
                      className="layout-field-suggestion"
                      data-layout-overlay-target={fieldOverlayIdByKey.get(s.key) ?? undefined}
                    >
                      <div className="layout-field-suggestion-primary">
                        <span className="layout-field-label" title={fieldLabelForKey(s.key)}>
                          {fieldLabelForKey(s.key)}
                        </span>
                        <span
                          className="layout-field-value"
                          title={formatFieldValue(s.key, s.value)}
                        >
                          {formatFieldValue(s.key, s.value)}
                        </span>
                      </div>
                      <div className="layout-field-suggestion-meta">
                        <span className="layout-field-suggestion-tag">
                          {t('documents.layoutSuggestionTag')}
                        </span>
                        <SourceChip
                          kind="page"
                          label={sourceChipPageLabel(1, locale)}
                          onClick={() => {
                            onHighlightField?.(s.key);
                          }}
                        />
                      </div>
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
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => {
                            onAcceptSuggestion(s.key, s.value);
                          }}
                        >
                          {t('documents.layoutSuggestionAccept')}
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => {
                            onDismissSuggestion(s.key, s.value);
                          }}
                        >
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
            {hideInlineTableList
              ? null
              : tableRegions.map((region, index) => (
                  <CorrectedTableCard
                    key={region.id}
                    region={region}
                    index={index}
                    active={activeOverlayId === `region-table-${region.id}`}
                    onSelect={() => {
                      onOverlaySelect(`region-table-${region.id}`, region.page);
                    }}
                    onCellChange={(row, col, text) => {
                      onTableCellChange?.(region.id, row, col, text);
                    }}
                    onLayoutApply={
                      onTableLayoutApply
                        ? (choice) => {
                            onTableLayoutApply(region.id, choice);
                          }
                        : undefined
                    }
                    onEditInDocument={
                      onTableEditInDocument
                        ? () => {
                            onTableEditInDocument(region.id);
                          }
                        : undefined
                    }
                  />
                ))}
            {tables.length === 0 && tableRegions.length === 0 ? (
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
                    onClick={() => {
                      onOverlaySelect(table.overlayId, table.page);
                    }}
                  >
                    <span>{t('documents.layoutTableLabel', { n: table.tableIndex + 1 })}</span>
                    <span className="muted">
                      {t('documents.layoutTableMeta', {
                        rows: (table.headerRow ? 1 : 0) + table.bodyRows.length,
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
                              <th key={colIdx} scope="col">
                                {cell}
                              </th>
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
        onClick={() => {
          onOverlaySelect(entry.overlayId, entry.page);
        }}
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
