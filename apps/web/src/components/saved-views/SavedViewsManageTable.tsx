// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { SavedDocumentViewDto } from '@docuvate/contracts';
import { GripVertical, MoreHorizontal } from 'lucide-react';
import { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { routes } from '../../lib/routes';
import { Button } from '../ui/Button';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { ContextMenu } from '../ui/ContextMenu';
import { IconButton } from '../ui/IconButton';
import { Input } from '../ui/Input';

interface Props {
  views: SavedDocumentViewDto[];
  currentUserId: string | undefined;
  canManageShared: boolean;
  busy: boolean;
  onRename: (id: string, name: string) => Promise<void>;
  onTogglePin: (view: SavedDocumentViewDto) => Promise<void>;
  onDelete: (view: SavedDocumentViewDto) => Promise<void>;
  onReorder: (orderedIds: string[]) => Promise<void>;
}

export function SavedViewsManageTable({
  views,
  currentUserId,
  canManageShared,
  busy,
  onRename,
  onTogglePin,
  onDelete,
  onReorder,
}: Props) {
  const { t } = useTranslation();
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<SavedDocumentViewDto | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ x: 0, y: 0 });
  const [menuView, setMenuView] = useState<SavedDocumentViewDto | null>(null);
  const menuAnchorRef = useRef<HTMLButtonElement | null>(null);
  const dragIndexRef = useRef<number | null>(null);

  const openMenu = (view: SavedDocumentViewDto, anchor: HTMLButtonElement) => {
    menuAnchorRef.current = anchor;
    setMenuView(view);
    const rect = anchor.getBoundingClientRect();
    setMenuPos({ x: rect.left, y: rect.bottom + 4 });
    setMenuOpen(true);
  };

  const owned = views.filter((v) => v.ownerUserId === currentUserId);
  const ownedIds = new Set(owned.map((v) => v.id));

  const reorderOwned = useCallback(
    async (from: number, to: number) => {
      if (from === to || from < 0 || to < 0 || from >= owned.length || to >= owned.length) return;
      const copy = [...owned];
      const [item] = copy.splice(from, 1);
      copy.splice(to, 0, item);
      await onReorder(copy.map((v) => v.id));
    },
    [owned, onReorder]
  );

  function onDragStart(index: number) {
    dragIndexRef.current = index;
  }

  function onDrop(targetIndex: number) {
    const from = dragIndexRef.current;
    dragIndexRef.current = null;
    if (from == null) return;
    void reorderOwned(from, targetIndex);
  }

  function onHandleKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      void reorderOwned(index, index - 1);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      void reorderOwned(index, index + 1);
    }
  }

  function formatPinnedMeta(view: SavedDocumentViewDto, mobile: boolean): string {
    const vis =
      view.visibility === 'shared'
        ? t('savedViews.visibilityShared')
        : t('savedViews.visibilityPrivate');
    const pin = view.pinnedSidebar
      ? mobile
        ? t('savedViews.pinnedStatePinned')
        : t('savedViews.pinnedYes')
      : mobile
        ? t('savedViews.pinnedStateUnpinned')
        : t('savedViews.pinnedNo');
    return `${vis} · ${pin}`;
  }

  function renderActions(view: SavedDocumentViewDto, canEdit: boolean) {
    if (!canEdit) {
      if (view.ownerUserId !== currentUserId) {
        return (
          <span className="muted saved-views-shared-note">{t('savedViews.sharedByOther')}</span>
        );
      }
      return null;
    }
    return (
      <div className="saved-views-manage-actions-cell">
        <Button
          type="button"
          variant="secondary"
          className="btn-compact saved-views-pin-btn"
          onClick={() => void onTogglePin(view)}
        >
          {view.pinnedSidebar ? t('savedViews.unpin') : t('savedViews.pinSidebar')}
        </Button>
        <IconButton
          icon={MoreHorizontal}
          className="saved-views-row-menu-btn"
          label={t('savedViews.rowMenuAria', { name: view.name })}
          expanded={menuOpen && menuView?.id === view.id}
          onClick={(e) => { openMenu(view, e.currentTarget); }}
        />
      </div>
    );
  }

  return (
    <>
      <div className="saved-views-manage-table-wrap card">
        <ul className="saved-views-manage-list">
          {views.map((view) => {
            const canEdit =
              view.ownerUserId === currentUserId ||
              (view.visibility === 'shared' && canManageShared);
            return (
              <li key={view.id} className="saved-views-manage-list-item">
                <div className="saved-views-manage-list-main">
                  <Link
                    to={`${routes.documents}?view=${encodeURIComponent(view.id)}`}
                    className="saved-views-manage-name-link"
                  >
                    {view.name}
                  </Link>
                  <p className="saved-views-manage-list-meta muted">
                    {formatPinnedMeta(view, true)}
                  </p>
                </div>
                <div className="saved-views-manage-list-actions">
                  {renderActions(view, canEdit)}
                </div>
              </li>
            );
          })}
        </ul>
        <table className="saved-views-manage-table">
          <thead>
            <tr>
              <th scope="col" className="saved-views-col-order">
                {t('savedViews.colOrder')}
              </th>
              <th scope="col">{t('savedViews.nameLabel')}</th>
              <th scope="col">{t('savedViews.visibilityLabel')}</th>
              <th scope="col">{t('savedViews.colPinned')}</th>
              <th scope="col" className="saved-views-col-actions">
                {t('savedViews.colActions')}
              </th>
            </tr>
          </thead>
          <tbody>
            {views.map((view) => {
              const canEdit =
                view.ownerUserId === currentUserId ||
                (view.visibility === 'shared' && canManageShared);
              const ownedIndex = owned.findIndex((v) => v.id === view.id);
              const showReorder = ownedIds.has(view.id) && owned.length > 1;

              return (
                <tr
                  key={view.id}
                  onDragOver={(e) => {
                    if (showReorder) e.preventDefault();
                  }}
                  onDrop={() => {
                    if (showReorder && ownedIndex >= 0) onDrop(ownedIndex);
                  }}
                >
                  <td>
                    {showReorder ? (
                      <button
                        type="button"
                        className="saved-views-drag-handle"
                        draggable
                        aria-label={t('savedViews.reorderHandle', { name: view.name })}
                        onDragStart={() => { onDragStart(ownedIndex); }}
                        onKeyDown={(e) => { onHandleKeyDown(ownedIndex, e); }}
                      >
                        <GripVertical size={20} strokeWidth={1.75} aria-hidden />
                      </button>
                    ) : null}
                  </td>
                  <td>
                    {renameId === view.id ? (
                      <form
                        className="saved-views-rename-form"
                        onSubmit={(e) => {
                          e.preventDefault();
                          void onRename(view.id, renameValue).then(() => { setRenameId(null); });
                        }}
                      >
                        <Input
                          value={renameValue}
                          onChange={(e) => { setRenameValue(e.target.value); }}
                          aria-label={t('savedViews.nameLabel')}
                        />
                        <Button type="submit" disabled={busy}>
                          {t('savedViews.saveConfirm')}
                        </Button>
                        <Button type="button" variant="secondary" onClick={() => { setRenameId(null); }}>
                          {t('common.cancel')}
                        </Button>
                      </form>
                    ) : (
                      <Link
                        to={`${routes.documents}?view=${encodeURIComponent(view.id)}`}
                        className="saved-views-manage-name-link"
                      >
                        {view.name}
                      </Link>
                    )}
                  </td>
                  <td>
                    {view.visibility === 'shared'
                      ? t('savedViews.visibilityShared')
                      : t('savedViews.visibilityPrivate')}
                  </td>
                  <td>
                    {view.pinnedSidebar ? t('savedViews.pinnedYes') : t('savedViews.pinnedNo')}
                  </td>
                  <td>{renderActions(view, canEdit)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <ContextMenu
        open={menuOpen && menuView != null}
        x={menuPos.x}
        y={menuPos.y}
        anchorRef={menuAnchorRef}
        onClose={() => { setMenuOpen(false); }}
        items={[
          {
            kind: 'item',
            id: 'rename',
            label: t('savedViews.rename'),
            onSelect: () => {
              if (!menuView) return;
              setRenameId(menuView.id);
              setRenameValue(menuView.name);
              setMenuOpen(false);
            },
          },
          {
            kind: 'item',
            id: 'delete',
            label: t('common.delete'),
            danger: true,
            onSelect: () => {
              if (!menuView) return;
              setDeleteTarget(menuView);
              setMenuOpen(false);
            },
          },
        ]}
      />

      <ConfirmDialog
        open={deleteTarget != null}
        title={t('savedViews.deleteTitle')}
        description={t('savedViews.deleteLead', { name: deleteTarget?.name ?? '' })}
        tone="danger"
        busy={busy}
        onConfirm={() => {
          if (!deleteTarget) return;
          void onDelete(deleteTarget).then(() => { setDeleteTarget(null); });
        }}
        onCancel={() => { setDeleteTarget(null); }}
      />
    </>
  );
}
