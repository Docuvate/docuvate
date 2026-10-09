// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { TFunction } from 'i18next';
import type {
  DocumentBulkAction,
  DocumentDto,
  FolderDto,
  MappeDto,
  TagDto,
} from '@docuvate/contracts';
import type { ContextMenuEntry } from '../ui/ContextMenu';
import { routes } from '../../lib/routes';
import { buildFolderContextMenuEntries } from './folderContextMenuEntries';
import { showDuplicateStackBadge } from './duplicateStackLabel';

interface BuildLibraryContextMenuItemsArgs {
  anchorDoc: DocumentDto;
  selectedIds: string[];
  items: DocumentDto[];
  tags: TagDto[];
  folders: FolderDto[];
  mappen: MappeDto[];
  onNavigate: (path: string) => void;
  onReviewStack: (primaryId: string) => void;
  onRunBulk: (action: DocumentBulkAction, options?: { keepMenuOpen?: boolean }) => void;
  onRequestBulkDelete: (count: number) => void;
}

export function buildLibraryLabelToggleEntries(
  tags: TagDto[],
  selectedDocuments: DocumentDto[],
  onRunBulk: (action: DocumentBulkAction, options?: { keepMenuOpen?: boolean }) => void
): ContextMenuEntry[] {
  return tags.map((tag) => {
    const checked = tagCheckedStateForDocuments(tag.id, selectedDocuments);
    const keepMenuOpen = { keepMenuOpen: true as const };
    return {
      kind: 'toggleItem' as const,
      id: `label-${tag.id}`,
      label: tag.name,
      checked,
      onToggle: () => {
        if (checked === true) {
          onRunBulk({ action: 'removeTag', tagId: tag.id }, keepMenuOpen);
        } else {
          onRunBulk({ action: 'addTag', tagId: tag.id }, keepMenuOpen);
        }
      },
      onRemove: () => onRunBulk({ action: 'removeTag', tagId: tag.id }, keepMenuOpen),
    };
  });
}

export function tagCheckedStateForDocuments(
  tagId: string,
  documents: DocumentDto[]
): boolean | 'mixed' {
  if (documents.length === 0) return false;
  let withTag = 0;
  for (const doc of documents) {
    if (doc.tags?.some((t) => t.id === tagId)) withTag += 1;
  }
  if (withTag === 0) return false;
  if (withTag === documents.length) return true;
  return 'mixed';
}

export function buildLibraryContextMenuItems(
  args: BuildLibraryContextMenuItemsArgs,
  t: TFunction
): ContextMenuEntry[] {
  const {
    anchorDoc,
    selectedIds,
    items,
    tags,
    folders,
    mappen,
    onNavigate,
    onReviewStack,
    onRunBulk,
    onRequestBulkDelete,
  } = args;
  const single = selectedIds.length === 1;
  const anchorInSelection = selectedIds.includes(anchorDoc.id);
  const focusDoc =
    anchorInSelection && single
      ? anchorDoc
      : (args.items.find((d) => d.id === selectedIds[0]) ?? anchorDoc);
  const hasStack = showDuplicateStackBadge(focusDoc);

  const menu: ContextMenuEntry[] = [];

  if (single) {
    if (hasStack) {
      menu.push({
        kind: 'item',
        id: 'review',
        label: t('library.contextReview'),
        onSelect: () => onReviewStack(focusDoc.id),
      });
    } else {
      menu.push({
        kind: 'item',
        id: 'open',
        label: t('library.contextOpen'),
        onSelect: () => onNavigate(routes.document(focusDoc.id)),
      });
    }
    menu.push({ kind: 'separator' });
  }

  const selectedDocuments = selectedIds
    .map((id) => items.find((doc) => doc.id === id))
    .filter((doc): doc is DocumentDto => doc !== undefined);

  const labelToggleItems = buildLibraryLabelToggleEntries(tags, selectedDocuments, onRunBulk);

  menu.push(
    {
      kind: 'submenu',
      id: 'labels',
      label: t('library.contextLabels'),
      items:
        labelToggleItems.length > 0
          ? labelToggleItems
          : [
              {
                kind: 'item',
                id: 'no-tags',
                label: t('common.noLabels'),
                disabled: true,
                onSelect: () => undefined,
              },
            ],
    },
    {
      kind: 'submenu',
      id: 'folder',
      label: t('library.contextSetFolder'),
      items: buildFolderContextMenuEntries(folders, mappen, onRunBulk, t),
    }
  );

  if (single && hasStack && focusDoc.duplicateStack?.pendingReview) {
    menu.push({
      kind: 'item',
      id: 'review-stack',
      label: t('library.contextReviewStack'),
      onSelect: () => onReviewStack(focusDoc.id),
    });
  }

  menu.push({ kind: 'separator' });
  menu.push({
    kind: 'item',
    id: 'delete',
    label: t('common.delete'),
    danger: true,
    onSelect: () => onRequestBulkDelete(selectedIds.length),
  });

  return menu;
}
