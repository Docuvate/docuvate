// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Injectable } from '@nestjs/common';

import { ApplyGlobalRecognizedFieldsUseCase } from '../../recognized-fields/application/apply-global-recognized-fields.use-case.js';

@Injectable()
export class ApplyLabelCustomFieldsUseCase {
  constructor(private readonly applyRecognizedFields: ApplyGlobalRecognizedFieldsUseCase) {}

  async execute(documentId: string, userId: string): Promise<void> {
    await this.applyRecognizedFields.execute(documentId, userId);
  }
}
