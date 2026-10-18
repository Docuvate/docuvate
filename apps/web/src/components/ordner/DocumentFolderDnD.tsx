// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import {
  DndContext,
  type DragEndEvent,
  type DragOverEvent,
  DragOverlay,
  type DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DocumentDto } from '@docuvate/contracts';
import { Folder } from 'lucide-react';
import {
  createContext,
  type CSSProperties,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';

import { moveDocuments } from '../../lib/api';
import { formatUserFacingError } from '../../lib/apiErrors';
import { useToastNotify } from '../save/ToastProvider';
import {
  type DocumentDragData,
  documentDragId,
  folderDropId,
  parseFolderDropTargetId,
  UNASSIGNED_FOLDER_DROP_ID,
} from './documentFolderDnDIds';

interface DocumentFolderDnDContextValue {
  enabled: boolean;
  activeDropTargetId: string | null;
}

const DocumentFolderDnDContext = createContext<DocumentFolderDnDContextValue>({
  enabled: false,
  activeDropTargetId: null,
});

export function useDocumentFolderDnDActiveDropId(): string | null {
  return useContext(DocumentFolderDnDContext).activeDropTargetId;
}

interface DocumentFolderDnDProviderProps {
  documents: DocumentDto[];
  selectedDocumentIds: Set<string>;
  onMoved: () => void;
  onMoveError?: (message: string) => void;
  children: ReactNode;
}

export function DocumentFolderDnDProvider({
  documents,
  selectedDocumentIds,
  onMoved,
  onMoveError,
  children,
}: DocumentFolderDnDProviderProps) {
  const { t } = useTranslation();
  const { pushSuccess, pushError } = useToastNotify();
  const [activeDrag, setActiveDrag] = useState<DocumentDragData | null>(null);
  const [activeDropTargetId, setActiveDropTargetId] = useState<string | null>(null);
  const [liveMessage, setLiveMessage] = useState('');

  const documentsById = useMemo(() => new Map(documents.map((d) => [d.id, d])), [documents]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor)
  );

  const resolveDragIds = useCallback(
    (primaryId: string): string[] => {
      if (selectedDocumentIds.has(primaryId) && selectedDocumentIds.size > 0) {
        return [...selectedDocumentIds];
      }
      return [primaryId];
    },
    [selectedDocumentIds]
  );

  const onDragStart = useCallback(
    (event: DragStartEvent) => {
      const id = String(event.active.id);
      if (!id.startsWith('document:')) return;
      const primaryDocumentId = id.slice('document:'.length);
      const documentIds = resolveDragIds(primaryDocumentId);
      const doc = documentsById.get(primaryDocumentId);
      const label =
        documentIds.length > 1
          ? t('filesystem.dndDragCount', { count: documentIds.length })
          : (doc?.title ?? t('library.contextMenuSingleFallback'));
      setActiveDrag({
        type: 'document',
        documentIds,
        primaryDocumentId,
        label,
      });
    },
    [documentsById, resolveDragIds, t]
  );

  const onDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveDropTargetId(null);
      setActiveDrag(null);

      const activeKey = String(event.active.id);
      if (!activeKey.startsWith('document:')) return;
      const primaryDocumentId = activeKey.slice('document:'.length);
      const documentIds = resolveDragIds(primaryDocumentId);

      const folderTarget = parseFolderDropTargetId(event.over?.id);
      if (folderTarget === undefined) return;

      void (async () => {
        try {
          const response = await moveDocuments({
            documentIds,
            folderId: folderTarget,
          });
          onMoved();
          const overData = event.over?.data.current;
          const folderNameFromDrop =
            overData && typeof overData.folderName === 'string' ? overData.folderName : undefined;
          const folderLabel =
            folderTarget === null
              ? t('filesystem.withoutFolder')
              : (folderNameFromDrop ?? t('common.folder'));
          const message =
            documentIds.length === 1
              ? t('filesystem.dndMovedOne', { folder: folderLabel })
              : t('filesystem.dndMovedMany', { count: documentIds.length, folder: folderLabel });
          setLiveMessage(message);

          const undoGroups = new Map<string | null, string[]>();
          for (const prev of response.previousFolderIds) {
            const list = undoGroups.get(prev.folderId) ?? [];
            list.push(prev.documentId);
            undoGroups.set(prev.folderId, list);
          }

          pushSuccess(message, {
            undo: () => {
              void (async () => {
                try {
                  for (const [folderId, ids] of undoGroups) {
                    await moveDocuments({ documentIds: ids, folderId });
                  }
                  onMoved();
                  setLiveMessage(t('filesystem.dndUndoDone'));
                } catch (err) {
                  pushError(formatUserFacingError(err, 'errors.actionFailed'));
                }
              })();
            },
          });
        } catch (err) {
          const message = formatUserFacingError(err, 'errors.actionFailed');
          onMoveError?.(message);
          pushError(message);
        }
      })();
    },
    [onMoveError, onMoved, pushError, pushSuccess, resolveDragIds, t]
  );

  const onDragOver = useCallback((event: DragOverEvent) => {
    const overId = event.over?.id;
    if (overId == null) {
      setActiveDropTargetId(null);
      return;
    }
    const parsed = parseFolderDropTargetId(overId);
    if (parsed === undefined) {
      setActiveDropTargetId(null);
      return;
    }
    setActiveDropTargetId(String(overId));
  }, []);

  const ctx = useMemo(
    (): DocumentFolderDnDContextValue => ({
      enabled: true,
      activeDropTargetId,
    }),
    [activeDropTargetId]
  );

  return (
    <DocumentFolderDnDContext.Provider value={ctx}>
      <DndContext
        sensors={sensors}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onDragOver={onDragOver}
        onDragCancel={() => {
          setActiveDrag(null);
          setActiveDropTargetId(null);
        }}
      >
        {children}
        <div className="sr-only" aria-live="polite" aria-atomic="true">
          {liveMessage}
        </div>
        <DragOverlay dropAnimation={null}>
          {activeDrag ? (
            <div className="filesystem-dnd-ghost" aria-hidden>
              <Folder size={18} strokeWidth={1.75} />
              <span>{activeDrag.label}</span>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </DocumentFolderDnDContext.Provider>
  );
}

interface UseDocumentDraggableOptions {
  documentId: string;
  disabled?: boolean;
}

export function useDocumentDraggable({ documentId, disabled }: UseDocumentDraggableOptions) {
  const ctx = useContext(DocumentFolderDnDContext);
  const id = documentDragId(documentId);
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id,
    disabled: disabled === true || !ctx.enabled,
    data: { type: 'document' satisfies DocumentDragData['type'] },
  });

  const style: CSSProperties | undefined = isDragging ? { opacity: 0.35 } : undefined;

  return { setNodeRef, listeners, attributes, isDragging, style };
}

interface UseFolderDropTargetOptions {
  folderId: string | null;
  folderName: string;
}

export function useFolderDropTarget({ folderId, folderName }: UseFolderDropTargetOptions) {
  const ctx = useContext(DocumentFolderDnDContext);
  const id = folderId === null ? UNASSIGNED_FOLDER_DROP_ID : folderDropId(folderId);
  const { setNodeRef, isOver } = useDroppable({
    id,
    disabled: !ctx.enabled,
    data: { folderName },
  });
  const highlighted =
    isOver || (ctx.activeDropTargetId != null && ctx.activeDropTargetId === id);
  return { setNodeRef, highlighted };
}
