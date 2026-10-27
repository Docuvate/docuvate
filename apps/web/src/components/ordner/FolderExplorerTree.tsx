// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { FolderDto } from '@docuvate/contracts';
import { useVirtualizer } from '@tanstack/react-virtual';
import { ChevronDown, ChevronRight, Folder, FolderOpen, MoreHorizontal, Plus } from 'lucide-react';
import {
  type DragEvent,
  type FormEvent,
  type KeyboardEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import { NavLink } from 'react-router-dom';

import { isFileDrag } from '../../lib/documentUploadConstants';
import { canCreateChildFolder, MAX_FOLDER_DEPTH } from '../../lib/folderDepth';
import {
  collectVisibleFolderTreeRows,
  type FlatFolderTreeRow,
} from '../../lib/ordner/folderExplorerFlatRows';
import { folderDirectDocumentCount, folderHref } from '../../lib/ordnerTree';
import { routes } from '../../lib/routes';
import { Button } from '../ui/Button';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import type { ContextMenuEntry } from '../ui/ContextMenu';
import { ContextMenu } from '../ui/ContextMenu';
import { IconButton } from '../ui/IconButton';
import { Input } from '../ui/Input';
import { DateisystemTreeRow, TREE_ICON } from './DateisystemTreeRow';
import { useFolderDropTarget } from './DocumentFolderDnD';

const TREE_ICON_STROKE = 1.75;
const FOLDER_TREE_ROW_ESTIMATE_PX = 36;

export interface FolderDocumentTarget {
  folderId: string;
  label: string;
}

interface FolderExplorerTreeProps {
  folders: FolderDto[];
  selection: { folderId?: string; unassigned?: boolean };
  treeQuery: string;
  onTreeQueryChange: (value: string) => void;
  onCreateRootFolder: (name: string) => Promise<void>;
  onCreateChildFolder: (args: { parentId: string | null; name: string }) => Promise<void>;
  onRenameFolder: (folderId: string, name: string) => Promise<void>;
  onDeleteFolder: (folderId: string) => Promise<void>;
  onAddDocuments: (target: FolderDocumentTarget) => void;
  onUploadFilesToFolder: (folderId: string, files: FileList) => void;
}

export function FolderExplorerTree({
  folders,
  selection,
  treeQuery,
  onTreeQueryChange,
  onCreateRootFolder,
  onCreateChildFolder,
  onRenameFolder,
  onDeleteFolder,
  onAddDocuments,
  onUploadFilesToFolder,
}: FolderExplorerTreeProps) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());
  const [rootCreateOpen, setRootCreateOpen] = useState(false);
  const [footerCreateOpen, setFooterCreateOpen] = useState(false);
  const rootCreateInputRef = useRef<HTMLInputElement>(null);
  const footerCreateInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (rootCreateOpen) rootCreateInputRef.current?.focus();
  }, [rootCreateOpen]);
  useEffect(() => {
    if (footerCreateOpen) footerCreateInputRef.current?.focus();
  }, [footerCreateOpen]);
  const [rootCreateName, setRootCreateName] = useState('');
  const [footerCreateName, setFooterCreateName] = useState('');
  const [fileDropHighlightId, setFileDropHighlightId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    items: ContextMenuEntry[];
  } | null>(null);
  const [pendingDeleteFolder, setPendingDeleteFolder] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const treeScrollRef = useRef<HTMLDivElement>(null);
  const visibleRows = useMemo(
    () =>
      collectVisibleFolderTreeRows({
        folders,
        parentId: null,
        depth: 0,
        treeQuery,
        selectionFolderId: selection.unassigned ? undefined : selection.folderId,
        expanded,
      }),
    [expanded, folders, selection.folderId, selection.unassigned, treeQuery]
  );
  const treeVirtualizer = useVirtualizer({
    count: visibleRows.length,
    getScrollElement: () => treeScrollRef.current,
    estimateSize: () => FOLDER_TREE_ROW_ESTIMATE_PX,
    overscan: 12,
    measureElement: (element) => element.getBoundingClientRect().height,
  });

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
            void onCreateChildFolder({
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
    [folders, onAddDocuments, onCreateChildFolder, onRenameFolder, t]
  );

  function handleFolderFileDrop(folderId: string, event: DragEvent) {
    event.preventDefault();
    setFileDropHighlightId(null);
    if (isFileDrag(event.dataTransfer) && event.dataTransfer.files.length) {
      onUploadFilesToFolder(folderId, event.dataTransfer.files);
    }
  }

  async function submitRootFolder(e: FormEvent, source: 'toolbar' | 'footer') {
    e.preventDefault();
    const name = (source === 'toolbar' ? rootCreateName : footerCreateName).trim();
    if (!name) return;
    await onCreateRootFolder(name);
    if (source === 'toolbar') {
      setRootCreateName('');
      setRootCreateOpen(false);
    } else {
      setFooterCreateName('');
      setFooterCreateOpen(false);
    }
  }

  function onTreeKeyDown(event: KeyboardEvent<HTMLElement>) {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const item = target.closest<HTMLElement>('[data-treeitem-id]');
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
        <form
          className="dateisystem-tree-root-inline"
          onSubmit={(e) => void submitRootFolder(e, 'toolbar')}
        >
          <Input
            ref={rootCreateInputRef}
            placeholder={t('filesystem.newRootPlaceholder')}
            value={rootCreateName}
            onChange={(e) => { setRootCreateName(e.target.value); }}
            aria-label={t('filesystem.newRootAria')}
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

      <nav className="dateisystem-tree-nav" aria-label={t('filesystem.treeNavAria')}>
        <div
          ref={treeScrollRef}
          className="dateisystem-tree-nav-scroll"
          data-testid="folder-tree-virtual-scroll"
        >
          <ul
            className="sidebar-tree-list dateisystem-tree-list dateisystem-tree-list-virtual"
            role="tree"
            tabIndex={0}
            onKeyDown={onTreeKeyDown}
            style={{
              height: `${String(treeVirtualizer.getTotalSize())}px`,
              position: 'relative',
            }}
          >
            {treeVirtualizer.getVirtualItems().map((virtualRow) => {
              const row = visibleRows[virtualRow.index];
              return (
                <FolderFlatTreeRow
                  key={row.folderKey}
                  row={row}
                  folders={folders}
                  fileDropHighlightId={fileDropHighlightId}
                  virtualRow={virtualRow}
                  measureElement={treeVirtualizer.measureElement}
                  onSetExpandedExplicit={setExpandedExplicit}
                  onCreateChildFolder={onCreateChildFolder}
                  onOpenMenu={openFolderMenu}
                  onFileDropHighlight={setFileDropHighlightId}
                  onFileDrop={handleFolderFileDrop}
                />
              );
            })}
          </ul>
        </div>
      </nav>

      <div className="dateisystem-tree-footer">
        <hr className="dateisystem-tree-footer-divider" />
        <UnassignedTreeLink active={Boolean(selection.unassigned)} />
        {footerCreateOpen ? (
          <form
            className="dateisystem-tree-footer-create"
            onSubmit={(e) => void submitRootFolder(e, 'footer')}
          >
            <Input
              ref={footerCreateInputRef}
              placeholder={t('filesystem.newRootPlaceholder')}
              value={footerCreateName}
              onChange={(e) => { setFooterCreateName(e.target.value); }}
              aria-label={t('filesystem.newRootAria')}
            />
          </form>
        ) : (
          <Button
            type="button"
            variant="ghost"
            className="dateisystem-tree-footer-new"
            onClick={() => { setFooterCreateOpen(true); }}
          >
            <Plus size={16} strokeWidth={2} aria-hidden />
            {t('filesystem.newRootButton')}
          </Button>
        )}
      </div>

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
          if (pendingDeleteFolder) void onDeleteFolder(pendingDeleteFolder.id);
          setPendingDeleteFolder(null);
        }}
      />
    </div>
  );
}

