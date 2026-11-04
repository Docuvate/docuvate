// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { type ReactNode, useMemo } from 'react';

import type { LibraryDropTarget } from '../../lib/documentUploadAssignment';
import { useDocumentUploadQueue } from '../../lib/useDocumentUploadQueue';
import { DocumentUploadContext } from './documentUploadContext';
import { GlobalPageDropOverlay } from './GlobalPageDropOverlay';

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
