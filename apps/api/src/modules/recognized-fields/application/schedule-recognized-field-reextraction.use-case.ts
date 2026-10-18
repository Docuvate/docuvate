// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Inject, Injectable, Logger } from '@nestjs/common';

import {
  RECOGNIZED_FIELD_REPOSITORY,
  type RecognizedFieldRepository,
  USER_PREFERENCES_REPOSITORY,
  type UserPreferencesRepository,
} from '../../../shared/domain/ports.js';
import type { RecognizedFieldEntity } from '../domain/recognized-field.entity.js';
import { RECOGNIZED_FIELD_REEXTRACT_BATCH_LIMIT } from '../domain/recognized-field-reextract-config.js';
import { PgRecognizedFieldExtractionAttemptRepository } from '../infrastructure/pg-recognized-field-extraction-attempt.repository.js';
import { RecognizedFieldReextractQueueService } from '../infrastructure/recognized-field-reextract-queue.service.js';

@Injectable()
export class ScheduleRecognizedFieldReextractionUseCase {
  private readonly logger = new Logger(ScheduleRecognizedFieldReextractionUseCase.name);

  constructor(
    @Inject(RECOGNIZED_FIELD_REPOSITORY) private readonly fields: RecognizedFieldRepository,
    @Inject(USER_PREFERENCES_REPOSITORY) private readonly prefs: UserPreferencesRepository,
    private readonly attempts: PgRecognizedFieldExtractionAttemptRepository,
    private readonly queue: RecognizedFieldReextractQueueService
  ) {}

  async execute(userId: string, changedFieldKeys: readonly string[]): Promise<void> {
    if (changedFieldKeys.length === 0) {
      return;
    }
    const defs = await this.fields.listForUser(userId);
    const changed = defs.filter((def) => changedFieldKeys.includes(def.key));
    if (changed.length === 0) {
      return;
    }

    const preferences = await this.prefs.getForUser(userId);
    const docIds = new Set<string>();
    const defsByDoc = new Map<string, RecognizedFieldEntity[]>();

    for (const def of changed) {
      const ids = await this.attempts.listDocumentIdsForFieldReextraction(
        userId,
        def,
        {
          fieldExtractionConfidenceGateEnabled: preferences.fieldExtractionConfidenceGateEnabled,
          labelFieldConfidenceThreshold: preferences.labelFieldConfidenceThreshold,
        },
        RECOGNIZED_FIELD_REEXTRACT_BATCH_LIMIT
      );
      for (const documentId of ids) {
        docIds.add(documentId);
        const bucket = defsByDoc.get(documentId) ?? [];
        bucket.push(def);
        defsByDoc.set(documentId, bucket);
      }
    }

    for (const [documentId, fieldDefs] of defsByDoc) {
      const definitionIds = fieldDefs.map((def) => def.id);
      await this.attempts.upsertMany(
        userId,
        definitionIds.map((fieldDefinitionId) => ({
          documentId,
          fieldDefinitionId,
          outcome: 'pending',
          confidence: null,
        }))
      );
      try {
        await this.queue.enqueue(userId, documentId, definitionIds);
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        this.logger.warn(`Recognized-field reextract enqueue failed for ${documentId}: ${message}`);
      }
    }

    this.logger.log(
      `Scheduled recognized-field reextract for ${String(docIds.size)} documents (${String(changed.length)} fields)`
    );
  }
}
