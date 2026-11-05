// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';

import { LibraryFilterDrawer } from '../components/library/LibraryFilterDrawer';
import { LibraryFilterPanel } from '../components/library/LibraryFilterPanel';
import { LibrarySavedViewsMenu } from '../components/library/LibrarySavedViewsMenu';
import { LibraryViewSwitcher } from '../components/library/LibraryViewSwitcher';
import { SaveViewDialog } from '../components/library/SaveViewDialog';
import { useToastNotify } from '../components/save/ToastProvider';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { DocumentUploadProvider } from '../components/upload/DocumentUploadProvider';
import { UploadDropzone } from '../components/UploadDropzone';
import { resolveLibraryDropTarget } from '../lib/documentUploadAssignment';
import { countLibraryActiveFilters } from '../lib/libraryActiveFilterCount';
import { librarySortSelectOptions, parseLibrarySortSelectValue } from '../lib/librarySortOptions';
import { LibraryPageDocumentSection } from './library/LibraryPageDocumentSection';
import { useLibraryDocumentContextMenu } from './library/useLibraryDocumentContextMenu';
import { useLibraryPageData } from './library/useLibraryPageData';

export function LibraryPage() {
  const mode = 'all' as const;
  const { t } = useTranslation();
  const { folderId } = useParams<{ folderId?: string }>();
  const data = useLibraryPageData(mode);
  const { pushSuccess, pushError } = useToastNotify();
  const ctx = useLibraryDocumentContextMenu(data);
  const filterToggleRef = useRef<HTMLButtonElement | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(min-width: 1280px)').matches
  );
  const [saveViewOpen, setSaveViewOpen] = useState(false);
  const [narrowFilters, setNarrowFilters] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(max-width: 1279px)').matches
  );

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1279px)');
    const sync = () => { setNarrowFilters(mq.matches); };
    sync();
    mq.addEventListener('change', sync);
    return () => { mq.removeEventListener('change', sync); };
  }, []);
  const sortOptions = useMemo(() => librarySortSelectOptions(t), [t]);
  const activeFilterCount = useMemo(() => countLibraryActiveFilters(data.filters), [data.filters]);

  const dropTarget = useMemo(
    () =>
      resolveLibraryDropTarget({
        mode,
        folderId,
        filters: data.filters,
        folders: data.folders,
      }),
    [mode, folderId, data.filters, data.folders]
  );

  const onUploaded = () => {
    void data.load();
    void data.loadTaxonomy();
  };

  const subtitle = data.filters.withoutNonInboxLabel
    ? t('library.withoutLabelFilter')
    : data.activeLabelNames.length > 0
      ? t('library.labelFilter', { labels: data.activeLabelNames.join(' + ') })
      : data.hasDocuments
        ? ''
        : t('library.hintEmpty');

  return (
    <DocumentUploadProvider dropTarget={dropTarget} onUploaded={onUploaded}>
      <div className="page library-page" data-ux="page">
        <header className="page-header library-page-header">
          <div className="library-page-heading">
            <h1 data-ux="page-title">{data.activeViewName ?? data.pageTitle}</h1>
            {data.activeViewName ? (
              <p className="muted">
                {t('savedViews.activeViewLead', { name: data.activeViewName })}
              </p>
            ) : subtitle ? (
              <p className="muted">{subtitle}</p>
            ) : null}
          </div>
          <div className="library-toolbar">
            <LibrarySavedViewsMenu
              onSaveView={() => { setSaveViewOpen(true); }}
              onUpdateActiveView={
                data.activeViewId
                  ? () => {
                      void data
                        .updateActiveSavedView()
                        .then(() => { pushSuccess(t('common.saved')); })
                        .catch((err: unknown) => { pushError(err instanceof Error ? err.message : t('errors.generic')); });
                    }
                  : undefined
              }
            />
            <LibraryViewSwitcher value={data.viewMode} onChange={data.onViewModeChange} />
            <Select
              className="library-toolbar-sort"
              value={`${data.filters.sort ?? 'updatedAt'}:${data.filters.order ?? 'desc'}`}
              onChange={(value) => {
                const { sort, order } = parseLibrarySortSelectValue(value);
                data.toggleFilter({ sort, order });
              }}
              options={[...sortOptions]}
              aria-label={t('library.sortLabel')}
            />
            <Button
              type="button"
              variant="secondary"
              className="library-export-btn"
              disabled={data.exportBusy || !data.hasDocuments}
              onClick={() => {
                void data.exportFieldValues('csv');
              }}
            >
              {data.exportBusy ? t('library.exportFieldValuesPending') : t('library.exportFieldValuesCsv')}
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="library-export-btn"
              disabled={data.exportBusy || !data.hasDocuments}
              onClick={() => {
                void data.exportFieldValues('json');
              }}
            >
              {data.exportBusy ? t('library.exportFieldValuesPending') : t('library.exportFieldValuesJson')}
            </Button>
          </div>
        </header>

        <UploadDropzone compact={data.hasDocuments} />

        <div
          className={`library-layout${filtersOpen ? ' library-layout--filters-open' : ''}${narrowFilters ? ' library-layout--drawer-filters' : ''}`}
        >
          {!narrowFilters ? (
            <LibraryFilterPanel
              filters={data.filters}
              filterableFields={data.filterableFields}
              statusOptions={data.statusOptions}
              onToggleFilter={data.toggleFilter}
              onToggleLabelFilter={data.toggleLabelFilter}
              onFieldFilterChange={data.setFieldFilter}
              filterMode={data.filterMode}
              onFilterModeChange={data.setFilterMode}
              filterQueryText={data.filterQueryText}
              onFilterQueryTextChange={data.setFilterQueryText}
              onApplyFilterQuery={data.applyFilterQueryText}
              filterParseIssues={data.filterParseIssues}
            />
          ) : null}

          <div className="library-main">
            <LibraryPageDocumentSection
              data={data}
              ctx={ctx}
              filterToggle={{
                expanded: filtersOpen,
                activeCount: activeFilterCount,
                onToggle: () => { setFiltersOpen((open) => !open); },
                buttonRef: filterToggleRef,
              }}
            />
          </div>
        </div>

        {narrowFilters ? (
          <LibraryFilterDrawer
            open={filtersOpen}
            onClose={() => { setFiltersOpen(false); }}
            returnFocusRef={filterToggleRef}
          >
            <LibraryFilterPanel
              filters={data.filters}
              filterableFields={data.filterableFields}
              statusOptions={data.statusOptions}
              onToggleFilter={data.toggleFilter}
              onToggleLabelFilter={data.toggleLabelFilter}
              onFieldFilterChange={data.setFieldFilter}
              filterMode={data.filterMode}
              onFilterModeChange={data.setFilterMode}
              filterQueryText={data.filterQueryText}
              onFilterQueryTextChange={data.setFilterQueryText}
              onApplyFilterQuery={data.applyFilterQueryText}
              filterParseIssues={data.filterParseIssues}
            />
          </LibraryFilterDrawer>
        ) : null}

        <SaveViewDialog open={saveViewOpen} onClose={() => { setSaveViewOpen(false); }} data={data} />
      </div>
    </DocumentUploadProvider>
  );
}
