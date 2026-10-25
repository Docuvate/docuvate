// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { PaperlessImportRunDto, PaperlessImportRunErrorDto } from '@docuvate/contracts';

import type {
  ConnectorImportRunErrorRow,
  ConnectorImportRunRow,
} from '../infrastructure/adapters/paperless/paperless-import.repository.js';
import { decodePaperlessImportErrorMessageParams } from '../infrastructure/adapters/paperless/paperless-import-message-keys.js';

export function toPaperlessImportRunDto(run: ConnectorImportRunRow): PaperlessImportRunDto {
  return {
    id: run.id,
    installationId: run.installationId,
    status: run.status,
    paperlessApiVersion: run.paperlessApiVersion,
    ocrMode: run.ocrMode,
    includeArchivedPdf: run.includeArchivedPdf,
    progressProcessed: run.progressProcessed,
    progressTotal: run.progressTotal,
    fatalErrorKey: run.fatalErrorKey,
    startedAt: run.startedAt?.toISOString() ?? null,
    completedAt: run.completedAt?.toISOString() ?? null,
    createdAt: run.createdAt.toISOString(),
    updatedAt: run.updatedAt.toISOString(),
  };
}

export function toPaperlessImportRunErrorDto(row: ConnectorImportRunErrorRow): PaperlessImportRunErrorDto {
  const messageParams = decodePaperlessImportErrorMessageParams(row.messageParamsJson);
  return {
    id: row.id,
    sourceDocumentId: row.sourceDocumentId,
    sourceDocumentTitle: row.sourceDocumentTitle,
    messageKey: row.messageKey,
    messageDetail: row.messageDetail,
    messageParams,
    createdAt: row.createdAt.toISOString(),
  };
}
