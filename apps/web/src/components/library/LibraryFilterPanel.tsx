// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type {
  DocumentListQuery,
  DocumentStatus,
  RecognizedFieldDefinitionDto,
  TagDto,
} from '@docuvate/contracts';
import { Filter, Inbox } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import type { DocumentFilterParseIssue } from '../../lib/documentFilterQuery';
import { documentStatusLabel, parseDocumentStatusFilterValue } from '../../lib/documentStatusLabel';
import { fieldFilterValueForKey } from '../../lib/libraryFieldFilters';
import type { LibraryFilterMode } from '../../lib/libraryFilterMode';
import { Input } from '../ui/Input';
import { SegmentedControl } from '../ui/SegmentedControl';
import { Select } from '../ui/Select';
import { LibraryLabelFilterCombobox } from './LibraryLabelFilterCombobox';
import { LibraryTagFilterCombobox } from './LibraryTagFilterCombobox';

const ICON_SIZE = 18;
const ICON_STROKE = 1.75;

interface LibraryFilterPanelProps {
  filters: DocumentListQuery;
  tags: TagDto[];
  filterableFields: RecognizedFieldDefinitionDto[];
  statusOptions: DocumentStatus[];
  onToggleFilter: (patch: Partial<DocumentListQuery>) => void;
  onToggleLabelFilter: (tagId: string) => void;
  onFieldFilterChange: (fieldKey: string, valueText: string) => void;
  filterMode: LibraryFilterMode;
  onFilterModeChange: (mode: LibraryFilterMode) => void;
  filterQueryText: string;
  onFilterQueryTextChange: (text: string) => void;
  onApplyFilterQuery: (text: string) => void;
  filterParseIssues: DocumentFilterParseIssue[];
}

