// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { LayoutIrDocument, LayoutIrPageSummary } from '@docuvate/contracts';
import { useEffect, useState } from 'react';

import { fetchDocumentLayoutIr } from './api';
import { layoutIrDocumentFromPageSummaries } from './layoutIrPages';

export type LayoutIrLoadState = 'idle' | 'loading' | 'ready' | 'error';

export function useDocumentLayoutIr(
  documentId: string | undefined,
  layoutIrAvailable: boolean,
  layoutIrPages?: LayoutIrPageSummary[]
): {
  layoutIr: LayoutIrDocument | null;
  state: LayoutIrLoadState;
  reload: () => void;
} {
  const [layoutIr, setLayoutIr] = useState<LayoutIrDocument | null>(null);
  const [state, setState] = useState<LayoutIrLoadState>('idle');
  const [reloadToken, setReloadToken] = useState(0);

  const hasPages = (layoutIrPages?.length ?? 0) > 0;
  const pending = layoutIrAvailable && !hasPages;

  useEffect(() => {
    if (!documentId || !layoutIrAvailable) {
      setLayoutIr(null);
      setState('idle');
      return;
    }
    if (pending) {
      setLayoutIr(
        layoutIrPages?.length
          ? layoutIrDocumentFromPageSummaries(layoutIrPages)
          : null
      );
      setState('loading');
      return;
    }

    let active = true;
    setState('loading');
    void fetchDocumentLayoutIr(documentId)
      .then((doc) => {
        if (!active) return;
        setLayoutIr(doc);
        setState('ready');
      })
      .catch(() => {
        if (!active) return;
        setLayoutIr(null);
        setState('error');
      });

    return () => {
      active = false;
    };
  }, [documentId, layoutIrAvailable, pending, layoutIrPages, reloadToken]);

  return {
    layoutIr,
    state,
    reload: () => { setReloadToken((n) => n + 1); },
  };
}
