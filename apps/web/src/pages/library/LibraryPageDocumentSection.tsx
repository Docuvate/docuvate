import type { ReactNode, RefObject } from 'react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { DuplicateStackReviewDialog } from '../../components/library/DuplicateStackReviewDialog';
import { LibraryBulkBar } from '../../components/library/LibraryBulkBar';
import { LibraryDocumentGrid } from '../../components/library/LibraryDocumentGrid';
import { LibraryDocumentTable } from '../../components/library/LibraryDocumentTable';
import { LibraryFocusView } from '../../components/library/LibraryFocusView';
import { LibraryViewSwitcher } from '../../components/library/LibraryViewSwitcher';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { ContextMenu } from '../../components/ui/ContextMenu';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { librarySortSelectOptions } from '../../lib/librarySortOptions';
import type { useLibraryDocumentContextMenu } from './useLibraryDocumentContextMenu';
import type { useLibraryPageData } from './useLibraryPageData';

type LibraryData = ReturnType<typeof useLibraryPageData>;
type LibraryContext = ReturnType<typeof useLibraryDocumentContextMenu>;

interface LibraryFilterToggleProps {
  expanded: boolean;
  activeCount: number;
  onToggle: () => void;
  buttonRef?: RefObject<HTMLButtonElement>;
}

interface LibraryPageDocumentSectionProps {
  data: LibraryData;
  ctx: LibraryContext;
  enableDocumentDrag?: boolean;
  emptyStateOverride?: ReactNode;
  filterToggle?: LibraryFilterToggleProps;
  /**
   * Ordner view: hide redundant folder column (`hideFolderColumn` only).
   * Shared table column layout/responsive rules live in #80 — do not add here.
   */
  filesystemLayout?: boolean;
}

