// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { createContext, useContext } from 'react';

import type { LibraryDropTarget } from '../../lib/documentUploadAssignment';
import type { useDocumentUploadQueue } from '../../lib/useDocumentUploadQueue';

interface DocumentUploadContextValue {
  dropTarget: LibraryDropTarget;
  queue: ReturnType<typeof useDocumentUploadQueue>['queue'];
  enqueueFiles: ReturnType<typeof useDocumentUploadQueue>['enqueueFiles'];
  clearTerminalItems: ReturnType<typeof useDocumentUploadQueue>['clearTerminalItems'];
  removeUploadItem: ReturnType<typeof useDocumentUploadQueue>['removeUploadItem'];
}

export const DocumentUploadContext = createContext<DocumentUploadContextValue | null>(null);

export function useDocumentUploadContext(): DocumentUploadContextValue {
  const ctx = useContext(DocumentUploadContext);
  if (!ctx) {
    throw new Error('useDocumentUploadContext must be used within DocumentUploadProvider');
  }
  return ctx;
}