export function LibraryFilterPanel({
  filters,
  tags,
  filterableFields,
  statusOptions,
  onToggleFilter,
  onToggleLabelFilter,
  onFieldFilterChange,
  filterMode,
  onFilterModeChange,
  filterQueryText,
  onFilterQueryTextChange,
  onApplyFilterQuery,
  filterParseIssues,
}: LibraryFilterPanelProps) {
  const { t } = useTranslation();
  const activeTagIds = new Set(filters.tagIds ?? (filters.tagId ? [filters.tagId] : []));
  const withoutLabel = Boolean(filters.withoutNonInboxLabel);
  const absenderField = filterableFields.find((field) => field.key === 'absender');
  const otherFilterableFields = filterableFields.filter((field) => field.key !== 'absender');

  return (
    <aside className="filter-panel" aria-label={t('library.filter.panelAria')} data-testid="library-filter-panel">
      <div className="filter-panel-head">
        <h2 className="filter-heading">
          <Filter
            size={ICON_SIZE}
            strokeWidth={ICON_STROKE}
            className="filter-heading-icon"
            aria-hidden
          />
          {t('library.filter.title')}
        </h2>
      </div>

      <div className="filter-panel-body">
        <SegmentedControl<LibraryFilterMode>
          ariaLabel={t('library.filter.modeAria')}
          className="filter-mode-switch segmented-control--text segmented-control--menu-block"
          value={filterMode}
          options={[
            { value: 'ui', label: t('library.filter.modeUi') },
            { value: 'query', label: t('library.filter.modeQuery') },
          ]}
          onChange={onFilterModeChange}
        />

        {filterMode === 'query' ? (
          <div className="filter-query-block">
            <label className="filter-label" htmlFor="library-filter-query">
              {t('library.filter.queryLabel')}
            </label>
            <Input
              id="library-filter-query"
              value={filterQueryText}
              onChange={(e) => { onFilterQueryTextChange(e.target.value); }}
              onBlur={() => { onApplyFilterQuery(filterQueryText); }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
                  e.preventDefault();
                  onApplyFilterQuery(filterQueryText);
                }
              }}
              placeholder={t('library.filter.queryPlaceholder')}
              aria-describedby={
                filterParseIssues.length > 0 ? 'library-filter-query-issues' : undefined
              }
            />
            <p className="muted filter-hint">{t('library.filter.queryHint')}</p>
            {filterParseIssues.length > 0 ? (
              <ul className="filter-parse-issues" id="library-filter-query-issues" role="status">
                {filterParseIssues.map((issue) => (
                  <li key={`${issue.token}-${issue.messageKey}`}>
                    {t(issue.messageKey, { token: issue.token, detail: issue.detail ?? '' })}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : (
          <>
            <div className="filter-group filter-group-views">
              <span className="filter-label">{t('library.filter.views')}</span>
              <button
                type="button"
                className={`filter-chip filter-chip-inbox${filters.inbox ? ' filter-chip-active' : ''}`}
                onClick={() => { onToggleFilter({
                    inbox: !filters.inbox,
                    tagIds: undefined,
                    withoutNonInboxLabel: undefined,
                  }); }
                }
              >
                <Inbox size={ICON_SIZE} strokeWidth={ICON_STROKE} aria-hidden />
                {t('nav.inbox')}
              </button>
              <button
                type="button"
                className={`filter-chip filter-chip-label${withoutLabel ? ' filter-chip-active' : ''}`}
                onClick={() => { onToggleFilter({
                    withoutNonInboxLabel: withoutLabel ? undefined : true,
                    inbox: undefined,
                    tagIds: undefined,
                  }); }
                }
              >
                {t('library.filter.withoutLabel')}
              </button>
            </div>
            <div className="filter-group filter-group-dates">
              <span className="filter-label">{t('library.filter.documentDate')}</span>
              <div className="filter-date-range">
                <label className="filter-date-field">
                  <span className="muted filter-date-field-label">{t('library.filter.documentDateFrom')}</span>
                  <Input
                    type="date"
                    value={filters.documentDateFrom ?? ''}
                    data-testid="library-filter-date-from"
                    onChange={(e) => {
                      onToggleFilter({
                        documentDateFrom: e.target.value || undefined,
                      });
                    }}
                  />
                </label>
                <label className="filter-date-field">
                  <span className="muted filter-date-field-label">{t('library.filter.documentDateTo')}</span>
                  <Input
                    type="date"
                    value={filters.documentDateTo ?? ''}
                    data-testid="library-filter-date-to"
                    onChange={(e) => {
                      onToggleFilter({
                        documentDateTo: e.target.value || undefined,
                      });
                    }}
                  />
                </label>
              </div>
            </div>
            {absenderField ? (
              <div className="filter-group filter-group-absender" data-testid="library-filter-absender">
                <LibraryLabelFilterCombobox
                  fieldKey={absenderField.key}
                  label={absenderField.label}
                  value={fieldFilterValueForKey(filters.fieldFilters, absenderField.key)}
                  onChange={(next) => { onFieldFilterChange(absenderField.key, next); }}
                  testId="library-filter-absender-combobox"
                />
              </div>
            ) : null}
            {otherFilterableFields.map((field) => (
              <div
                key={field.key}
                className="filter-group filter-group-field"
                data-testid={`library-filter-field-${field.key}`}
              >
                {field.fieldType === 'text' ? (
                  <LibraryLabelFilterCombobox
                    fieldKey={field.key}
                    label={field.label}
                    value={fieldFilterValueForKey(filters.fieldFilters, field.key)}
                    onChange={(next) => { onFieldFilterChange(field.key, next); }}
                  />
                ) : (
                  <>
                    <label className="filter-label" htmlFor={`library-field-filter-${field.key}`}>
                      {field.label}
                    </label>
                    <Input
                      id={`library-field-filter-${field.key}`}
                      type={field.fieldType === 'date' ? 'date' : 'text'}
                      value={fieldFilterValueForKey(filters.fieldFilters, field.key)}
                      onChange={(e) => { onFieldFilterChange(field.key, e.target.value); }}
                    />
                  </>
                )}
              </div>
            ))}
            <div className="filter-group filter-group-labels">
              <LibraryTagFilterCombobox
                tags={tags}
                activeTagIds={activeTagIds}
                onToggleTag={onToggleLabelFilter}
              />
              <p className="muted filter-hint">{t('library.filter.labelsAndHint')}</p>
            </div>
            <div className="filter-group filter-group-status">
              <span className="filter-label">{t('library.filter.status')}</span>
              <Select
                className="filter-status-select"
                value={filters.status ?? ''}
                aria-label={t('library.filter.status')}
                placeholder={t('library.filter.statusAll')}
                options={[
                  { value: '', label: t('library.filter.statusAll') },
                  ...statusOptions.map((status) => ({
                    value: status,
                    label: documentStatusLabel(status),
                  })),
                ]}
                onChange={(next) => {
                  onToggleFilter({ status: parseDocumentStatusFilterValue(next) });
                }}
              />
            </div>
          </>
        )}
      </div>
    </aside>
  );
}
