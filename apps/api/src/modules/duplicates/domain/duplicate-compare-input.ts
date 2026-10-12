// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { DuplicateCompareDocumentInput, ExtractionBlock } from '@docuvate/contracts';

import {
  isRecord,
  parseNumber,
} from '../../../shared/infrastructure/database/row-parse.js';
import type { DocumentEntity } from '../../documents/domain/document.entity.js';
import type { DuplicateEmbeddingPeerRow } from './duplicate-document-signals.js';

export function pageCountFromBlocks(blocks: ExtractionBlock[] | undefined): number | null {
  if (!blocks || blocks.length === 0) return null;
  let max = 0;
  for (const block of blocks) {
    if (Number.isFinite(block.page) && block.page > max) max = block.page;
  }
  return max > 0 ? max : null;
}

function pageCountFromExtractedFields(raw: unknown): number | null {
  if (!isRecord(raw)) return null;
  const blocks = raw.blocks;
  if (!Array.isArray(blocks)) return null;
  let max = 0;
  for (const item of blocks) {
    if (!isRecord(item)) continue;
    const page = parseNumber(item.page, Number.NaN);
    if (Number.isFinite(page) && page > max) max = page;
  }
  return max > 0 ? max : null;
}

export function compareInputFromDocument(doc: DocumentEntity): DuplicateCompareDocumentInput {
  return {
    documentId: doc.id,
    filename: doc.filename,
    title: doc.title,
    extractedTextSample: (doc.extraction?.text ?? '').slice(0, 8000),
    pageCount: pageCountFromBlocks(doc.extraction?.blocks),
  };
}

export function compareInputFromEmbeddingPeer(row: DuplicateEmbeddingPeerRow): DuplicateCompareDocumentInput {
  return {
    documentId: row.documentId,
    filename: row.filename,
    title: row.title,
    extractedTextSample: (row.extractedText ?? '').slice(0, 8000),
    pageCount: pageCountFromExtractedFields(row.extractedFields),
  };
}
