// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { DocumentDto, ExtractionBlock } from '@docuvate/contracts';

import i18n from '../i18n';
import { textFromExtractionBlocks } from './extractionLayout';

export function hasExtractedContent(
  doc: Pick<DocumentDto, 'extraction'>,
  blocks: ExtractionBlock[]
): boolean {
  const rawText = doc.extraction?.text;
  const text = rawText != null ? rawText.trim() : '';
  if (text.length > 0) return true;
  const fromBlocks = textFromExtractionBlocks(blocks).trim();
  return fromBlocks.length > 0 || blocks.length > 0;
}

export interface ExtractionFailurePresentation {
  userMessage: string;
  technicalDetail: string | null;
}

const WORKER_HTTP_FAILURE = /^Worker extraction failed: (\d{3})$/;

function looksLikeInternalError(reason: string): boolean {
  if (WORKER_HTTP_FAILURE.test(reason)) {
    return true;
  }
  if (reason.startsWith('Worker extraction failed')) {
    return true;
  }
  if (/^[A-Za-z][A-Za-z ]+ failed: \d{3}$/.test(reason)) {
    return true;
  }
  return false;
}

export function presentExtractionFailure(
  reason: string | null | undefined
): ExtractionFailurePresentation {
  const trimmed = reason?.trim() ?? '';
  if (!trimmed) {
    return {
      userMessage: i18n.t('documents.extractionFailedDetail'),
      technicalDetail: null,
    };
  }
  if (
    trimmed === 'documents.extractionFailedTimeout' ||
    trimmed.includes('Worker extraction timeout')
  ) {
    return {
      userMessage: i18n.t('documents.extractionFailedTimeout'),
      technicalDetail: 'Worker extraction timeout',
    };
  }
  if (looksLikeInternalError(trimmed)) {
    return {
      userMessage: i18n.t('documents.extractionFailedWorker'),
      technicalDetail: trimmed,
    };
  }
  return {
    userMessage: trimmed,
    technicalDetail: null,
  };
}

export function extractionFailureMessage(doc: DocumentDto): string {
  if (doc.status !== 'failed') {
    return '';
  }
  return presentExtractionFailure(doc.extractionFailureReason).userMessage;
}

export function isExtractionPending(status: DocumentDto['status']): boolean {
  return status === 'uploaded' || status === 'queued' || status === 'extracting';
}
