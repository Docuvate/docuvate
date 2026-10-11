// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import {
  type DragEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate, useParams } from 'react-router-dom';

import { AddExistingDocumentsDialog } from '../components/ordner/AddExistingDocumentsDialog';
import { DateisystemFolderEmptyState } from '../components/ordner/DateisystemFolderEmptyState';
import { DateisystemRootOverview } from '../components/ordner/DateisystemRootOverview';
import { FolderExplorerTree } from '../components/ordner/FolderExplorerTree';
import { FolderTargetPickerDialog } from '../components/ordner/FolderTargetPickerDialog';
import {
  DocumentUploadProvider,
  useDocumentUploadContext,
} from '../components/upload/DocumentUploadProvider';
import { UploadQueueList } from '../components/upload/UploadQueueList';
import { bulkDocuments, createFolder, createMappe, deleteFolder, updateFolder } from '../lib/api';
import { formatUserFacingError } from '../lib/apiErrors';
import { dateisystemSidebarWidthStyle } from '../lib/cssCustomProperties';
import { isDocumentDrag, readDocumentDragIds } from '../lib/documentDnD';
import {
  type DocumentUploadAssignment,
  resolveFilesystemDropTarget,
} from '../lib/documentUploadAssignment';
import { isFileDrag } from '../lib/documentUploadConstants';
import {
  buildOrdnerBreadcrumbs,
  childFolders,
  findFolder,
  findMappe,
  type OrdnerSelection,
  pickDefaultFilesystemHref,
} from '../lib/ordnerTree';
import { DateisystemContentHeader } from './dateisystem/DateisystemContentHeader';
import { useResponsiveSidebarWidth } from './dateisystem/useResponsiveSidebarWidth';
import { LibraryPageDocumentSection } from './library/LibraryPageDocumentSection';
import { useLibraryDocumentContextMenu } from './library/useLibraryDocumentContextMenu';
import { useLibraryPageData } from './library/useLibraryPageData';

interface DateisystemExplorerPageProps {
  browseMode: 'root' | 'mappe' | 'folder';
}

const SIDEBAR_WIDTH_KEY = 'docuvate.dateisystem.sidebarWidth';
const SIDEBAR_MIN = 220;
const SIDEBAR_MAX = 420;
const SIDEBAR_DEFAULT = 280;

export function DateisystemExplorerPage({ browseMode }: DateisystemExplorerPageProps) {
  const libraryMode = browseMode === 'root' ? 'ordner-root' : browseMode;
  const data = useLibraryPageData(libraryMode);

  const [treeQuery, setTreeQuery] = useState('');
  const [treeError, setTreeError] = useState<string | null>(null);
  const [uploadOverride, setUploadOverride] = useState<DocumentUploadAssignment | null>(null);
  const [folderPickerOpen, setFolderPickerOpen] = useState(false);
  const [addExistingTarget, setAddExistingTarget] = useState<{
    folderId: string;
    label: string;
  } | null>(null);
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const stored = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    const parsed = stored ? Number(stored) : NaN;
    return Number.isFinite(parsed) ? parsed : SIDEBAR_DEFAULT;
  });
  const resizeRef = useRef<{ startX: number; startWidth: number } | null>(null);
  const responsiveSidebarWidth = useResponsiveSidebarWidth(sidebarWidth);

  const { mappeId: routeMappeId, folderId: routeFolderId } = useParams<{
    mappeId?: string;
    folderId?: string;
  }>();

  const selection: OrdnerSelection =
    browseMode === 'mappe' && routeMappeId
      ? { kind: 'mappe', mappeId: routeMappeId }
      : browseMode === 'folder' && routeFolderId
        ? { kind: 'folder', folderId: routeFolderId }
        : { kind: 'root' };

  const defaultHref = useMemo(
    () => pickDefaultFilesystemHref(data.mappen, data.folders),
    [data.mappen, data.folders]
  );

  const dropTarget = useMemo(
    () =>
      resolveFilesystemDropTarget({
        browseMode,
        folderId: routeFolderId,
        mappeId: routeMappeId,
        folders: data.folders,
        mappen: data.mappen,
        assignmentOverride: uploadOverride,
      }),
    [browseMode, routeFolderId, routeMappeId, data.folders, data.mappen, uploadOverride]
  );

  const refreshTree = useCallback(async () => {
    await data.loadTaxonomy();
  }, [data]);

  const onUploaded = useCallback(() => {
    void data.load();
    void refreshTree();
  }, [data, refreshTree]);

  useEffect(() => {
    localStorage.setItem(SIDEBAR_WIDTH_KEY, String(sidebarWidth));
  }, [sidebarWidth]);

  useEffect(() => {
    function onMove(event: MouseEvent) {
      if (!resizeRef.current) return;
      const delta = event.clientX - resizeRef.current.startX;
      const next = Math.min(
        SIDEBAR_MAX,
        Math.max(SIDEBAR_MIN, resizeRef.current.startWidth + delta)
      );
      setSidebarWidth(next);
    }
    function onUp() {
      resizeRef.current = null;
    }
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, []);

  if (browseMode === 'root' && defaultHref) {
    return <Navigate to={defaultHref} replace />;
  }

  return (
    <DocumentUploadProvider dropTarget={dropTarget} onUploaded={onUploaded}>
      <DateisystemExplorerLayout
        browseMode={browseMode}
        selection={selection}
        data={data}
        treeQuery={treeQuery}
        onTreeQueryChange={setTreeQuery}
        treeError={treeError}
        setTreeError={setTreeError}
        sidebarWidth={responsiveSidebarWidth}
        onResizeStart={(event) => {
          resizeRef.current = { startX: event.clientX, startWidth: sidebarWidth };
        }}
        onAdjustSidebarWidth={(delta) => {
          setSidebarWidth((w) => Math.min(SIDEBAR_MAX, Math.max(SIDEBAR_MIN, w + delta)));
        }}
        refreshTree={refreshTree}
        uploadOverride={uploadOverride}
        setUploadOverride={setUploadOverride}
        folderPickerOpen={folderPickerOpen}
        setFolderPickerOpen={setFolderPickerOpen}
        addExistingTarget={addExistingTarget}
        setAddExistingTarget={setAddExistingTarget}
        routeFolderId={routeFolderId}
        routeMappeId={routeMappeId}
      />
    </DocumentUploadProvider>
  );
}

