// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { DocumentRepresentationDto, RepresentationUnitDto } from '@docuvate/contracts';
import { Injectable } from '@nestjs/common';

import {
  type DocumentRepresentationPayload,
  PgDocumentRepresentationRepository,
} from '../infrastructure/pg-document-representation.repository.js';

function decodeBase64(value: string): Buffer {
  return Buffer.from(value, 'base64');
}

function toPayload(dto: DocumentRepresentationDto): DocumentRepresentationPayload {
  return {
    encoderId: dto.encoderId,
    encoderRevision: dto.encoderRevision,
    representationVersion: dto.representationVersion,
    documentMeanScale: dto.documentMeanScale,
    documentMeanInt8: decodeBase64(dto.documentMeanInt8Base64),
    documentMaxScale: dto.documentMaxScale,
    documentMaxInt8: decodeBase64(dto.documentMaxInt8Base64),
    units: dto.units.map((unit: RepresentationUnitDto) => ({
      unitIndex: unit.unitIndex,
      kind: unit.kind,
      body: unit.text,
      page: unit.page ?? null,
      bboxX: unit.x ?? null,
      bboxY: unit.y ?? null,
      bboxWidth: unit.width ?? null,
      bboxHeight: unit.height ?? null,
      charStart: unit.charStart ?? null,
      charEnd: unit.charEnd ?? null,
      vectorScale: unit.vectorScale,
      vectorInt8: decodeBase64(unit.vectorInt8Base64),
      binaryCode: decodeBase64(unit.binaryCodeBase64),
    })),
  };
}

@Injectable()
export class PersistDocumentRepresentationUseCase {
  constructor(private readonly repository: PgDocumentRepresentationRepository) {}

  async execute(
    tenantId: string,
    documentId: string,
    representation: DocumentRepresentationDto | undefined
  ): Promise<void> {
    if (!representation) {
      return;
    }
    await this.repository.replaceForDocument(tenantId, documentId, toPayload(representation));
  }
}
