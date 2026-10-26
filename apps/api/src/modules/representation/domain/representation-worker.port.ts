// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { DocumentRepresentationDto } from '@docuvate/contracts';

export interface PersistDocumentRepresentationPort {
  execute(
    tenantId: string,
    documentId: string,
    representation: DocumentRepresentationDto
  ): Promise<void>;
}

export type { WorkerExtractSlotPort } from '../../extraction/domain/worker-extract-slot.port.js';
