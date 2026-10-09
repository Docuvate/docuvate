// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { UploadDropzone } from '../components/UploadDropzone';
import { DocumentUploadProvider } from '../components/upload/DocumentUploadProvider';
import { LibraryFilterDrawer } from '../components/library/LibraryFilterDrawer';
import { LibraryFilterPanel } from '../components/library/LibraryFilterPanel';
import { LibraryViewSwitcher } from '../components/library/LibraryViewSwitcher';
import { Select } from '../components/ui/Select';
import { resolveLibraryDropTarget } from '../lib/documentUploadAssignment';
import { librarySortSelectOptions } from '../lib/librarySortOptions';
import { LibraryPageDocumentSection } from './library/LibraryPageDocumentSection';
import { useLibraryDocumentContextMenu } from './library/useLibraryDocumentContextMenu';
import { countLibraryActiveFilters } from '../lib/libraryActiveFilterCount';
import { useLibraryPageData } from './library/useLibraryPageData';
import { SaveViewDialog } from '../components/library/SaveViewDialog';
import { Button } from '../components/ui/Button';
import { useToastNotify } from '../components/save/ToastProvider';
import { Link } from 'react-router-dom';
import { routes } from '../lib/routes';

export function LibraryPage() {
  const mode = 'all' as const;
  const { t } = useTranslation();
  const { folderId, mappeId } = useParams<{ folderId?: string; mappeId?: string }>();
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
    const sync = () => setNarrowFilters(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);
  const sortOptions = useMemo(() => librarySortSelectOptions(t), [t]);
  const activeFilterCount = useMemo(() => countLibraryActiveFilters(data.filters), [data.filters]);

  const dropTarget = useMemo(
    () =>
      resolveLibraryDropTarget({
        mode,
        folderId,
        mappeId,
        filters: data.filters,
        folders: data.folders,
      }),
    [mode, folderId, mappeId, data.filters, data.folders]
  );

  const onUploaded = () => {
    void data.load();
    void data.loadTaxonomy();
  };

  const subtitle = data.filters.withoutNonInboxLabel
    ? t('library.withoutLabelFilter')
    : data.activeLabelNames.length > 0
      ? t('library.labelFilter', { labels: data.activeLabelNames.join(' + ') })
      : (data.mappeSubtitle ?? (data.hasDocuments ? '' : t('library.hintEmpty')));

  return (
    <DocumentUploadProvider dropTarget={dropTarget} onUploaded={onUploaded}>
      <div className="page library-page" data-ux="page">
        <header className="page-header">
          <div>
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
            <Button type="button" variant="secondary" onClick={() => setSaveViewOpen(true)}>
              {t('savedViews.saveAction')}
            </Button>
            {data.activeViewId ? (
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  void data
                    .updateActiveSavedView()
                    .then(() => pushSuccess(t('common.saved')))
                    .catch((err) =>
                      pushError(err instanceof Error ? err.message : t('errors.generic'))
                    );
                }}
              >
                {t('savedViews.updateFromFilters')}
              </Button>
            ) : null}
            <Link className="btn btn-secondary" to={routes.savedViews}>
              {t('savedViews.manageNav')}
            </Link>
            <LibraryViewSwitcher value={data.viewMode} onChange={data.onViewModeChange} />
            <Select
              value={`${data.filters.sort ?? 'updatedAt'}:${data.filters.order ?? 'desc'}`}
              onChange={(value) => {
                const [sort, order] = value.split(':') as [
                  NonNullable<typeof data.filters.sort>,
                  'asc' | 'desc',
                ];
                data.toggleFilter({ sort, order });
              }}
              options={[...sortOptions]}
              aria-label={t('library.sortLabel')}
            />
          </div>
        </header>

        <UploadDropzone compact={data.hasDocuments} />

        <div className={`library-layout${filtersOpen ? ' library-layout--filters-open' : ''}`}>
          {!narrowFilters ? (
            <LibraryFilterPanel
              filters={data.filters}
              tags={data.tags}
              statusOptions={data.statusOptions}
              onToggleFilter={data.toggleFilter}
              onToggleLabelFilter={data.toggleLabelFilter}
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
                onToggle: () => setFiltersOpen((open) => !open),
                buttonRef: filterToggleRef,
              }}
            />
          </div>
        </div>

        {narrowFilters ? (
          <LibraryFilterDrawer
            open={filtersOpen}
            onClose={() => setFiltersOpen(false)}
            returnFocusRef={filterToggleRef as RefObject<HTMLElement>}
          >
            <LibraryFilterPanel
              filters={data.filters}
              tags={data.tags}
              statusOptions={data.statusOptions}
              onToggleFilter={data.toggleFilter}
              onToggleLabelFilter={data.toggleLabelFilter}
              filterMode={data.filterMode}
              onFilterModeChange={data.setFilterMode}
              filterQueryText={data.filterQueryText}
              onFilterQueryTextChange={data.setFilterQueryText}
              onApplyFilterQuery={data.applyFilterQueryText}
              filterParseIssues={data.filterParseIssues}
            />
          </LibraryFilterDrawer>
        ) : null}

        <SaveViewDialog open={saveViewOpen} onClose={() => setSaveViewOpen(false)} data={data} />
      </div>
    </DocumentUploadProvider>
  );
}
