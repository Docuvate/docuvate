// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { FolderDto, MappeDto } from '@docuvate/contracts';
import { ChevronDown, ChevronRight, Folder, FolderOpen, MoreHorizontal, Plus } from 'lucide-react';
import {
  type DragEvent,
  type FormEvent,
  type KeyboardEvent,
  useCallback,
  useMemo,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';

import { isDocumentDrag, readDocumentDragIds } from '../../lib/documentDnD';
import { isFileDrag } from '../../lib/documentUploadConstants';
import { canCreateChildFolder, MAX_FOLDER_DEPTH } from '../../lib/folderDepth';
import {
  childFolders,
  folderDirectDocumentCount,
  folderHref,
  folderSubtreeMatchesSearch,
  foldersWithoutMappe,
  mappeDirectDocumentCount,
  mappeHref,
  mappeSubtreeMatchesSearch,
  nodeMatchesQuery,
  orphanNestedFolders,
  sortByNameDe,
} from '../../lib/ordnerTree';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import type { ContextMenuEntry } from '../ui/ContextMenu';
import { ContextMenu } from '../ui/ContextMenu';
import { IconButton } from '../ui/IconButton';
import { Input } from '../ui/Input';
import { DateisystemTreeRow, TREE_ICON } from './DateisystemTreeRow';

const TREE_ICON_STROKE = 1.75;

export interface FolderDocumentTarget {
  folderId: string;
  label: string;
}

interface FolderExplorerTreeProps {
  mappen: MappeDto[];
  folders: FolderDto[];
  selection: { mappeId?: string; folderId?: string };
  treeQuery: string;
  onTreeQueryChange: (value: string) => void;
  onCreateRootOrdner: (name: string) => Promise<void>;
  onCreateChildFolder: (args: {
    mappeId: string;
    parentId: string | null;
    name: string;
  }) => Promise<void>;
  onRenameFolder: (folderId: string, name: string) => Promise<void>;
  onDeleteFolder: (folderId: string) => Promise<void>;
  onAddDocuments: (target: FolderDocumentTarget) => void;
  onMoveDocumentsToFolder: (folderId: string, documentIds: string[]) => Promise<void>;
  onUploadFilesToFolder: (folderId: string, files: FileList) => void;
}

export function FolderExplorerTree({
  mappen,
  folders,
  selection,
  treeQuery,
  onTreeQueryChange,
  onCreateRootOrdner,
  onCreateChildFolder,
  onRenameFolder,
  onDeleteFolder,
  onAddDocuments,
  onMoveDocumentsToFolder,
  onUploadFilesToFolder,
}: FolderExplorerTreeProps) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());
  const [rootCreateOpen, setRootCreateOpen] = useState(false);
  const [rootCreateName, setRootCreateName] = useState('');
  const [dropHighlightId, setDropHighlightId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    items: ContextMenuEntry[];
  } | null>(null);
  const [pendingDeleteFolder, setPendingDeleteFolder] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const sortedMappen = useMemo(() => sortByNameDe(mappen), [mappen]);
  const looseRoots = useMemo(() => foldersWithoutMappe(folders), [folders]);
  const looseNested = useMemo(() => orphanNestedFolders(folders), [folders]);

  function isExpanded(key: string, defaultOpen: boolean): boolean {
    if (expanded.has(key)) return true;
    if (expanded.has(`!${key}`)) return false;
    return defaultOpen;
  }

  function setExpandedExplicit(key: string, open: boolean) {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.delete(key);
      next.delete(`!${key}`);
      next.add(open ? key : `!${key}`);
      return next;
    });
  }

  const closeMenu = useCallback(() => { setContextMenu(null); }, []);

  const openFolderMenu = useCallback(
    (event: React.MouseEvent, folder: FolderDto) => {
      event.preventDefault();
      event.stopPropagation();
      const canAddChild = canCreateChildFolder(folders, folder.id);
      const items: ContextMenuEntry[] = [
        {
          kind: 'item',
          id: 'add-docs',
          label: t('filesystem.contextAddDocuments'),
          onSelect: () => { onAddDocuments({ folderId: folder.id, label: folder.name }); },
        },
        {
          kind: 'item',
          id: 'new-child',
          label: t('filesystem.contextNewSubfolder'),
          disabled: !canAddChild,
          onSelect: () => {
            if (!folder.mappeId) return;
            void onCreateChildFolder({
              mappeId: folder.mappeId,
              parentId: folder.id,
              name: t('filesystem.newFolderDefaultName'),
            });
          },
        },
        { kind: 'separator' },
        {
          kind: 'item',
          id: 'rename',
          label: t('filesystem.contextRename'),
          onSelect: () => {
            const next = window.prompt(t('filesystem.contextRenamePrompt'), folder.name);
            if (next?.trim()) void onRenameFolder(folder.id, next.trim());
          },
        },
        {
          kind: 'item',
          id: 'delete',
          label: t('common.delete'),
          danger: true,
          onSelect: () => {
            setPendingDeleteFolder({ id: folder.id, name: folder.name });
          },
        },
      ];
      setContextMenu({ x: event.clientX, y: event.clientY, items });
    },
    [folders, onAddDocuments, onCreateChildFolder, onDeleteFolder, onRenameFolder, t]
  );

  const openMappeMenu = useCallback(
    (event: React.MouseEvent, mappe: MappeDto) => {
      event.preventDefault();
      event.stopPropagation();
      const roots = childFolders(folders, { mappeId: mappe.id, parentId: null });
      const defaultFolder = roots.length === 1 ? roots[0] : null;
      const items: ContextMenuEntry[] = [
        {
          kind: 'item',
          id: 'add-docs',
          label: t('filesystem.contextAddDocuments'),
          disabled: !defaultFolder,
          onSelect: () => {
            if (defaultFolder) {
              onAddDocuments({ folderId: defaultFolder.id, label: defaultFolder.name });
            }
          },
        },
        {
          kind: 'item',
          id: 'new-child',
          label: t('filesystem.contextNewSubfolder'),
          onSelect: () =>
            void onCreateChildFolder({
              mappeId: mappe.id,
              parentId: null,
              name: t('filesystem.newFolderDefaultName'),
            }),
        },
      ];
      setContextMenu({ x: event.clientX, y: event.clientY, items });
    },
    [folders, onAddDocuments, onCreateChildFolder, t]
  );

  function handleFolderDrop(folderId: string, event: DragEvent) {
    event.preventDefault();
    setDropHighlightId(null);
    if (isFileDrag(event.dataTransfer) && event.dataTransfer?.files.length) {
      onUploadFilesToFolder(folderId, event.dataTransfer.files);
      return;
    }
    if (isDocumentDrag(event.dataTransfer)) {
      const ids = readDocumentDragIds(event.dataTransfer);
      if (ids.length) void onMoveDocumentsToFolder(folderId, ids);
    }
  }

  async function submitRootOrdner(e: FormEvent) {
    e.preventDefault();
    const name = rootCreateName.trim();
    if (!name) return;
    await onCreateRootOrdner(name);
    setRootCreateName('');
    setRootCreateOpen(false);
  }

  function onTreeKeyDown(event: KeyboardEvent<HTMLElement>) {
    const target = event.target as HTMLElement | null;
    const item = target?.closest<HTMLElement>('[data-treeitem-id]');
    if (!item) return;
    const id = item.dataset.treeitemId;
    if (!id) return;

    if (event.key === 'ArrowRight') {
      event.preventDefault();
      setExpandedExplicit(id, true);
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      setExpandedExplicit(id, false);
    }
  }

  return (
    <div className="dateisystem-tree">
      <div className="dateisystem-tree-toolbar">
        <div className="dateisystem-tree-search">
          <Input
            value={treeQuery}
            onChange={(e) => { onTreeQueryChange(e.target.value); }}
            placeholder={t('filesystem.treeSearchPlaceholder')}
            aria-label={t('filesystem.treeSearchAria')}
          />
        </div>
        <IconButton
          icon={Plus}
          label={t('filesystem.newRootButton')}
          size="md"
          strokeWidth={2}
          className="dateisystem-tree-head-add"
          onClick={() => { setRootCreateOpen((v) => !v); }}
        />
      </div>

      {rootCreateOpen ? (
        <form className="dateisystem-tree-root-inline" onSubmit={(e) => void submitRootOrdner(e)}>
          <Input
            placeholder={t('filesystem.newRootPlaceholder')}
            value={rootCreateName}
            onChange={(e) => { setRootCreateName(e.target.value); }}
            aria-label={t('filesystem.newRootAria')}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                e.preventDefault();
                setRootCreateOpen(false);
                setRootCreateName('');
              }
            }}
          />
        </form>
      ) : null}

      <nav
        className="dateisystem-tree-nav"
        aria-label={t('filesystem.treeNavAria')}
        onKeyDown={onTreeKeyDown}
      >
        <ul className="sidebar-tree-list dateisystem-tree-list" role="tree">
          {sortedMappen.map((mappe) => {
            const mappeKey = `m:${mappe.id}`;
            const onPath =
              selection.mappeId === mappe.id ||
              (selection.folderId != null &&
                folders.some(
                  (f) =>
                    f.id === selection.folderId &&
                    (f.mappeId === mappe.id || folderAncestorIncludesMappe(folders, f.id, mappe.id))
                ));
            const defaultOpen = onPath || mappeSubtreeMatchesSearch(folders, mappe.id, treeQuery);
            const open = isExpanded(mappeKey, defaultOpen);
            const children = childFolders(folders, { mappeId: mappe.id, parentId: null });
            const showMappe =
              nodeMatchesQuery(mappe.name, treeQuery) ||
              mappeSubtreeMatchesSearch(folders, mappe.id, treeQuery);

            if (!showMappe) return null;

            const mappeActive = selection.mappeId === mappe.id;

            return (
              <li key={mappe.id} className="sidebar-tree-item" role="treeitem" aria-expanded={open}>
                <DateisystemTreeRow
                  to={mappeHref(mappe.id)}
                  isActive={mappeActive}
                  depth={0}
                  treeItemId={mappeKey}
                  dropTarget={dropHighlightId === mappeKey}
                  linkClassName="sidebar-mappe-link"
                  count={mappeDirectDocumentCount(mappe, folders)}
                  countAriaLabel={t('library.mappeDocCount', {
                    count: mappeDirectDocumentCount(mappe, folders),
                  })}
                  countTitle={t('filesystem.treeDocCountTooltip', {
                    count: mappeDirectDocumentCount(mappe, folders),
                  })}
                  name={mappe.name}
                  chevron={
                    <TreeExpandChevron
                      hasChildren={children.length > 0}
                      open={open}
                      collapseLabel={t('filesystem.collapseChildren')}
                      expandLabel={t('filesystem.expandChildren')}
                      onToggle={() => { setExpandedExplicit(mappeKey, !open); }}
                    />
                  }
                  icon={
                    open && children.length > 0 ? (
                      <FolderOpen size={TREE_ICON} strokeWidth={TREE_ICON_STROKE} aria-hidden />
                    ) : (
                      <Folder size={TREE_ICON} strokeWidth={TREE_ICON_STROKE} aria-hidden />
                    )
                  }
                  actions={
                    <>
                      <TreeAddFolderButton
                        ariaLabel={t('filesystem.addChildIn', { name: mappe.name })}
                        depthHint={
                          canCreateChildFolder(folders, null)
                            ? undefined
                            : t('filesystem.maxDepthInline', { max: MAX_FOLDER_DEPTH })
                        }
                        onCreate={(name) =>
                          onCreateChildFolder({ mappeId: mappe.id, parentId: null, name })
                        }
                      />
                      <IconButton
                        icon={MoreHorizontal}
                        label={t('filesystem.contextMenuAria', { name: mappe.name })}
                        size="md"
                        strokeWidth={2}
                        className="sidebar-row-action dateisystem-tree-menu-btn"
                        onClick={(e) => { openMappeMenu(e, mappe); }}
                        hasPopup="menu"
                      />
                    </>
                  }
                />
                {open && children.length > 0 ? (
                  <ul className="sidebar-mappe-children dateisystem-tree-children" role="group">
                    {children.map((folder) => (
                      <FolderTreeNode
                        key={folder.id}
                        folder={folder}
                        depth={1}
                        folders={folders}
                        treeQuery={treeQuery}
                        selectionFolderId={selection.folderId}
                        expanded={expanded}
                        dropHighlightId={dropHighlightId}
                        onSetExpandedExplicit={setExpandedExplicit}
                        onCreateChildFolder={onCreateChildFolder}
                        onOpenMenu={openFolderMenu}
                        onDragHighlight={setDropHighlightId}
                        onDrop={handleFolderDrop}
                      />
                    ))}
                  </ul>
                ) : null}
              </li>
            );
          })}

          {looseRoots.length > 0 ? (
            <li className="sidebar-tree-item dateisystem-tree-loose" role="treeitem">
              <span className="dateisystem-tree-loose-label">
                {t('filesystem.looseFoldersSection')}
              </span>
              <ul className="sidebar-mappe-children dateisystem-tree-children" role="group">
                {looseRoots
                  .filter((f) => nodeMatchesQuery(f.name, treeQuery))
                  .map((folder) => (
                    <LooseFolderRow
                      key={folder.id}
                      folder={folder}
                      selectionFolderId={selection.folderId}
                      onOpenMenu={openFolderMenu}
                      onDrop={handleFolderDrop}
                      dropHighlightId={dropHighlightId}
                      onDragHighlight={setDropHighlightId}
                    />
                  ))}
                {looseNested
                  .filter((f) => nodeMatchesQuery(f.name, treeQuery))
                  .map((folder) => (
                    <LooseFolderRow
                      key={folder.id}
                      folder={folder}
                      selectionFolderId={selection.folderId}
                      onOpenMenu={openFolderMenu}
                      onDrop={handleFolderDrop}
                      dropHighlightId={dropHighlightId}
                      onDragHighlight={setDropHighlightId}
                    />
                  ))}
              </ul>
            </li>
          ) : null}
        </ul>
      </nav>

      <ContextMenu
        open={contextMenu != null}
        x={contextMenu?.x ?? 0}
        y={contextMenu?.y ?? 0}
        items={contextMenu?.items ?? []}
        onClose={closeMenu}
      />
      <ConfirmDialog
        open={pendingDeleteFolder != null}
        title={
          pendingDeleteFolder
            ? t('filesystem.contextDeleteConfirm', { name: pendingDeleteFolder.name })
            : ''
        }
        description={t('filesystem.contextDeleteDescription')}
        confirmLabel={t('common.deletePermanently')}
        tone="danger"
        onCancel={() => { setPendingDeleteFolder(null); }}
        onConfirm={() => {
          if (pendingDeleteFolder) {
            void onDeleteFolder(pendingDeleteFolder.id);
          }
          setPendingDeleteFolder(null);
        }}
      />
    </div>
  );
}

