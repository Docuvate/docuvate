// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { ReplaceRecognizedFieldsRequest } from '@docuvate/contracts';
import { Inject, Injectable } from '@nestjs/common';

import {
  RECOGNIZED_FIELD_REPOSITORY,
  type RecognizedFieldRepository,
} from '../../../shared/domain/ports.js';

@Injectable()
export class ListRecognizedFieldsUseCase {
  constructor(
    @Inject(RECOGNIZED_FIELD_REPOSITORY) private readonly fields: RecognizedFieldRepository
  ) {}

  execute(userId: string) {
    return this.fields.listForUser(userId);
  }
}

@Injectable()
export class ReplaceRecognizedFieldsUseCase {
  constructor(
    @Inject(RECOGNIZED_FIELD_REPOSITORY) private readonly fields: RecognizedFieldRepository
  ) {}

  execute(userId: string, body: ReplaceRecognizedFieldsRequest) {
    return this.fields.replaceForUser(
      userId,
      body.fields.map((field, index) => ({
        key: field.key,
        label: field.label,
        fieldType: field.fieldType ?? 'text',
        sortOrder: field.sortOrder ?? index,
        extractForAllDocuments: field.extractForAllDocuments ?? false,
        gateLabelIds: field.gateLabelIds ?? [],
        gateLabelMatch: field.gateLabelMatch === 'any' ? 'any' : 'all',
        minLabelConfidence: field.minLabelConfidence ?? null,
        confidenceGateEnabled: field.confidenceGateEnabled ?? null,
      }))
    );
  }
}
