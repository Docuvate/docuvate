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
export class BackfillRecognizedFieldReextractionUseCase {
  private readonly logger = new Logger(BackfillRecognizedFieldReextractionUseCase.name);

  constructor(
    @Inject(RECOGNIZED_FIELD_REPOSITORY) private readonly fields: RecognizedFieldRepository,
    @Inject(USER_PREFERENCES_REPOSITORY) private readonly prefs: UserPreferencesRepository,
    private readonly attempts: PgRecognizedFieldExtractionAttemptRepository,
    private readonly queue: RecognizedFieldReextractQueueService
  ) {}

  async executeForAllUsers(userIds: readonly string[]): Promise<void> {
    for (const userId of userIds) {
      await this.executeForUser(userId);
    }
  }

  async executeForUser(userId: string): Promise<void> {
    const defs = await this.fields.listForUser(userId);
    if (defs.length === 0) {
      return;
    }
    const preferences = await this.prefs.getForUser(userId);
    const defsByDoc = new Map<string, RecognizedFieldEntity[]>();

    for (const def of defs) {
      const ids = await this.attempts.listDocumentIdsMissingAttempts(
        userId,
        {
          id: def.id,
          key: def.key,
          extractForAllDocuments: def.extractForAllDocuments,
          gateLabelIds: def.gateLabelIds,
          gateLabelMatch: def.gateLabelMatch,
          minLabelConfidence: def.minLabelConfidence,
          confidenceGateEnabled: def.confidenceGateEnabled,
        },
        {
          fieldExtractionConfidenceGateEnabled: preferences.fieldExtractionConfidenceGateEnabled,
          labelFieldConfidenceThreshold: preferences.labelFieldConfidenceThreshold,
        },
        RECOGNIZED_FIELD_REEXTRACT_BATCH_LIMIT
      );
      for (const documentId of ids) {
        const bucket = defsByDoc.get(documentId) ?? [];
        bucket.push(def);
        defsByDoc.set(documentId, bucket);
      }
    }

    if (defsByDoc.size === 0) {
      return;
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
        this.logger.warn(
          `Recognized-field backfill enqueue failed for ${documentId}: ${message}`
        );
      }
    }

    this.logger.log(
      `Backfilled recognized-field reextract for ${String(defsByDoc.size)} document(s) (user ${userId})`
    );
  }
}
