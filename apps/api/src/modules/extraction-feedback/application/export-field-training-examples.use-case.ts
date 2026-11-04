// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { CustomFieldType } from '@docuvate/contracts';

import type {
  ExtractionFieldFeedbackRepository,
  FieldTrainingExample,
  RecognizedFieldRepository,
  TagCustomFieldRepository,
} from '../../../shared/domain/ports.js';
import { fieldTypesByName } from '../domain/field-types-by-name.js';

interface FieldTrainingExampleExport extends FieldTrainingExample {
  fieldType: CustomFieldType | null;
}

/** Pages through one user's confirmed and corrected field values for local model training. */
export class ExportFieldTrainingExamplesUseCase {
  constructor(
    private readonly feedback: ExtractionFieldFeedbackRepository,
    private readonly recognizedFields: RecognizedFieldRepository,
    private readonly tagFields: TagCustomFieldRepository
  ) {}

  async *execute(userId: string, pageSize = 500): AsyncGenerator<FieldTrainingExampleExport> {
    const [recognized, tagFields] = await Promise.all([
      this.recognizedFields.listForUser(userId),
      this.tagFields.listForUser(userId),
    ]);
    const types = fieldTypesByName([...recognized, ...tagFields]);
    let after: { recordedAt: Date; feedbackId: string } | null = null;
    for (;;) {
      const page = await this.feedback.listTrainingExamples(userId, { limit: pageSize, after });
      for (const example of page) {
        yield { ...example, fieldType: types.get(example.fieldName) ?? null };
      }
      const last = page.at(-1);
      if (!last || page.length < pageSize) {
        return;
      }
      after = { recordedAt: last.recordedAt, feedbackId: last.feedbackId };
    }
  }
}
