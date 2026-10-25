// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { isRecord, parseOptionalNumber } from '../../../../../shared/infrastructure/database/row-parse.js';

export const PAPERLESS_IMPORT_MESSAGE_KEYS = {
  documentTooLarge: 'connectors.paperlessImport.documentTooLarge',
  documentFailed: 'connectors.paperlessImport.documentFailed',
  runFailed: 'connectors.paperlessImport.runFailed',
  runAlreadyActive: 'connectors.paperlessImport.runAlreadyActive',
  retryNoFailedDocuments: 'connectors.paperlessImport.retryNoFailedDocuments',
} as const;

export type PaperlessImportMessageKey =
  (typeof PAPERLESS_IMPORT_MESSAGE_KEYS)[keyof typeof PAPERLESS_IMPORT_MESSAGE_KEYS];

export interface PaperlessImportErrorMessageParams {
  maxMb?: number;
}

export function encodePaperlessImportErrorMessageParams(
  params: PaperlessImportErrorMessageParams
): string | null {
  if (params.maxMb === undefined) {
    return null;
  }
  return JSON.stringify({ maxMb: params.maxMb });
}

export function decodePaperlessImportErrorMessageParams(
  raw: string | null
): PaperlessImportErrorMessageParams {
  if (!raw) {
    return {};
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed)) {
      return {};
    }
    const maxMb = parseOptionalNumber(parsed.maxMb);
    if (maxMb === null) {
      return {};
    }
    return { maxMb };
  } catch {
    return {};
  }
}
