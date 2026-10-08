import type { ExtractionBlock } from '@docuvate/contracts';
import type { DocumentEntity } from '../../documents/domain/document.entity.js';

export interface DuplicateDocumentSignals {
  documentId: string;
  filename: string;
  title: string;
  documentDateYear: number | null;
  extractedTextSample: string;
  pageCount: number | null;
}

export interface DuplicateEmbeddingPeerRow {
  documentId: string;
  embedding: number[];
  filename: string;
  title: string;
  documentDate: Date | null;
  extractedText: string | null;
  extractedFields: unknown;
}

export function pageCountFromBlocks(blocks: ExtractionBlock[] | undefined): number | null {
  if (!blocks || blocks.length === 0) return null;
  let max = 0;
  for (const block of blocks) {
    if (Number.isFinite(block.page) && block.page > max) max = block.page;
  }
  return max > 0 ? max : null;
}

export function pageCountFromExtractedFields(raw: unknown): number | null {
  if (raw == null || typeof raw !== 'object') return null;
  const blocks = (raw as Record<string, unknown>)['blocks'];
  if (!Array.isArray(blocks)) return null;
  let max = 0;
  for (const item of blocks) {
    if (!item || typeof item !== 'object') continue;
    const page = Number((item as Record<string, unknown>)['page']);
    if (Number.isFinite(page) && page > max) max = page;
  }
  return max > 0 ? max : null;
}

export function signalsFromDocument(doc: DocumentEntity): DuplicateDocumentSignals {
  return {
    documentId: doc.id,
    filename: doc.filename,
    title: doc.title,
    documentDateYear: doc.documentDate ? doc.documentDate.getUTCFullYear() : null,
    extractedTextSample: (doc.extraction?.text ?? '').slice(0, 8000),
    pageCount: pageCountFromBlocks(doc.extraction?.blocks),
  };
}

export function signalsFromEmbeddingPeer(row: DuplicateEmbeddingPeerRow): DuplicateDocumentSignals {
  return {
    documentId: row.documentId,
    filename: row.filename,
    title: row.title,
    documentDateYear: row.documentDate ? row.documentDate.getUTCFullYear() : null,
    extractedTextSample: (row.extractedText ?? '').slice(0, 8000),
    pageCount: pageCountFromExtractedFields(row.extractedFields),
  };
}
