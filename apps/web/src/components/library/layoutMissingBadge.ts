// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { DocumentDto } from '@docuvate/contracts';

import { isExtractionPending } from '../../lib/documentExtractionState';

/** Ready/failed docs that finished extraction without a persisted layout IR. */
export function showLayoutMissingBadge(
  doc: Pick<DocumentDto, 'status' | 'layoutIrAvailable' | 'extraction'>
): boolean {
  if (isExtractionPending(doc.status)) {
    return false;
  }
  if (doc.status !== 'ready' && doc.status !== 'failed') {
    return false;
  }
  if (doc.layoutIrAvailable === false) {
    return true;
  }
  if (doc.layoutIrAvailable === true) {
    return false;
  }
  return doc.extraction?.layoutIrAvailable === false;
}
