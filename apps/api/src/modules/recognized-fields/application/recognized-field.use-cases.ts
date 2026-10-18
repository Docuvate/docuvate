// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { ReplaceRecognizedFieldsRequest } from '@docuvate/contracts';
import { Inject, Injectable } from '@nestjs/common';

import {
  RECOGNIZED_FIELD_REPOSITORY,
  type RecognizedFieldRepository,
} from '../../../shared/domain/ports.js';
import { recognizedFieldKeysNeedingReextraction } from '../domain/recognized-field-config-signature.js';
import { ScheduleRecognizedFieldReextractionUseCase } from './schedule-recognized-field-reextraction.use-case.js';

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
    @Inject(RECOGNIZED_FIELD_REPOSITORY) private readonly fields: RecognizedFieldRepository,
    private readonly scheduleReextraction: ScheduleRecognizedFieldReextractionUseCase
  ) {}

  async execute(userId: string, body: ReplaceRecognizedFieldsRequest) {
    const previous = await this.fields.listForUser(userId);
    const items = await this.fields.replaceForUser(
      userId,
      body.fields.map((field, index) => ({
        key: field.key,
        label: field.label,
        fieldType: field.fieldType ?? 'text',
        sortOrder: field.sortOrder ?? index,
        extractForAllDocuments: field.extractForAllDocuments ?? false,
        showInFilter: field.showInFilter ?? false,
        gateLabelIds: field.gateLabelIds ?? [],
        gateLabelMatch: field.gateLabelMatch === 'any' ? 'any' : 'all',
        minLabelConfidence: field.minLabelConfidence ?? null,
        confidenceGateEnabled: field.confidenceGateEnabled ?? null,
      }))
    );
    const changedKeys = recognizedFieldKeysNeedingReextraction(previous, items);
    await this.scheduleReextraction.execute(userId, changedKeys);
    return items;
  }
}
