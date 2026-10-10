// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Injectable } from '@nestjs/common';

import { ApplyGlobalRecognizedFieldsUseCase } from '../../recognized-fields/application/apply-global-recognized-fields.use-case.js';
import { parseLabelFieldStorageKey } from '../domain/tag-custom-field.entity.js';

@Injectable()
export class ApplyLabelCustomFieldsUseCase {
  constructor(private readonly applyRecognizedFields: ApplyGlobalRecognizedFieldsUseCase) {}

  async execute(documentId: string, userId: string): Promise<void> {
    await this.applyRecognizedFields.execute(documentId, userId);
  }
}

/** Strip obsolete heuristic keys when persisting user edits (optional helper for mappers). */
export function isLabelScopedFieldKey(key: string): boolean {
  return parseLabelFieldStorageKey(key) != null;
}