function folderAncestorIncludesMappe(
  folders: FolderDto[],
  folderId: string,
  mappeId: string
): boolean {
  const byId = new Map(folders.map((f) => [f.id, f]));
  let current = byId.get(folderId);
  while (current) {
    if (current.mappeId === mappeId) return true;
    current = current.parentId ? byId.get(current.parentId) : undefined;
  }
  return false;
}

interface FolderTreeNodeProps {
  folder: FolderDto;
  depth: number;
  folders: FolderDto[];
  treeQuery: string;
  selectionFolderId?: string;
  expanded: Set<string>;
  dropHighlightId: string | null;
  onSetExpandedExplicit: (key: string, open: boolean) => void;
  onCreateChildFolder: (args: {
    mappeId: string;
    parentId: string | null;
    name: string;
  }) => Promise<void>;
  onOpenMenu: (event: React.MouseEvent, folder: FolderDto) => void;
  onDragHighlight: (id: string | null) => void;
  onDrop: (folderId: string, event: DragEvent) => void;
}

function FolderTreeNode({
  folder,
  depth,
  folders,
  treeQuery,
  selectionFolderId,
  expanded,
  dropHighlightId,
  onSetExpandedExplicit,
  onCreateChildFolder,
  onOpenMenu,
  onDragHighlight,
  onDrop,
}: FolderTreeNodeProps) {
  const { t } = useTranslation();
  if (!folder.mappeId) return null;
  const children = childFolders(folders, { mappeId: folder.mappeId, parentId: folder.id });
  const folderKey = `f:${folder.id}`;
  const onPath =
    selectionFolderId === folder.id ||
    (selectionFolderId != null && isDescendant(folders, selectionFolderId, folder.id));
  const defaultOpen = onPath || folderSubtreeMatchesSearch(folders, folder, treeQuery);
  const open = expanded.has(folderKey) ? true : expanded.has(`!${folderKey}`) ? false : defaultOpen;
  const active = selectionFolderId === folder.id;
  const canAddChild = canCreateChildFolder(folders, folder.id);

  if (
    !nodeMatchesQuery(folder.name, treeQuery) &&
    !folderSubtreeMatchesSearch(folders, folder, treeQuery)
  ) {
    return null;
  }

  return (
    <li className="sidebar-tree-item" role="treeitem" aria-expanded={open}>
      <DateisystemTreeRow
        to={folderHref(folder.id)}
        isActive={active}
        depth={depth}
        treeItemId={folderKey}
        dropTarget={dropHighlightId === folderKey}
        name={folder.name}
        count={folderDirectDocumentCount(folder)}
        countAriaLabel={t('library.mappeDocCount', { count: folderDirectDocumentCount(folder) })}
        countTitle={t('filesystem.treeDocCountTooltip', {
          count: folderDirectDocumentCount(folder),
        })}
        onDragOver={(e) => {
          if (!isFileDrag(e.dataTransfer) && !isDocumentDrag(e.dataTransfer)) return;
          e.preventDefault();
          onDragHighlight(folderKey);
        }}
        onDragLeave={() => { onDragHighlight(null); }}
        onDrop={(e) => { onDrop(folder.id, e); }}
        chevron={
          <TreeExpandChevron
            hasChildren={children.length > 0}
            open={open}
            collapseLabel={t('filesystem.collapseChildren')}
            expandLabel={t('filesystem.expandChildren')}
            onToggle={() => { onSetExpandedExplicit(folderKey, !open); }}
          />
        }
        icon={
          open && children.length > 0 ? (
            <FolderOpen size={TREE_ICON} strokeWidth={TREE_ICON_STROKE} aria-hidden />
          ) : (
            <Folder size={TREE_ICON} strokeWidth={TREE_ICON_STROKE} aria-hidden />
          )
        }
        actions={
          <>
            <TreeAddFolderButton
              ariaLabel={t('filesystem.addChildIn', { name: folder.name })}
              depthHint={
                canAddChild ? undefined : t('filesystem.maxDepthInline', { max: MAX_FOLDER_DEPTH })
              }
              disabled={!canAddChild}
              onCreate={(name) =>
                onCreateChildFolder({ mappeId: folder.mappeId!, parentId: folder.id, name })
              }
            />
            <IconButton
              icon={MoreHorizontal}
              label={t('filesystem.contextMenuAria', { name: folder.name })}
              size="md"
              strokeWidth={2}
              className="sidebar-row-action dateisystem-tree-menu-btn"
              onClick={(e) => { onOpenMenu(e, folder); }}
              hasPopup="menu"
            />
          </>
        }
      />
      {open && children.length > 0 ? (
        <ul className="sidebar-mappe-children dateisystem-tree-children" role="group">
          {children.map((child) => (
            <FolderTreeNode
              key={child.id}
              folder={child}
              depth={depth + 1}
              folders={folders}
              treeQuery={treeQuery}
              selectionFolderId={selectionFolderId}
              expanded={expanded}
              dropHighlightId={dropHighlightId}
              onSetExpandedExplicit={onSetExpandedExplicit}
              onCreateChildFolder={onCreateChildFolder}
              onOpenMenu={onOpenMenu}
              onDragHighlight={onDragHighlight}
              onDrop={onDrop}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

function LooseFolderRow({
  folder,
  selectionFolderId,
  onOpenMenu,
  onDrop,
  dropHighlightId,
  onDragHighlight,
}: {
  folder: FolderDto;
  selectionFolderId?: string;
  onOpenMenu: (event: React.MouseEvent, folder: FolderDto) => void;
  onDrop: (folderId: string, event: DragEvent) => void;
  dropHighlightId: string | null;
  onDragHighlight: (id: string | null) => void;
}) {
  const { t } = useTranslation();
  const folderKey = `f:${folder.id}`;
  const active = selectionFolderId === folder.id;
  return (
    <li className="sidebar-tree-item" role="treeitem">
      <DateisystemTreeRow
        to={folderHref(folder.id)}
        isActive={active}
        depth={0}
        treeItemId={folderKey}
        dropTarget={dropHighlightId === folderKey}
        name={folder.name}
        count={folderDirectDocumentCount(folder)}
        countAriaLabel={t('library.mappeDocCount', { count: folderDirectDocumentCount(folder) })}
        countTitle={t('filesystem.treeDocCountTooltip', {
          count: folderDirectDocumentCount(folder),
        })}
        onDragOver={(e) => {
          if (!isFileDrag(e.dataTransfer) && !isDocumentDrag(e.dataTransfer)) return;
          e.preventDefault();
          onDragHighlight(folderKey);
        }}
        onDragLeave={() => { onDragHighlight(null); }}
        onDrop={(e) => { onDrop(folder.id, e); }}
        chevron={<span className="dateisystem-tree-chevron-spacer" aria-hidden />}
        icon={<Folder size={TREE_ICON} strokeWidth={TREE_ICON_STROKE} aria-hidden />}
        actions={
          <IconButton
            icon={MoreHorizontal}
            label={t('filesystem.contextMenuAria', { name: folder.name })}
            size="md"
            strokeWidth={2}
            className="sidebar-row-action dateisystem-tree-menu-btn"
            onClick={(e) => { onOpenMenu(e, folder); }}
            hasPopup="menu"
          />
        }
      />
    </li>
  );
}

function isDescendant(
  folders: FolderDto[],
  maybeDescendantId: string,
  ancestorId: string
): boolean {
  const byId = new Map(folders.map((f) => [f.id, f]));
  let current = byId.get(maybeDescendantId);
  while (current?.parentId) {
    if (current.parentId === ancestorId) return true;
    current = byId.get(current.parentId);
  }
  return false;
}

function TreeExpandChevron({
  hasChildren,
  open,
  collapseLabel,
  expandLabel,
  onToggle,
}: {
  hasChildren: boolean;
  open: boolean;
  collapseLabel: string;
  expandLabel: string;
  onToggle: () => void;
}) {
  if (!hasChildren) {
    return <span className="dateisystem-tree-chevron-spacer" aria-hidden />;
  }
  return (
    <button
      type="button"
      className="dateisystem-tree-chevron"
      aria-expanded={open}
      aria-label={open ? collapseLabel : expandLabel}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onToggle();
      }}
    >
      {open ? (
        <ChevronDown size={TREE_ICON} strokeWidth={TREE_ICON_STROKE} aria-hidden />
      ) : (
        <ChevronRight size={TREE_ICON} strokeWidth={TREE_ICON_STROKE} aria-hidden />
      )}
    </button>
  );
}

function TreeAddFolderButton({
  ariaLabel,
  depthHint,
  disabled,
  onCreate,
}: {
  ariaLabel: string;
  depthHint?: string;
  disabled?: boolean;
  onCreate: (name: string) => Promise<void>;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [depthError, setDepthError] = useState<string | null>(null);

  if (!open) {
    return (
      <IconButton
        icon={Plus}
        label={ariaLabel}
        title={depthHint ?? ariaLabel}
        size="md"
        strokeWidth={2}
        disabled={disabled}
        className="sidebar-row-action dateisystem-tree-add-btn"
        onClick={() => {
          if (disabled) {
            setDepthError(depthHint ?? t('filesystem.maxDepthInline', { max: MAX_FOLDER_DEPTH }));
            return;
          }
          setDepthError(null);
          setOpen(true);
        }}
      />
    );
  }

  return (
    <>
      <form
        className="sidebar-inline-create dateisystem-inline-create"
        onSubmit={(e) => {
          e.preventDefault();
          const trimmed = name.trim();
          if (!trimmed || busy) return;
          setBusy(true);
          void (async () => {
            try {
              await onCreate(trimmed);
              setName('');
              setOpen(false);
              setDepthError(null);
            } finally {
              setBusy(false);
            }
          })();
        }}
      >
        <input
          className="sidebar-inline-input"
          value={name}
          onChange={(e) => { setName(e.target.value); }}
          placeholder={t('filesystem.folderNamePlaceholder')}
          aria-label={t('filesystem.folderNameAria')}
          autoFocus
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              e.preventDefault();
              setOpen(false);
              setName('');
            }
          }}
        />
        <button
          type="submit"
          className="sidebar-icon-btn"
          disabled={busy || !name.trim()}
          aria-label={t('filesystem.createAria')}
        >
          ✓
        </button>
        <button
          type="button"
          className="sidebar-icon-btn"
          aria-label={t('filesystem.cancelAria')}
          onClick={() => { setOpen(false); }}
        >
          ×
        </button>
      </form>
      {depthError ? (
        <span className="dateisystem-inline-depth-error" role="alert">
          {depthError}
        </span>
      ) : null}
    </>
  );
}
