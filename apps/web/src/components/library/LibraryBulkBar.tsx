// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type {
  DocumentBulkAction,
  DocumentDto,
  FolderDto,
  TagDto,
} from '@docuvate/contracts';
import { type ReactNode, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '../ui/Button';
import { ContextMenuPanel } from '../ui/ContextMenu';
import { Menu, MenuContent, MenuTrigger } from '../ui/overlay/Menu';
import { buildLibraryLabelToggleEntries } from './buildLibraryContextMenuItems';
import { buildFolderContextMenuEntries } from './folderContextMenuEntries';

function BulkBarDropdownMenu({
  label,
  children,
}: {
  label: string;
  children: (closeMenu: () => void) => ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const closeMenu = () => { setOpen(false); };
  return (
    <Menu open={open} onOpenChange={setOpen}>
      <MenuTrigger className="bulk-bar-menu-trigger">{label}</MenuTrigger>
      <MenuContent className="bulk-bar-menu-panel popover-surface" align="start">
        {children(closeMenu)}
      </MenuContent>
    </Menu>
  );
}

interface LibraryBulkBarProps {
  selectedCount: number;
  totalCount?: number | null;
  selectionScope?: 'none' | 'loaded' | 'all-matching';
  onSelectAllMatching?: () => void;
  showIdleHint?: boolean;
  bulkBusy: boolean;
  selectedIds: string[];
  items: DocumentDto[];
  tags: TagDto[];
  folders: FolderDto[];
  onRunBulk: (action: DocumentBulkAction, options?: { keepMenuOpen?: boolean }) => void;
  onRequestBulkDelete: (count: number) => void;
  onClearSelection: () => void;
  onRequestBulkMove?: () => void;
}

export function LibraryBulkBar(props: LibraryBulkBarProps) {
  const { t } = useTranslation();
  const active = props.selectedCount > 0;
  const total = props.totalCount ?? null;
  const showSelectAllMatching =
    active &&
    total !== null &&
    total > props.selectedCount &&
    props.selectionScope !== 'all-matching' &&
    props.onSelectAllMatching !== undefined;
  const countLabel =
    props.selectionScope === 'all-matching' && total !== null
      ? t('library.bulkAllMatchingSelected', { total })
      : total !== null && props.selectedCount > 0 && props.selectedCount < total
        ? t('library.bulkSelectedOfTotal', { selected: props.selectedCount, total })
        : t('library.bulkSelectedCount', { count: props.selectedCount });

  const selectedDocuments = useMemo(
    () =>
      props.selectedIds
        .map((id) => props.items.find((doc) => doc.id === id))
        .filter((doc): doc is DocumentDto => doc !== undefined),
    [props.items, props.selectedIds]
  );

  const labelMenuItems = useMemo(
    () =>
      props.tags.length > 0
        ? buildLibraryLabelToggleEntries(props.tags, selectedDocuments, props.onRunBulk)
        : [
            {
              kind: 'item' as const,
              id: 'no-tags',
              label: t('common.noLabels'),
              disabled: true,
              onSelect: () => undefined,
            },
          ],
    [props.onRunBulk, props.tags, selectedDocuments, t]
  );

  const folderMenuItems = useMemo(
    () => buildFolderContextMenuEntries(props.folders, props.onRunBulk, t),
    [props.folders, props.onRunBulk, t]
  );

  return (
    <div
      className={`bulk-bar bulk-bar-compact bulk-bar-slot${active ? ' bulk-bar-slot-active' : ' bulk-bar-slot-idle'}`}
      role="region"
      aria-label={t('library.bulkBarAria')}
    >
      {active ? (
        <>
          <span className="bulk-bar-count">
            {countLabel}
            {props.bulkBusy ? ` · ${t('library.bulkApplying')}` : ''}
          </span>
          {showSelectAllMatching ? (
            <Button
              type="button"
              variant="secondary"
              className="bulk-bar-select-all-matching"
              disabled={props.bulkBusy}
              onClick={() => {
                props.onSelectAllMatching?.();
              }}
            >
              {t('library.bulkSelectAllMatching', { total })}
            </Button>
          ) : null}
          <div className="bulk-bar-actions">
            <BulkBarDropdownMenu label={t('library.contextLabels')}>
              {(closeMenu) => (
                <ContextMenuPanel items={labelMenuItems} onClose={closeMenu} depth={0} />
              )}
            </BulkBarDropdownMenu>
            {props.onRequestBulkMove ? (
              <Button
                type="button"
                variant="secondary"
                className="bulk-bar-action-btn"
                disabled={props.bulkBusy}
                onClick={props.onRequestBulkMove}
              >
                {t('filesystem.bulkMove')}
              </Button>
            ) : (
              <BulkBarDropdownMenu label={t('library.contextSetFolder')}>
                {(closeMenu) => (
                  <ContextMenuPanel items={folderMenuItems} onClose={closeMenu} depth={0} />
                )}
              </BulkBarDropdownMenu>
            )}
            <Button
              type="button"
              variant="ghost"
              className="bulk-bar-action-btn bulk-bar-action-danger"
              disabled={props.bulkBusy}
              onClick={() => { props.onRequestBulkDelete(props.selectedCount); }}
            >
              {t('common.delete')}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="bulk-bar-action-btn"
              disabled={props.bulkBusy}
              onClick={props.onClearSelection}
            >
              {t('library.bulkClearSelection')}
            </Button>
          </div>
        </>
      ) : props.showIdleHint ? (
        <span className="muted bulk-bar-idle-hint">{t('library.bulkIdleHint')}</span>
      ) : null}
    </div>
  );
}
