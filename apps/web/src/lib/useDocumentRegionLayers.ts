// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { DocumentRegionDto, LayoutToken } from '@docuvate/contracts';
import { useCallback, useEffect, useRef, useState } from 'react';

import { listDocumentLayoutTokens, listDocumentRegions } from './api';

interface DocumentRegionLayers {
  layoutTokens: LayoutToken[];
  fieldRegions: DocumentRegionDto[];
  tableRegions: DocumentRegionDto[];
  /** Reloads tokens and regions; resolves once the latest request has been applied. */
  refreshRegions: () => Promise<void>;
}

/**
 * Loads OCR tokens for the visible page plus saved field/table regions.
 *
 * `layoutIrRevision` must change whenever the persisted layout IR can have changed
 * (reprocess finished, status flip): selection resolves words against these tokens,
 * so tokens fetched before the IR existed must not outlive it. Responses of superseded
 * requests (fast page switches) are dropped instead of overwriting newer state.
 */
export function useDocumentRegionLayers(
  documentId: string,
  page: number,
  layoutIrRevision: string
): DocumentRegionLayers {
  const [layoutTokens, setLayoutTokens] = useState<LayoutToken[]>([]);
  const [fieldRegions, setFieldRegions] = useState<DocumentRegionDto[]>([]);
  const [tableRegions, setTableRegions] = useState<DocumentRegionDto[]>([]);
  const requestRef = useRef(0);

  const refreshRegions = useCallback(async () => {
    const request = ++requestRef.current;
    try {
      const [tokenPage, fields, tables] = await Promise.all([
        listDocumentLayoutTokens(documentId, page),
        listDocumentRegions(documentId, 'field'),
        listDocumentRegions(documentId, 'table'),
      ]);
      if (request !== requestRef.current) {
        return;
      }
      setLayoutTokens(tokenPage.tokens);
      setFieldRegions(fields.items);
      setTableRegions(tables.items);
    } catch (error: unknown) {
      if (request === requestRef.current) {
        setLayoutTokens([]);
        setFieldRegions([]);
        setTableRegions([]);
      }
      throw error;
    }
  }, [documentId, page]);

  useEffect(() => {
    void refreshRegions().catch(() => undefined);
  }, [refreshRegions, layoutIrRevision]);

  return { layoutTokens, fieldRegions, tableRegions, refreshRegions };
}
