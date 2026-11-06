// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Plug } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router-dom';

import { AppRibbon, RibbonGroup } from '../components/layout/AppRibbon';
import { LibraryFilterDrawer } from '../components/library/LibraryFilterDrawer';
import { LibraryFilterPanel } from '../components/library/LibraryFilterPanel';
import { LibrarySavedViewsMenu } from '../components/library/LibrarySavedViewsMenu';
import { LibraryViewSwitcher } from '../components/library/LibraryViewSwitcher';
import { SaveViewDialog } from '../components/library/SaveViewDialog';
import { LibraryExportMenu, LibraryStageTabs, usePipelineOverview } from '../components/pipeline';
import { useToastNotify } from '../components/save/ToastProvider';
import { Select } from '../components/ui/Select';
import { DocumentUploadProvider } from '../components/upload/DocumentUploadProvider';
import { UploadFileTrigger } from '../components/upload/UploadFileTrigger';
import { UploadDropzone } from '../components/UploadDropzone';
import { resolveLibraryDropTarget } from '../lib/documentUploadAssignment';
import { countLibraryActiveFilters } from '../lib/libraryActiveFilterCount';
import { librarySortSelectOptions, parseLibrarySortSelectValue } from '../lib/librarySortOptions';
import { routes } from '../lib/routes';
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
    const sync = () => {
      setNarrowFilters(mq.matches);
    };
    sync();
    mq.addEventListener('change', sync);
    return () => {
      mq.removeEventListener('change', sync);
    };
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

  const [overviewKey, setOverviewKey] = useState(0);
  const overview = usePipelineOverview(overviewKey);

  const onUploaded = () => {
    void data.load();
    void data.loadTaxonomy();
    setOverviewKey((key) => key + 1);
  };

  const pipelineLead = t('pipeline.library.lead');
  const subtitle = data.filters.withoutNonInboxLabel
    ? t('library.withoutLabelFilter')
    : data.activeLabelNames.length > 0
      ? t('library.labelFilter', { labels: data.activeLabelNames.join(' + ') })
      : data.hasDocuments
        ? pipelineLead
        : t('library.hintEmpty');

  return (
    <DocumentUploadProvider dropTarget={dropTarget} onUploaded={onUploaded}>
      <div className="page library-page" data-ux="page">
        <AppRibbon>
          <RibbonGroup label={t('ribbon.capture')}>
            <UploadFileTrigger variant="primary" size="sm" />
            <Link
              to={routes.settingsConnectors}
              className="ribbon-link"
              aria-label={t('pipeline.library.importSources')}
            >
              <Plug size={14} strokeWidth={1.75} aria-hidden />
              <span className="ribbon-link-label">{t('pipeline.library.importSources')}</span>
            </Link>
          </RibbonGroup>
          <RibbonGroup label={t('ribbon.display')}>
            <div className="library-toolbar">
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
              <LibrarySavedViewsMenu
                onSaveView={() => {
                  setSaveViewOpen(true);
                }}
                onUpdateActiveView={
                  data.activeViewId
                    ? () => {
                        void data
                          .updateActiveSavedView()
                          .then(() => {
                            pushSuccess(t('common.saved'));
                          })
                          .catch((err: unknown) => {
                            pushError(err instanceof Error ? err.message : t('errors.generic'));
                          });
                      }
                    : undefined
                }
              />
            </div>
          </RibbonGroup>
          <RibbonGroup label={t('ribbon.output')}>
            <LibraryExportMenu
              busy={data.exportBusy}
              disabled={!data.hasDocuments}
              selectedCount={data.bulkSelectedCount}
              onExport={(format) => {
                void data.exportFieldValues(format);
              }}
            />
          </RibbonGroup>
        </AppRibbon>
        <header className="page-header library-page-header">
          <div className="library-page-heading">
            <h1 data-ux="page-title">{data.activeViewName ?? data.pageTitle}</h1>
            {data.activeViewName ? (
              <p className="muted">
                {t('savedViews.activeViewLead', { name: data.activeViewName })}
              </p>
            ) : subtitle ? (
              <p
                className={`muted${data.hasDocuments && subtitle === pipelineLead ? ' library-page-lead' : ''}`}
              >
                {subtitle}
              </p>
            ) : null}
          </div>
        </header>

        <LibraryStageTabs
          filters={data.filters}
          overview={overview}
          onSelect={(patch) => {
            data.toggleFilter(patch);
          }}
        />

        <UploadDropzone compact={data.hasDocuments} showBar={false} />

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
                onToggle: () => {
                  setFiltersOpen((open) => !open);
                },
                buttonRef: filterToggleRef,
              }}
            />
          </div>
        </div>

        {narrowFilters ? (
          <LibraryFilterDrawer
            open={filtersOpen}
            onClose={() => {
              setFiltersOpen(false);
            }}
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

        <SaveViewDialog
          open={saveViewOpen}
          onClose={() => {
            setSaveViewOpen(false);
          }}
          data={data}
        />
      </div>
    </DocumentUploadProvider>
  );
}
