import { useCallback, useState } from 'react';
import i18n from '../i18n';
import { uploadDocument } from './api';
import { formatUserFacingError } from './apiErrors';
import {
  applyDocumentUploadAssignment,
  type DocumentUploadAssignment,
} from './documentUploadAssignment';
import { uploadPlacementFromAssignment } from './uploadPlacementFromAssignment';
import { isAllowedUploadMime, UPLOAD_MAX_BYTES } from './documentUploadConstants';

export type UploadItemStatus = 'pending' | 'uploading' | 'done' | 'error';

export interface UploadItem {
  id: string;
  file: File;
  status: UploadItemStatus;
  error?: string;
}

async function runPool<T>(items: T[], concurrency: number, fn: (item: T) => Promise<void>) {
  const limit = Math.min(concurrency, items.length);
  if (limit === 0) return;
  let cursor = 0;
  const worker = async (): Promise<void> => {
    const item = items[cursor];
    cursor += 1;
    if (item === undefined) return;
    await fn(item);
    return worker();
  };
  await Promise.all(Array.from({ length: limit }, () => worker()));
}

export function useDocumentUploadQueue(onUploaded?: () => void) {
  const [queue, setQueue] = useState<UploadItem[]>([]);

  const updateItem = useCallback((id: string, patch: Partial<UploadItem>) => {
    setQueue((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }, []);

  const enqueueFiles = useCallback(
    (files: FileList | File[], assignment: DocumentUploadAssignment) => {
      const list = Array.from(files).filter((f) => f.size > 0);
      if (list.length === 0) return;

      const items: UploadItem[] = list.map((file) => ({
        id: `${file.name}-${file.size}-${file.lastModified}-${Math.random()}`,
        file,
        status: 'pending',
      }));
      setQueue((prev) => [...items, ...prev].slice(0, 120));

      void runPool(items, 6, async (item) => {
        if (item.file.size > UPLOAD_MAX_BYTES) {
          updateItem(item.id, { status: 'error', error: i18n.t('upload.errorFileTooLarge') });
          return;
        }
        const mime = item.file.type;
        if (mime && !isAllowedUploadMime(mime)) {
          updateItem(item.id, {
            status: 'error',
            error: i18n.t('upload.errorUnsupportedType'),
          });
          return;
        }
        updateItem(item.id, { status: 'uploading' });
        try {
          const placement = uploadPlacementFromAssignment(assignment);
          const doc = await uploadDocument(item.file, placement);
          if (!placement) {
            await applyDocumentUploadAssignment(doc.id, assignment);
          }
          updateItem(item.id, { status: 'done' });
          onUploaded?.();
        } catch (err) {
          updateItem(item.id, {
            status: 'error',
            error: formatUserFacingError(err, 'errors.uploadFailed'),
          });
        }
      });
    },
    [onUploaded, updateItem]
  );

  const clearTerminalItems = useCallback(() => {
    setQueue((prev) => prev.filter((item) => item.status === 'pending' || item.status === 'uploading'));
  }, []);

  const removeUploadItem = useCallback((id: string) => {
    setQueue((prev) => prev.filter((item) => item.id !== id));
  }, []);

  return { queue, enqueueFiles, clearTerminalItems, removeUploadItem };
}
