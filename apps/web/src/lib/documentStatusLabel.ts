// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { DocumentStatus } from '@docuvate/contracts';

import i18n from '../i18n';

const STATUS_KEYS: Record<DocumentStatus, `library.status.${DocumentStatus}`> = {
  uploaded: 'library.status.uploaded',
  queued: 'library.status.queued',
  extracting: 'library.status.extracting',
  ready: 'library.status.ready',
  failed: 'library.status.failed',
};

export function documentStatusLabel(status: DocumentStatus): string {
  const key = STATUS_KEYS[status];
  const translated = i18n.t(key);
  if (translated === key) {
    return status;
  }
  return translated;
}

export function documentStatusFilterToken(status: DocumentStatus): string {
  if (status === 'failed') return 'error';
  if (status === 'extracting') return 'extraction';
  return status;
}

export const documentStatusValues: DocumentStatus[] = [
  'uploaded',
  'queued',
  'extracting',
  'ready',
  'failed',
];

export function parseDocumentStatusFilterValue(value: string): DocumentStatus | undefined {
  if (!value) {
    return undefined;
  }
  for (const status of documentStatusValues) {
    if (status === value) {
      return status;
    }
  }
  return undefined;
}
