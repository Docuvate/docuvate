// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { ExtractionFieldCorrectionDto } from '@docuvate/contracts';

import type { ExtractionFieldCorrectionRecord } from '../../../shared/domain/ports.js';

export function toExtractionFieldCorrectionDto(
  row: ExtractionFieldCorrectionRecord
): ExtractionFieldCorrectionDto {
  return {
    id: row.id,
    documentId: row.documentId,
    fieldKey: row.fieldKey,
    oldValue: row.oldValue,
    newValue: row.newValue,
    labelTagIds: row.labelTagIds,
    fieldTagId: row.fieldTagId,
    source: row.source,
    createdAt: row.createdAt.toISOString(),
  };
}