interface ActiveFolderContext {
  label: string;
  folderId?: string;
}

interface LayoutProps {
  browseMode: 'root' | 'mappe' | 'folder';
  selection: OrdnerSelection;
  data: ReturnType<typeof useLibraryPageData>;
  treeQuery: string;
  onTreeQueryChange: (value: string) => void;
  treeError: string | null;
  setTreeError: (value: string | null) => void;
  sidebarWidth: number;
  onResizeStart: (event: React.MouseEvent) => void;
  onAdjustSidebarWidth: (delta: number) => void;
  refreshTree: () => Promise<void>;
  uploadOverride: DocumentUploadAssignment | null;
  setUploadOverride: (value: DocumentUploadAssignment | null) => void;
  folderPickerOpen: boolean;
  setFolderPickerOpen: (open: boolean) => void;
  addExistingTarget: { folderId: string; label: string } | null;
  setAddExistingTarget: (value: { folderId: string; label: string } | null) => void;
  routeFolderId?: string;
  routeMappeId?: string;
}

function DateisystemExplorerLayout({
  browseMode,
  selection,
  data,
  treeQuery,
  onTreeQueryChange,
  treeError,
  setTreeError,
  sidebarWidth,
  onResizeStart,
  onAdjustSidebarWidth,
  refreshTree,
  setUploadOverride,
  folderPickerOpen,
  setFolderPickerOpen,
  addExistingTarget,
  setAddExistingTarget,
  routeFolderId,
  routeMappeId,
}: LayoutProps) {
  const { t } = useTranslation();
  const ctx = useLibraryDocumentContextMenu(data);
  const { enqueueFiles, dropTarget } = useDocumentUploadContext();

  const breadcrumbs = buildOrdnerBreadcrumbs(data.mappen, data.folders, selection);
  const pageTitle =
    browseMode === 'root'
      ? t('filesystem.allFoldersTitle')
      : (breadcrumbs[breadcrumbs.length - 1]?.label ?? t('nav.folders'));
  const showDocuments = browseMode !== 'root';

  const activeFolderTarget = useMemo((): ActiveFolderContext | null => {
    if (browseMode === 'folder' && routeFolderId) {
      const folder = findFolder(data.folders, routeFolderId);
      return folder
        ? { folderId: folder.id, label: folder.name }
        : { folderId: routeFolderId, label: t('common.folder') };
    }
    if (browseMode === 'mappe' && routeMappeId) {
      const mappe = findMappe(data.mappen, routeMappeId);
      const mappeLabel = mappe?.name ?? t('common.folder');
      const roots = childFolders(data.folders, { mappeId: routeMappeId, parentId: null });
      if (roots.length === 1) {
        return { folderId: roots[0].id, label: mappeLabel };
      }
      return { label: mappeLabel };
    }
    if (dropTarget.assignment.kind === 'folder') {
      return {
        folderId: dropTarget.assignment.folderId,
        label: dropTarget.assignment.label,
      };
    }
    if (dropTarget.assignment.kind === 'mappe') {
      return { label: dropTarget.assignment.label };
    }
    return null;
  }, [
    browseMode,
    routeFolderId,
    routeMappeId,
    data.folders,
    data.mappen,
    dropTarget.assignment,
    t,
  ]);

  async function onCreateRootOrdner(name: string) {
    setTreeError(null);
    try {
      await createMappe({ name });
      await refreshTree();
    } catch (err) {
      setTreeError(formatUserFacingError(err, 'filesystem.createRootFailed'));
    }
  }

  async function onCreateChildFolder(args: {
    mappeId: string;
    parentId: string | null;
    name: string;
  }) {
    setTreeError(null);
    try {
      await createFolder({ name: args.name, mappeId: args.mappeId, parentId: args.parentId });
      await refreshTree();
    } catch (err) {
      setTreeError(formatUserFacingError(err, 'filesystem.createChildFailed'));
    }
  }

  async function onRenameFolder(folderId: string, name: string) {
    setTreeError(null);
    try {
      await updateFolder(folderId, { name });
      await refreshTree();
    } catch (err) {
      setTreeError(err instanceof Error ? err.message : t('errors.saveFailed'));
    }
  }

  async function onDeleteFolder(folderId: string) {
    setTreeError(null);
    try {
      await deleteFolder(folderId);
      await refreshTree();
      void data.load();
    } catch (err) {
      setTreeError(err instanceof Error ? err.message : t('errors.deleteFailed'));
    }
  }

  async function onToolbarCreateFolder(name: string) {
    if (selection.kind === 'root') {
      await onCreateRootOrdner(name);
      return;
    }
    if (selection.kind === 'mappe') {
      await onCreateChildFolder({
        mappeId: selection.mappeId,
        parentId: null,
        name,
      });
      return;
    }
    const folder = findFolder(data.folders, selection.folderId);
    if (!folder?.mappeId) {
      setTreeError(t('filesystem.createFolderNoContainer'));
      return;
    }
    await onCreateChildFolder({
      mappeId: folder.mappeId,
      parentId: folder.id,
      name,
    });
  }

  async function onMoveDocumentsToFolder(folderId: string, documentIds: string[]) {
    if (documentIds.length === 0) return;
    try {
      await bulkDocuments({ ids: documentIds, bulk: { action: 'setFolder', folderId } });
      void data.load();
      await refreshTree();
    } catch (err) {
      setTreeError(err instanceof Error ? err.message : t('errors.actionFailed'));
    }
  }

  function onUploadFilesToFolder(folderId: string, files: FileList) {
    const folder = findFolder(data.folders, folderId);
    const label = folder?.name ?? t('common.folder');
    const assignment: DocumentUploadAssignment = { kind: 'folder', folderId, label };
    setUploadOverride(assignment);
    enqueueFiles(files, assignment);
  }

  function onContentDrop(event: DragEvent) {
    if (!showDocuments || !dropTarget.enabled) return;
    if (isFileDrag(event.dataTransfer) && event.dataTransfer.files.length) {
      event.preventDefault();
      enqueueFiles(event.dataTransfer.files, dropTarget.assignment);
      return;
    }
    if (isDocumentDrag(event.dataTransfer) && activeFolderTarget?.folderId) {
      event.preventDefault();
      const ids = readDocumentDragIds(event.dataTransfer);
      void onMoveDocumentsToFolder(activeFolderTarget.folderId, ids);
    }
  }

  function onContentDragOver(event: DragEvent) {
    if (!showDocuments || !dropTarget.enabled) return;
    if (isFileDrag(event.dataTransfer) || isDocumentDrag(event.dataTransfer)) {
      event.preventDefault();
    }
  }

  const folderEmpty =
    showDocuments &&
    !data.loading &&
    !data.error &&
    data.items.length === 0 &&
    activeFolderTarget ? (
      <DateisystemFolderEmptyState
        folderLabel={activeFolderTarget.label}
        onAddExisting={() => {
          if (!activeFolderTarget.folderId) return;
          setAddExistingTarget({
            folderId: activeFolderTarget.folderId,
            label: activeFolderTarget.label,
          });
        }}
        uploadDisabledTitle={dropTarget.enabled ? undefined : t('filesystem.uploadPickFolderFirst')}
        onRequestUploadTarget={() => { setFolderPickerOpen(true); }}
      />
    ) : null;

  return (
    <div className="page dateisystem-page" data-ux="page">
      {treeError ? (
        <p className="error dateisystem-page-error" role="alert">
          {treeError}
        </p>
      ) : null}

      <div
        className="dateisystem-shell"
        style={dateisystemSidebarWidthStyle(sidebarWidth)}
      >
        <aside className="dateisystem-sidebar" aria-label={t('filesystem.treePanelAria')}>
          <div className="dateisystem-sidebar-head">
            <h2 className="dateisystem-sidebar-title">{t('nav.folders')}</h2>
          </div>
          <FolderExplorerTree
            mappen={data.mappen}
            folders={data.folders}
            selection={{
              mappeId: selection.kind === 'mappe' ? selection.mappeId : undefined,
              folderId: selection.kind === 'folder' ? selection.folderId : undefined,
            }}
            treeQuery={treeQuery}
            onTreeQueryChange={onTreeQueryChange}
            onCreateRootOrdner={onCreateRootOrdner}
            onCreateChildFolder={onCreateChildFolder}
            onRenameFolder={onRenameFolder}
            onDeleteFolder={onDeleteFolder}
            onAddDocuments={(target) => { setAddExistingTarget(target); }}
            onMoveDocumentsToFolder={onMoveDocumentsToFolder}
            onUploadFilesToFolder={onUploadFilesToFolder}
          />
        </aside>

        <button
          type="button"
          className="dateisystem-split-handle"
          aria-label={t('filesystem.resizeSidebar')}
          onMouseDown={onResizeStart}
          onKeyDown={(event) => {
            if (event.key === 'ArrowLeft') {
              event.preventDefault();
              onAdjustSidebarWidth(-16);
            } else if (event.key === 'ArrowRight') {
              event.preventDefault();
              onAdjustSidebarWidth(16);
            }
          }}
        />

        <section className="dateisystem-content-pane" aria-label={t('filesystem.contentPaneAria')}>
          <DateisystemContentHeader
            breadcrumbs={breadcrumbs}
            pageTitle={pageTitle}
            showDocuments={showDocuments}
            onCreateFolder={onToolbarCreateFolder}
            onAddExistingDocuments={
              activeFolderTarget?.folderId
                ? () => {
                    const folderId = activeFolderTarget.folderId;
                    if (!folderId) return;
                    setAddExistingTarget({
                      folderId,
                      label: activeFolderTarget.label,
                    });
                  }
                : undefined
            }
            uploadDisabledTitle={
              dropTarget.enabled ? undefined : t('filesystem.uploadPickFolderFirst')
            }
            onRequestUploadTarget={() => { setFolderPickerOpen(true); }}
          />

          <div
            className="dateisystem-content-body"
            onDrop={onContentDrop}
            onDragOver={onContentDragOver}
          >
            {browseMode === 'root' ? (
              <DateisystemRootOverview
                mappen={data.mappen}
                folders={data.folders}
                onCreateRoot={() => void onCreateRootOrdner(t('filesystem.newFolderDefaultName'))}
              />
            ) : (
              <LibraryPageDocumentSection
                data={data}
                ctx={ctx}
                enableDocumentDrag
                emptyStateOverride={folderEmpty}
                filesystemLayout
              />
            )}
          </div>

          <UploadQueueList className="dateisystem-upload-queue" />
        </section>
      </div>

      <FolderTargetPickerDialog
        open={folderPickerOpen}
        mappen={data.mappen}
        folders={data.folders}
        onCancel={() => { setFolderPickerOpen(false); }}
        onPick={(target) => {
          setUploadOverride({
            kind: 'folder',
            folderId: target.folderId,
            label: target.label,
          });
          setFolderPickerOpen(false);
        }}
      />

      {addExistingTarget ? (
        <AddExistingDocumentsDialog
          open
          folderId={addExistingTarget.folderId}
          folderLabel={addExistingTarget.label}
          onClose={() => { setAddExistingTarget(null); }}
          onAssigned={() => {
            void data.load();
            void refreshTree();
          }}
        />
      ) : null}
    </div>
  );
}