export function LibraryPageDocumentSection({
  data,
  ctx,
  enableDocumentDrag,
  emptyStateOverride,
  filterToggle,
  filesystemLayout = false,
}: LibraryPageDocumentSectionProps) {
  const { t } = useTranslation();
  const sortOptions = useMemo(() => librarySortSelectOptions(t), [t]);
  const filterToggleLabel = filterToggle
    ? filterToggle.expanded
      ? t('library.filterToggleCollapse')
      : filterToggle.activeCount > 0
        ? t('library.filterToggleActive', { count: filterToggle.activeCount })
        : t('library.filterToggle')
    : null;
  const showBulkBar = data.visibleSelectedCount > 0 || (!data.loading && data.items.length > 0);
  const showTableArea =
    data.loading || data.items.length > 0 || (data.viewMode !== 'klassisch' && !data.error);

  return (
    <>
      <Card
        className={[
          data.viewMode === 'fokus' ? 'library-main-card-focus' : '',
          filesystemLayout
            ? 'library-main-card-filesystem library-doc-table-card'
            : 'library-doc-table-card',
        ]
          .filter(Boolean)
          .join(' ') || undefined}
      >
        <div className={`library-list-toolbar${filesystemLayout ? ' library-list-toolbar-filesystem' : ''}`}>
          <form
            onSubmit={(e) => void data.onSearch(e)}
            className={`search-row library-list-search${filterToggle ? ' library-search-row' : ''}`}
          >
            <Input
              placeholder={t('library.searchPlaceholder')}
              value={data.query}
              onChange={(e) => data.setQuery(e.target.value)}
              aria-label={t('library.searchDocsAria')}
            />
            {filterToggle && filterToggleLabel ? (
              <Button
                ref={filterToggle.buttonRef ?? undefined}
                type="button"
                variant="secondary"
                className="library-filter-toggle"
                aria-expanded={filterToggle.expanded}
                onClick={filterToggle.onToggle}
              >
                {filterToggleLabel}
              </Button>
            ) : null}
            <Button type="submit" variant="secondary">
              {t('shell.search')}
            </Button>
          </form>
          {filesystemLayout ? (
            <div className="library-list-toolbar-controls">
              <LibraryViewSwitcher
                value={data.viewMode}
                onChange={data.onViewModeChange}
                variant="segmented"
              />
              <Select
                className="library-toolbar-sort-select"
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
          ) : null}
        </div>

        {showBulkBar ? (
          <LibraryBulkBar
            selectedCount={data.visibleSelectedCount}
            showIdleHint={!data.loading && data.items.length > 0 && data.visibleSelectedCount === 0}
            bulkBusy={data.bulkBusy}
            selectedIds={[...data.selected]}
            items={data.items}
            tags={data.tags}
            folders={data.folders}
            mappen={data.mappen}
            onRunBulk={(action) => void data.runBulk(action)}
            onRequestBulkDelete={ctx.requestBulkDelete}
            onClearSelection={data.clearSelection}
          />
        ) : null}

        {data.error ? (
          <p className="error" role="alert">
            {data.error}
          </p>
        ) : null}

        {!data.loading && !data.error && data.items.length === 0
          ? emptyStateOverride ?? (
              <div className="empty-state">
                <h2>{t('library.emptyTitle')}</h2>
                <p className="muted">{t('library.emptyHint')}</p>
              </div>
            )
          : null}

        {showTableArea ? (
          <div
            className="library-documents-panel"
            aria-busy={data.loading}
            aria-live="polite"
          >
            {data.loading ? (
              <div className="library-table-loading" role="status">
                <span className="library-table-loading-spinner" aria-hidden />
                <span className="sr-only">{t('library.loadingDocs')}</span>
              </div>
            ) : null}

            {data.viewMode === 'klassisch' ? (
              <LibraryDocumentTable
                items={data.items}
                selected={data.selected}
                onToggleSelect={data.toggleSelect}
                onToggleSelectAll={data.toggleSelectAll}
                onSort={data.setSort}
                onRefresh={() => {
                  void data.load();
                }}
                onContextMenu={ctx.openDocumentContextMenu}
                onRowMenu={ctx.openDocumentContextMenuFromRowAction}
                onContextMenuKeyboard={ctx.openDocumentContextMenuFromKeyboard}
                contextMenuDocumentId={ctx.contextMenu?.documentId ?? null}
                onReviewStack={(primaryId, versionId) =>
                  ctx.setStackReview({ primaryId, versionId: versionId ?? null })
                }
                enableDocumentDrag={enableDocumentDrag}
                hideFolderColumn={filesystemLayout}
                suppressFolderFallbackForId={
                  filesystemLayout ? data.activeFolderId : undefined
                }
              />
            ) : null}
            {data.viewMode === 'karten' ? (
              <LibraryDocumentGrid
                items={data.items}
                selected={data.selected}
                onToggleSelect={data.toggleSelect}
                onContextMenu={ctx.openDocumentContextMenu}
              />
            ) : null}
            {data.viewMode === 'fokus' ? (
              <LibraryFocusView
                items={data.items}
                selected={data.selected}
                onToggleSelect={data.toggleSelect}
                onContextMenu={ctx.openDocumentContextMenu}
              />
            ) : null}
          </div>
        ) : null}
      </Card>

      <ContextMenu
        open={ctx.contextMenu != null && ctx.contextMenuItems.length > 0}
        x={ctx.contextMenu?.x ?? 0}
        y={ctx.contextMenu?.y ?? 0}
        title={ctx.contextMenuTitle}
        items={ctx.contextMenuItems}
        anchorRef={ctx.contextMenuAnchorRef}
        onClose={ctx.closeContextMenu}
      />

      {ctx.stackReview ? (
        <DuplicateStackReviewDialog
          key={`${ctx.stackReview.primaryId}:${ctx.stackReview.versionId ?? ''}`}
          primaryDocumentId={ctx.stackReview.primaryId}
          initialVersionId={ctx.stackReview.versionId}
          onClose={() => ctx.setStackReview(null)}
          onChanged={() => {
            void data.load();
          }}
        />
      ) : null}

      <ConfirmDialog
        open={ctx.bulkDeleteConfirmCount != null}
        title={t('library.bulkDeleteTitle')}
        description={t('library.bulkDeleteDescription', {
          count: ctx.bulkDeleteConfirmCount ?? 0,
        })}
        confirmLabel={t('common.deletePermanently')}
        cancelLabel={t('common.cancel')}
        tone="danger"
        busy={data.bulkBusy}
        onCancel={ctx.cancelBulkDeleteConfirm}
        onConfirm={() => void ctx.confirmBulkDelete()}
      />
    </>
  );
}
