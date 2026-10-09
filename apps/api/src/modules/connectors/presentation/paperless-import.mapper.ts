// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { PaperlessImportRunDto } from '@docuvate/contracts';
import type { ConnectorImportRunRow } from '../infrastructure/adapters/paperless/paperless-import.repository.js';

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