function UnassignedTreeLink({ active }: { active: boolean }) {
  const { t } = useTranslation();
  const { setNodeRef, highlighted } = useFolderDropTarget({
    folderId: null,
    folderName: t('filesystem.withoutFolder'),
  });
  return (
    <div
      ref={setNodeRef}
      className={`dateisystem-tree-unassigned${active ? ' is-selected' : ''}${highlighted ? ' drop-target' : ''}`}
    >
      <NavLink to={routes.filesystemUnassigned} className="dateisystem-tree-unassigned-link">
        {t('filesystem.withoutFolder')}
      </NavLink>
    </div>
  );
}

interface FolderFlatTreeRowProps {
  row: FlatFolderTreeRow;
  folders: FolderDto[];
  fileDropHighlightId: string | null;
  virtualRow: { index: number; start: number };
  measureElement: (element: Element) => void;
  onSetExpandedExplicit: (key: string, open: boolean) => void;
  onCreateChildFolder: (args: { parentId: string | null; name: string }) => Promise<void>;
  onOpenMenu: (event: React.MouseEvent, folder: FolderDto) => void;
  onFileDropHighlight: (id: string | null) => void;
  onFileDrop: (folderId: string, event: DragEvent) => void;
}

function FolderFlatTreeRow({
  row,
  folders,
  fileDropHighlightId,
  virtualRow,
  measureElement,
  onSetExpandedExplicit,
  onCreateChildFolder,
  onOpenMenu,
  onFileDropHighlight,
  onFileDrop,
}: FolderFlatTreeRowProps) {
  const { t } = useTranslation();
  const { folder, depth, folderKey, open, hasChildren, active } = row;
  const canAddChild = canCreateChildFolder(folders, folder.id);
  const { setNodeRef, highlighted: dndHighlight } = useFolderDropTarget({
    folderId: folder.id,
    folderName: folder.name,
  });

  const dropTarget = dndHighlight || fileDropHighlightId === folderKey;
  const count = folderDirectDocumentCount(folder);

  return (
    <li
      ref={(node) => {
        setNodeRef(node);
        if (node) {
          measureElement(node);
        }
      }}
      data-index={virtualRow.index}
      className="sidebar-tree-item dateisystem-tree-virtual-item"
      role="treeitem"
      aria-expanded={open}
      aria-selected={active}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        transform: `translateY(${String(virtualRow.start)}px)`,
      }}
    >
      <DateisystemTreeRow
        to={folderHref(folder.id)}
        isActive={active}
        depth={depth}
        treeItemId={folderKey}
        dropTarget={dropTarget}
        name={folder.name}
        count={count}
        countAriaLabel={t('library.folderDocCount', { count })}
        countTitle={t('filesystem.treeDocCountTooltip', { count })}
        onDragOver={(e) => {
          if (!isFileDrag(e.dataTransfer)) return;
          e.preventDefault();
          onFileDropHighlight(folderKey);
        }}
        onDragLeave={() => { onFileDropHighlight(null); }}
        onDrop={(e) => { onFileDrop(folder.id, e); }}
        chevron={
          <TreeExpandChevron
            hasChildren={hasChildren}
            open={open}
            collapseLabel={t('filesystem.collapseChildren')}
            expandLabel={t('filesystem.expandChildren')}
            onToggle={() => { onSetExpandedExplicit(folderKey, !open); }}
          />
        }
        icon={
          open && hasChildren ? (
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
              onCreate={async (name) => {
                await onCreateChildFolder({ parentId: folder.id, name });
              }}
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
    </li>
  );
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
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

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
          ref={inputRef}
          className="sidebar-inline-input"
          value={name}
          onChange={(e) => { setName(e.target.value); }}
          placeholder={t('filesystem.folderNamePlaceholder')}
          aria-label={t('filesystem.folderNameAria')}
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
