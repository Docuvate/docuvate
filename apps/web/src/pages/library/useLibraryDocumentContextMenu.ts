// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { DocumentBulkAction } from '@docuvate/contracts';
import {
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { buildLibraryContextMenuItems } from '../../components/library/buildLibraryContextMenuItems';
import {
  contextMenuTitleForSelection,
  resolveContextMenuSelectedIds,
} from '../../lib/libraryContextMenuTarget';
import type { useLibraryPageData } from './useLibraryPageData';

type LibraryData = ReturnType<typeof useLibraryPageData>;

interface LibraryContextMenuState {
  x: number;
  y: number;
  documentId: string;
  selectedIds: string[];
}

export function useLibraryDocumentContextMenu(data: LibraryData) {
  const { t, i18n } = useTranslation();
  const { selectForContextMenu, runBulk, selected, items, tags, folders, mappen, bulkBusy } = data;
  const navigate = useNavigate();
  const contextMenuAnchorRef = useRef<HTMLElement | null>(null);
  const [contextMenu, setContextMenu] = useState<LibraryContextMenuState | null>(null);
  const [stackReview, setStackReview] = useState<{
    primaryId: string;
    versionId: string | null;
  } | null>(null);
  const [bulkDeleteConfirmCount, setBulkDeleteConfirmCount] = useState<number | null>(null);

  const closeContextMenu = useCallback(() => {
    contextMenuAnchorRef.current = null;
    setContextMenu(null);
  }, []);

  const openDocumentContextMenuAt = useCallback(
    (anchor: HTMLElement, documentId: string, clientX: number, clientY: number) => {
      contextMenuAnchorRef.current = anchor;

      const selectedIds = resolveContextMenuSelectedIds(documentId, selected);
      if (!selected.has(documentId) || selected.size === 0) {
        selectForContextMenu(documentId);
      }

      setContextMenu({
        x: clientX,
        y: clientY,
        documentId,
        selectedIds,
      });
    },
    [selectForContextMenu, selected]
  );

  const openDocumentContextMenu = useCallback(
    (event: MouseEvent, documentId: string) => {
      event.preventDefault();
      const anchor = event.currentTarget;
      if (!(anchor instanceof HTMLElement)) {
        return;
      }
      openDocumentContextMenuAt(anchor, documentId, event.clientX, event.clientY);
    },
    [openDocumentContextMenuAt]
  );

  const openDocumentContextMenuFromRowAction = useCallback(
    (event: MouseEvent, documentId: string) => {
      event.preventDefault();
      event.stopPropagation();
      const anchor = event.currentTarget.closest('tr');
      if (!(anchor instanceof HTMLElement)) {
        return;
      }
      const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
      openDocumentContextMenuAt(anchor, documentId, rect.left, rect.bottom);
    },
    [openDocumentContextMenuAt]
  );

  const openDocumentContextMenuFromKeyboard = useCallback(
    (event: ReactKeyboardEvent, documentId: string) => {
      event.preventDefault();
      const anchor = event.currentTarget;
      if (!(anchor instanceof HTMLElement)) {
        return;
      }
      const rect = anchor.getBoundingClientRect();
      openDocumentContextMenuAt(anchor, documentId, rect.left + rect.width * 0.35, rect.top);
    },
    [openDocumentContextMenuAt]
  );

  const contextMenuTitle = useMemo(() => {
    if (!contextMenu) return undefined;
    return contextMenuTitleForSelection(contextMenu.selectedIds, items, {
      singleFallback: t('library.contextMenuSingleFallback'),
      multiple: (count) => t('library.contextMenuMultiple', { count }),
    });
  }, [contextMenu, items, t, i18n.language]);

  const contextMenuItems = useMemo(() => {
    if (!contextMenu) return [];
    const anchorDoc = items.find((d) => d.id === contextMenu.documentId);
    if (!anchorDoc) return [];
    return buildLibraryContextMenuItems(
      {
        anchorDoc,
        selectedIds: contextMenu.selectedIds,
        items,
        tags,
        folders,
        mappen,
        onNavigate: (path) => { navigate(path); },
        onReviewStack: (primaryId) => {
          setStackReview({ primaryId, versionId: null });
        },
        onRunBulk: (action: DocumentBulkAction, options?: { keepMenuOpen?: boolean }) => {
          if (!options?.keepMenuOpen) {
            closeContextMenu();
          }
          void runBulk(action);
        },
        onRequestBulkDelete: (count: number) => {
          closeContextMenu();
          setBulkDeleteConfirmCount(count);
        },
      },
      t
    );
  }, [
    contextMenu,
    items,
    tags,
    folders,
    mappen,
    runBulk,
    navigate,
    closeContextMenu,
    t,
    i18n.language,
  ]);

  const requestBulkDelete = useCallback((count: number) => {
    setBulkDeleteConfirmCount(count);
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeContextMenu();
        return;
      }
      if (event.key !== 'Delete' || selected.size === 0 || bulkBusy) {
        return;
      }
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        (target.isContentEditable ||
          target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT')
      ) {
        return;
      }
      event.preventDefault();
      setBulkDeleteConfirmCount(selected.size);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => { window.removeEventListener('keydown', onKeyDown); };
  }, [closeContextMenu, selected.size, bulkBusy]);

  const cancelBulkDeleteConfirm = useCallback(() => { setBulkDeleteConfirmCount(null); }, []);

  const confirmBulkDelete = useCallback(async () => {
    setBulkDeleteConfirmCount(null);
    await runBulk({ action: 'delete' });
  }, [runBulk]);

  return {
    contextMenu,
    contextMenuTitle,
    contextMenuItems,
    contextMenuAnchorRef,
    closeContextMenu,
    openDocumentContextMenu,
    openDocumentContextMenuFromRowAction,
    openDocumentContextMenuFromKeyboard,
    stackReview,
    setStackReview,
    bulkDeleteConfirmCount,
    cancelBulkDeleteConfirm,
    confirmBulkDelete,
    requestBulkDelete,
  };
}
