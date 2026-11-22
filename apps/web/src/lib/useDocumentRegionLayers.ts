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
 * Field/table regions are document-scoped and only reload when the document or
 * layout IR revision changes. Tokens reload on page change. Fast page switches
 * drop superseded token responses so older pages cannot overwrite newer state.
 */
export function useDocumentRegionLayers(
  documentId: string,
  page: number,
  layoutIrRevision: string
): DocumentRegionLayers {
  const [layoutTokens, setLayoutTokens] = useState<LayoutToken[]>([]);
  const [fieldRegions, setFieldRegions] = useState<DocumentRegionDto[]>([]);
  const [tableRegions, setTableRegions] = useState<DocumentRegionDto[]>([]);
  const regionsRequestRef = useRef(0);
  const tokensRequestRef = useRef(0);

  const refreshRegions = useCallback(async () => {
    const regionsRequest = ++regionsRequestRef.current;
    const tokensRequest = ++tokensRequestRef.current;
    try {
      const [tokenPage, fields, tables] = await Promise.all([
        listDocumentLayoutTokens(documentId, page),
        listDocumentRegions(documentId, 'field'),
        listDocumentRegions(documentId, 'table'),
      ]);
      if (tokensRequest === tokensRequestRef.current) {
        setLayoutTokens(tokenPage.tokens);
      }
      if (regionsRequest === regionsRequestRef.current) {
        setFieldRegions(fields.items);
        setTableRegions(tables.items);
      }
    } catch (error: unknown) {
      if (tokensRequest === tokensRequestRef.current) {
        setLayoutTokens([]);
      }
      if (regionsRequest === regionsRequestRef.current) {
        setFieldRegions([]);
        setTableRegions([]);
      }
      throw error;
    }
  }, [documentId, page]);

  useEffect(() => {
    const request = ++regionsRequestRef.current;
    void (async () => {
      try {
        const [fields, tables] = await Promise.all([
          listDocumentRegions(documentId, 'field'),
          listDocumentRegions(documentId, 'table'),
        ]);
        if (request !== regionsRequestRef.current) return;
        setFieldRegions(fields.items);
        setTableRegions(tables.items);
      } catch {
        if (request === regionsRequestRef.current) {
          setFieldRegions([]);
          setTableRegions([]);
        }
      }
    })();
  }, [documentId, layoutIrRevision]);

  useEffect(() => {
    const request = ++tokensRequestRef.current;
    void (async () => {
      try {
        const tokenPage = await listDocumentLayoutTokens(documentId, page);
        if (request !== tokensRequestRef.current) return;
        setLayoutTokens(tokenPage.tokens);
      } catch {
        if (request === tokensRequestRef.current) {
          setLayoutTokens([]);
        }
      }
    })();
  }, [documentId, page, layoutIrRevision]);

  return { layoutTokens, fieldRegions, tableRegions, refreshRegions };
}
