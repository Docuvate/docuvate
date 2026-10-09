// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { useEffect, useRef, useState } from 'react';
import { isFileDrag } from '../../lib/documentUploadConstants';
import { useDocumentUploadContext } from './DocumentUploadProvider';

export function GlobalPageDropOverlay() {
  const { dropTarget, enqueueFiles } = useDocumentUploadContext();
  const [active, setActive] = useState(false);
  const depthRef = useRef(0);

  useEffect(() => {
    if (!dropTarget.enabled) {
      depthRef.current = 0;
      setActive(false);
      return;
    }

    const onDragEnter = (e: DragEvent) => {
      if (!isFileDrag(e.dataTransfer)) return;
      depthRef.current += 1;
      setActive(true);
    };

    const onDragOver = (e: DragEvent) => {
      if (!isFileDrag(e.dataTransfer)) return;
      e.preventDefault();
      if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
    };

    const onDragLeave = (e: DragEvent) => {
      if (!isFileDrag(e.dataTransfer)) return;
      depthRef.current = Math.max(0, depthRef.current - 1);
      if (depthRef.current === 0) setActive(false);
    };

    const onDrop = (e: DragEvent) => {
      if (!isFileDrag(e.dataTransfer)) return;
      e.preventDefault();
      depthRef.current = 0;
      setActive(false);
      if (e.dataTransfer?.files.length) {
        enqueueFiles(e.dataTransfer.files, dropTarget.assignment);
      }
    };

    window.addEventListener('dragenter', onDragEnter);
    window.addEventListener('dragover', onDragOver);
    window.addEventListener('dragleave', onDragLeave);
    window.addEventListener('drop', onDrop);
    return () => {
      window.removeEventListener('dragenter', onDragEnter);
      window.removeEventListener('dragover', onDragOver);
      window.removeEventListener('dragleave', onDragLeave);
      window.removeEventListener('drop', onDrop);
    };
  }, [dropTarget.assignment, dropTarget.enabled, enqueueFiles]);

  if (!dropTarget.enabled || !active) return null;

  return (
    <div
      className="page-drop-overlay"
      role="region"
      aria-label={dropTarget.overlayTitle}
      onDragOver={(e) => {
        e.preventDefault();
        if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
      }}
    >
      <div className="page-drop-overlay-panel">
        <p className="page-drop-overlay-title">{dropTarget.overlayTitle}</p>
        <p className="muted page-drop-overlay-hint">{dropTarget.overlayHint}</p>
      </div>
    </div>
  );
}
