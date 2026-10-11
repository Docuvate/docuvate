// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type {
  DocumentBulkAction,
  DocumentDto,
  FolderDto,
  MappeDto,
  TagDto,
} from '@docuvate/contracts';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '../ui/Button';
import { ContextMenuPanel } from '../ui/ContextMenu';
import { buildLibraryLabelToggleEntries } from './buildLibraryContextMenuItems';
import { buildFolderContextMenuEntries } from './folderContextMenuEntries';

function closeBulkBarMenus() {
  document.querySelectorAll('.bulk-bar-menu[open]').forEach((node) => {
    if (node instanceof HTMLDetailsElement) {
      node.open = false;
    }
  });
}

interface LibraryBulkBarProps {
  selectedCount: number;
  showIdleHint?: boolean;
  bulkBusy: boolean;
  selectedIds: string[];
  items: DocumentDto[];
  tags: TagDto[];
  folders: FolderDto[];
  mappen: MappeDto[];
  onRunBulk: (action: DocumentBulkAction, options?: { keepMenuOpen?: boolean }) => void;
  onRequestBulkDelete: (count: number) => void;
  onClearSelection: () => void;
}

export function LibraryBulkBar(props: LibraryBulkBarProps) {
  const { t } = useTranslation();
  const active = props.selectedCount > 0;

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
    () => buildFolderContextMenuEntries(props.folders, props.mappen, props.onRunBulk, t),
    [props.folders, props.mappen, props.onRunBulk, t]
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
            {t('library.bulkSelectedCount', { count: props.selectedCount })}
            {props.bulkBusy ? ` · ${t('library.bulkApplying')}` : ''}
          </span>
          <div className="bulk-bar-actions">
            <details className="bulk-bar-menu">
              <summary className="bulk-bar-menu-trigger">{t('library.contextLabels')}</summary>
              <div className="bulk-bar-menu-panel">
                <ContextMenuPanel items={labelMenuItems} onClose={closeBulkBarMenus} depth={0} />
              </div>
            </details>
            <details className="bulk-bar-menu">
              <summary className="bulk-bar-menu-trigger">{t('library.contextSetFolder')}</summary>
              <div className="bulk-bar-menu-panel">
                <ContextMenuPanel items={folderMenuItems} onClose={closeBulkBarMenus} depth={0} />
              </div>
            </details>
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
