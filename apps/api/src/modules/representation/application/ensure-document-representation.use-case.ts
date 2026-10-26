// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { DocumentRepresentationDto } from '@docuvate/contracts';
import { Injectable } from '@nestjs/common';

import { ServiceUnavailableError } from '../../../shared/domain/errors.js';
import { isRecord, parseString } from '../../../shared/infrastructure/database/row-parse.js';
import { workerApiUrl } from '../../../shared/infrastructure/worker/worker-api-path.js';
import {
  fetchWorkerJson,
  workerCompareTimeoutMs,
} from '../../../shared/infrastructure/worker/worker-fetch.js';
import { workerRequestHeaders } from '../../../shared/infrastructure/worker/worker-request-headers.js';
import {
  parseWorkerRetryAfterSeconds,
  WorkerExtractCapacityCoordinator,
} from '../../extraction/infrastructure/worker-extract-capacity.coordinator.js';
import { withWorkerExtractSlot } from '../../extraction/infrastructure/with-worker-extract-slot.js';
import { PgDocumentRepresentationRepository } from '../infrastructure/pg-document-representation.repository.js';
import { PersistDocumentRepresentationUseCase } from './persist-document-representation.use-case.js';

function parseWorkerRepresentation(value: unknown): DocumentRepresentationDto | undefined {
  if (!isRecord(value)) {
    return undefined;
  }
  const encoderId = parseString(value.encoderId);
  const encoderRevision = parseString(value.encoderRevision);
  const representationVersion = Number(value.representationVersion);
  const documentMeanScale = Number(value.documentMeanScale);
  const documentMeanInt8Base64 = parseString(value.documentMeanInt8Base64);
  const documentMaxScale = Number(value.documentMaxScale);
  const documentMaxInt8Base64 = parseString(value.documentMaxInt8Base64);
  if (
    !encoderId ||
    !encoderRevision ||
    !Number.isFinite(representationVersion) ||
    !Number.isFinite(documentMeanScale) ||
    !documentMeanInt8Base64 ||
    !Number.isFinite(documentMaxScale) ||
    !documentMaxInt8Base64
  ) {
    return undefined;
  }
  const units = Array.isArray(value.units) ? value.units : [];
  const parsedUnits = units
    .map((unit) => {
      if (!isRecord(unit)) {
        return null;
      }
      const unitIndex = Number(unit.unitIndex);
      const kind = parseString(unit.kind);
      const text = parseString(unit.text);
      const vectorScale = Number(unit.vectorScale);
      const vectorInt8Base64 = parseString(unit.vectorInt8Base64);
      const binaryCodeBase64 = parseString(unit.binaryCodeBase64);
      if (
        !Number.isFinite(unitIndex) ||
        !kind ||
        !text ||
        !Number.isFinite(vectorScale) ||
        !vectorInt8Base64 ||
        !binaryCodeBase64
      ) {
        return null;
      }
      return {
        unitIndex,
        kind,
        text,
        page: typeof unit.page === 'number' ? unit.page : null,
        x: typeof unit.x === 'number' ? unit.x : null,
        y: typeof unit.y === 'number' ? unit.y : null,
        width: typeof unit.width === 'number' ? unit.width : null,
        height: typeof unit.height === 'number' ? unit.height : null,
        charStart: typeof unit.charStart === 'number' ? unit.charStart : null,
        charEnd: typeof unit.charEnd === 'number' ? unit.charEnd : null,
        vectorScale,
        vectorInt8Base64,
        binaryCodeBase64,
      };
    })
    .filter((unit): unit is NonNullable<typeof unit> => unit !== null);
  return {
    encoderId,
    encoderRevision,
    representationVersion,
    units: parsedUnits,
    documentMeanScale,
    documentMeanInt8Base64,
    documentMaxScale,
    documentMaxInt8Base64,
  };
}

/** Lazy backfill: encode document text once via worker when representation is missing. */
@Injectable()
export class EnsureDocumentRepresentationUseCase {
  constructor(
    private readonly repository: PgDocumentRepresentationRepository,
    private readonly persist: PersistDocumentRepresentationUseCase,
    private readonly extractCapacity: WorkerExtractCapacityCoordinator
  ) {}

  async execute(tenantId: string, documentId: string, text: string): Promise<boolean> {
    const trimmed = text.trim();
    if (trimmed.length < 1) {
      return false;
    }
    const existing = await this.repository.loadDocumentMeanVector(tenantId, documentId);
    if (existing && existing.vector.length > 0) {
      return true;
    }
    const workerUrl = process.env['WORKER_URL'] ?? 'http://localhost:8000';
    let payload: unknown;
    try {
      payload = await withWorkerExtractSlot(this.extractCapacity, async () => {
        try {
          return await fetchWorkerJson(
            workerApiUrl(workerUrl, '/representation/from-text'),
            {
              method: 'POST',
              headers: workerRequestHeaders(),
              body: JSON.stringify({ text: trimmed }),
            },
            workerCompareTimeoutMs()
          );
        } catch (error: unknown) {
          if (error instanceof ServiceUnavailableError) {
            this.extractCapacity.onWorkerPressure503(5);
          }
          throw error;
        }
      });
    } catch {
      return false;
    }
    const representation = parseWorkerRepresentation(payload);
    if (!representation) {
      return false;
    }
    await this.persist.execute(tenantId, documentId, representation);
    return true;
  }
}
