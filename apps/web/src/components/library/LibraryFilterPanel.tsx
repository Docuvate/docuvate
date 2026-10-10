// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { DocumentListQuery, DocumentStatus, TagDto } from '@docuvate/contracts';
import { Filter, Inbox } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import type { DocumentFilterParseIssue } from '../../lib/documentFilterQuery';
import { documentStatusLabel, parseDocumentStatusFilterValue } from '../../lib/documentStatusLabel';
import type { LibraryFilterMode } from '../../lib/libraryFilterMode';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';

const ICON_SIZE = 18;
const ICON_STROKE = 1.75;

interface LibraryFilterPanelProps {
  filters: DocumentListQuery;
  tags: TagDto[];
  statusOptions: DocumentStatus[];
  onToggleFilter: (patch: Partial<DocumentListQuery>) => void;
  onToggleLabelFilter: (tagId: string) => void;
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
  statusOptions,
  onToggleFilter,
  onToggleLabelFilter,
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

  return (
    <aside className="filter-panel" aria-label={t('library.filter.panelAria')}>
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
        <div className="filter-mode-switch" role="group" aria-label={t('library.filter.modeAria')}>
          <button
            type="button"
            className={`filter-mode-btn${filterMode === 'ui' ? ' filter-mode-btn-active' : ''}`}
            aria-pressed={filterMode === 'ui'}
            onClick={() => { onFilterModeChange('ui'); }}
          >
            {t('library.filter.modeUi')}
          </button>
          <button
            type="button"
            className={`filter-mode-btn${filterMode === 'query' ? ' filter-mode-btn-active' : ''}`}
            aria-pressed={filterMode === 'query'}
            onClick={() => { onFilterModeChange('query'); }}
          >
            {t('library.filter.modeQuery')}
          </button>
        </div>

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
            <div className="filter-group filter-group-labels">
              <span className="filter-label">{t('nav.labels')}</span>
              <p className="muted filter-hint">{t('library.filter.labelsAndHint')}</p>
              {tags
                .filter((tag) => !tag.isInbox)
                .map((tag) => (
                  <button
                    key={tag.id}
                    type="button"
                    className={`filter-chip filter-chip-label${activeTagIds.has(tag.id) ? ' filter-chip-active' : ''}`}
                    onClick={() => { onToggleLabelFilter(tag.id); }}
                  >
                    {tag.name}
                  </button>
                ))}
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
