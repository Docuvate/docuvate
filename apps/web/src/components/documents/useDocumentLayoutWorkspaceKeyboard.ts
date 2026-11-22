// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { useEffect } from 'react';

import type { StructuringPrimary } from '../../lib/structuringRibbon';
import type { DocumentSelectionDraft } from './DocumentSelectionLayer';
import type { DocumentSelectionTool } from './DocumentSelectionTools';

interface LayoutWorkspaceKeyboardArgs {
  structuringPrimary: StructuringPrimary | null | undefined;
  pdfOverlayCount: number;
  selectionDraft: DocumentSelectionDraft | null;
  reanchorFieldKey: string | null;
  selectionMarkTableEnabled: boolean;
  onStructuringPrimaryChange?: (primary: StructuringPrimary) => void;
  setActiveOverlayId: (id: string | null) => void;
  setSelectionDraft: (draft: DocumentSelectionDraft | null) => void;
  setSelectionTool: (tool: DocumentSelectionTool) => void;
  setReanchorFieldKey: (key: string | null) => void;
  setOverlayEnabled: (update: boolean | ((enabled: boolean) => boolean)) => void;
  markTableFromSelection: () => void;
  onReanchorEnter: () => void;
}

/** Layout shortcuts: Escape clears, T/R tools, O overlay, M mark table, Enter reanchor. */
export function useDocumentLayoutWorkspaceKeyboard(args: LayoutWorkspaceKeyboardArgs): void {
  const {
    structuringPrimary,
    pdfOverlayCount,
    selectionDraft,
    reanchorFieldKey,
    selectionMarkTableEnabled,
    onStructuringPrimaryChange,
    setActiveOverlayId,
    setSelectionDraft,
    setSelectionTool,
    setReanchorFieldKey,
    setOverlayEnabled,
    markTableFromSelection,
    onReanchorEnter,
  } = args;

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target;
      if (target instanceof HTMLElement) {
        const tag = target.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || target.isContentEditable) {
          return;
        }
      }
      if (event.key === 'Escape') {
        // Popovers (family menu, combobox) close on Escape first — do not drop the
        // selected table/field or the ribbon tools vanish under the closed menu.
        setActiveOverlayId(null);
        setSelectionDraft(null);
        setSelectionTool(structuringPrimary === 'layout' ? 'rect' : 'none');
        setReanchorFieldKey(null);
        return;
      }
      if (event.key === 't' || event.key === 'T') {
        onStructuringPrimaryChange?.('layout');
        setReanchorFieldKey(null);
        setSelectionTool('text');
        return;
      }
      if (event.key === 'r' || event.key === 'R') {
        onStructuringPrimaryChange?.('layout');
        setReanchorFieldKey(null);
        setSelectionTool('rect');
        return;
      }
      if (
        (event.key === 'o' || event.key === 'O') &&
        structuringPrimary === 'layout' &&
        pdfOverlayCount > 0
      ) {
        event.preventDefault();
        setOverlayEnabled((enabled) => !enabled);
        return;
      }
      if (
        (event.key === 'm' || event.key === 'M') &&
        structuringPrimary === 'layout' &&
        selectionDraft &&
        !reanchorFieldKey &&
        selectionMarkTableEnabled
      ) {
        event.preventDefault();
        markTableFromSelection();
        return;
      }
      if (event.key === 'Enter' && selectionDraft && reanchorFieldKey) {
        event.preventDefault();
        onReanchorEnter();
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => {
      window.removeEventListener('keydown', onKey, true);
    };
  }, [
    markTableFromSelection,
    onReanchorEnter,
    onStructuringPrimaryChange,
    pdfOverlayCount,
    reanchorFieldKey,
    selectionDraft,
    selectionMarkTableEnabled,
    setActiveOverlayId,
    setOverlayEnabled,
    setReanchorFieldKey,
    setSelectionDraft,
    setSelectionTool,
    structuringPrimary,
  ]);
}
