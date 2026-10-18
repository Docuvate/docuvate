// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { createContext, type ReactNode,useContext, useMemo } from 'react';

import type { LibraryDropTarget } from '../../lib/documentUploadAssignment';
import { useDocumentUploadQueue } from '../../lib/useDocumentUploadQueue';
import { GlobalPageDropOverlay } from './GlobalPageDropOverlay';

interface DocumentUploadContextValue {
  dropTarget: LibraryDropTarget;
  queue: ReturnType<typeof useDocumentUploadQueue>['queue'];
  enqueueFiles: ReturnType<typeof useDocumentUploadQueue>['enqueueFiles'];
  clearTerminalItems: ReturnType<typeof useDocumentUploadQueue>['clearTerminalItems'];
  removeUploadItem: ReturnType<typeof useDocumentUploadQueue>['removeUploadItem'];
}

const DocumentUploadContext = createContext<DocumentUploadContextValue | null>(null);

export function DocumentUploadProvider({
  dropTarget,
  onUploaded,
  children,
}: {
  dropTarget: LibraryDropTarget;
  onUploaded?: () => void;
  children: ReactNode;
}) {
  const { queue, enqueueFiles, clearTerminalItems, removeUploadItem } =
    useDocumentUploadQueue(onUploaded);
  const value = useMemo(
    () => ({ dropTarget, queue, enqueueFiles, clearTerminalItems, removeUploadItem }),
    [dropTarget, queue, enqueueFiles, clearTerminalItems, removeUploadItem]
  );

  return (
    <DocumentUploadContext.Provider value={value}>
      {children}
      <GlobalPageDropOverlay />
    </DocumentUploadContext.Provider>
  );
}

export function useDocumentUploadContext(): DocumentUploadContextValue {
  const ctx = useContext(DocumentUploadContext);
  if (!ctx) {
    throw new Error('useDocumentUploadContext must be used within DocumentUploadProvider');
  }
  return ctx;
}
