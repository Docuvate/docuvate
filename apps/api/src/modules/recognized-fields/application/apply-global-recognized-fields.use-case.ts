// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { ExtractedField, RecognizedFieldExtractionOutcome } from '@docuvate/contracts';
import { Inject, Injectable, Logger } from '@nestjs/common';

import {
  DOCUMENT_REPOSITORY,
  type DocumentRepository,
  EXTRACTION_FIELD_FEEDBACK_REPOSITORY,
  type ExtractionFieldFeedbackRepository,
  LABEL_FIELD_EXTRACTION_PORT,
  type LabelFieldExtractionPort,
  RECOGNIZED_FIELD_REPOSITORY,
  type RecognizedFieldRepository,
  TAXONOMY_REPOSITORY,
  type TaxonomyRepository,
  USER_PREFERENCES_REPOSITORY,
  type UserPreferencesRepository,
} from '../../../shared/domain/ports.js';
import { mergeExtractedFields } from '../../document-pipeline/domain/merge-extracted-fields.js';
import { evaluateFieldExtractionGate } from '../domain/field-extraction-gate.js';
import type { RecognizedFieldEntity } from '../domain/recognized-field.entity.js';
import {
  globalFieldStorageKey,
  parseGlobalFieldStorageKey,
} from '../domain/recognized-field.entity.js';
import { resolveFieldExtractionGateConfig } from '../domain/resolve-field-extraction-gate.js';
import { PgRecognizedFieldExtractionAttemptRepository } from '../infrastructure/pg-recognized-field-extraction-attempt.repository.js';

export interface ApplyGlobalRecognizedFieldsOptions {
  scopeDefinitionIds?: readonly string[];
}

@Injectable()
export class ApplyGlobalRecognizedFieldsUseCase {
  private readonly logger = new Logger(ApplyGlobalRecognizedFieldsUseCase.name);

  constructor(
    @Inject(DOCUMENT_REPOSITORY) private readonly documents: DocumentRepository,
    @Inject(RECOGNIZED_FIELD_REPOSITORY) private readonly fieldDefs: RecognizedFieldRepository,
    @Inject(LABEL_FIELD_EXTRACTION_PORT) private readonly extraction: LabelFieldExtractionPort,
    @Inject(TAXONOMY_REPOSITORY) private readonly taxonomy: TaxonomyRepository,
    @Inject(USER_PREFERENCES_REPOSITORY) private readonly prefs: UserPreferencesRepository,
    @Inject(EXTRACTION_FIELD_FEEDBACK_REPOSITORY)
    private readonly fieldFeedback: ExtractionFieldFeedbackRepository,
    private readonly attempts: PgRecognizedFieldExtractionAttemptRepository
  ) {}

  async execute(
    documentId: string,
    userId: string,
    options: ApplyGlobalRecognizedFieldsOptions = {}
  ): Promise<void> {
    const doc = await this.documents.findByIdForUser(documentId, userId);
    if (!doc) {
      return;
    }
    const extraction = doc.extraction;
    if (!extraction?.text.trim()) {
      return;
    }
    const text = extraction.text.trim();

    const allDefs = await this.fieldDefs.listForUser(userId);
    if (allDefs.length === 0) {
      return;
    }

    const scope = options.scopeDefinitionIds
      ? new Set(options.scopeDefinitionIds)
      : null;
    const scopedDefs = scope
      ? allDefs.filter((def) => scope.has(def.id))
      : allDefs;

    const prefs = await this.prefs.getForUser(userId);
    const fieldAcceptanceThreshold = prefs.labelFieldConfidenceThreshold;

    const assignedTags = await this.taxonomy.listTagsForDocument(documentId);
    const suggestions = await this.taxonomy.listSuggestions(documentId, userId);
    const labelContext = {
      assignedTagIds: assignedTags.map((t) => t.id),
      assignedNonInboxTagIds: assignedTags.filter((t) => !t.isInbox).map((t) => t.id),
      suggestions: suggestions.map((s) => ({
        tagId: s.tag.id,
        confidence: s.confidence ?? 0,
        isInbox: s.tag.isInbox,
      })),
    };

    const defsToExtract: RecognizedFieldEntity[] = [];
    const attemptRows: {
      documentId: string;
      fieldDefinitionId: string;
      outcome: RecognizedFieldExtractionOutcome;
      confidence: number | null;
    }[] = [];

    for (const def of scopedDefs) {
      if (def.extractForAllDocuments) {
        defsToExtract.push(def);
        continue;
      }
      const gateConfig = resolveFieldExtractionGateConfig(def, prefs);
      if (!evaluateFieldExtractionGate(labelContext, gateConfig)) {
        attemptRows.push({
          documentId,
          fieldDefinitionId: def.id,
          outcome: 'not_applicable',
          confidence: null,
        });
        continue;
      }
      defsToExtract.push(def);
    }

    if (attemptRows.length > 0) {
      await this.attempts.upsertMany(userId, attemptRows);
    }

    if (defsToExtract.length === 0) {
      return;
    }

    await this.attempts.upsertMany(
      userId,
      defsToExtract.map((def) => ({
        documentId,
        fieldDefinitionId: def.id,
        outcome: 'pending',
        confidence: null,
      }))
    );

    const correctedFieldKeys = new Set(
      await this.fieldFeedback.listCorrectedFieldKeysForDocument(userId, documentId)
    );
    const defsEligibleForExtract = defsToExtract.filter((def) => {
      const storageKey = globalFieldStorageKey(def.key);
      return !correctedFieldKeys.has(storageKey) && !correctedFieldKeys.has(def.key);
    });
    if (defsEligibleForExtract.length === 0) {
      await this.attempts.upsertMany(
        userId,
        defsToExtract.map((def) => ({
          documentId,
          fieldDefinitionId: def.id,
          outcome: 'not_applicable',
          confidence: null,
        }))
      );
      return;
    }

    const lookupKeys = defsEligibleForExtract.flatMap((def) => [
      globalFieldStorageKey(def.key),
      def.key,
    ]);
    const correctionExamples = await this.fieldFeedback.listRecentForFieldKeys(userId, lookupKeys, {
      limitPerField: 5,
    });
    const workerExamples = correctionExamples
      .map((example) => {
        const bareKey = parseGlobalFieldStorageKey(example.fieldKey) ?? example.fieldKey;
        const def = defsEligibleForExtract.find((row) => row.key === bareKey);
        return {
          ...example,
          fieldKey: bareKey,
          label: def?.label ?? example.label,
          fieldType: def?.fieldType ?? example.fieldType,
        };
      })
      .filter((example) => defsEligibleForExtract.some((def) => def.key === example.fieldKey));

    try {
      const extracted = await this.extraction.extractLabelFields(
        text,
        'Dokument',
        defsEligibleForExtract.map((d) => ({
          key: d.key,
          label: d.label,
          fieldType: d.fieldType,
        })),
        { examples: workerExamples }
      );

      const extractedByKey = new Map<string, ExtractedField>();
      for (const row of extracted) {
        extractedByKey.set(row.key, row);
      }

      const existing = extraction.fields;
      const patches: ExtractedField[] = [];
      const storageKeysToClear = new Set<string>();
      const finalAttempts: {
        documentId: string;
        fieldDefinitionId: string;
        outcome: RecognizedFieldExtractionOutcome;
        confidence: number | null;
      }[] = [];

      for (const def of defsEligibleForExtract) {
        const row = extractedByKey.get(def.key);
        if (!row?.value.trim()) {
          finalAttempts.push({
            documentId,
            fieldDefinitionId: def.id,
            outcome: 'not_found',
            confidence: null,
          });
          storageKeysToClear.add(globalFieldStorageKey(def.key));
          storageKeysToClear.add(def.key);
          continue;
        }
        const confidence = row.confidence ?? 0;
        if (confidence < fieldAcceptanceThreshold) {
          finalAttempts.push({
            documentId,
            fieldDefinitionId: def.id,
            outcome: 'below_threshold',
            confidence,
          });
          storageKeysToClear.add(globalFieldStorageKey(def.key));
          storageKeysToClear.add(def.key);
          continue;
        }
        const storageKey = globalFieldStorageKey(row.key);
        if (correctedFieldKeys.has(storageKey) || correctedFieldKeys.has(row.key)) {
          continue;
        }
        patches.push({
          key: storageKey,
          value: row.value.trim(),
          confidence,
        });
        finalAttempts.push({
          documentId,
          fieldDefinitionId: def.id,
          outcome: 'found',
          confidence,
        });
      }

      await this.attempts.upsertMany(userId, finalAttempts);

      const clearedFields =
        storageKeysToClear.size === 0
          ? existing
          : existing.filter(
              (field) =>
                !storageKeysToClear.has(field.key) &&
                !storageKeysToClear.has(parseGlobalFieldStorageKey(field.key) ?? field.key)
            );

      if (patches.length === 0) {
        if (clearedFields !== existing) {
          await this.documents.updateForUser(documentId, userId, {
            extractionFields: clearedFields,
          });
        }
        return;
      }

      const nextFields = mergeExtractedFields(clearedFields, patches);
      if (nextFields === existing) {
        return;
      }

      await this.documents.updateForUser(documentId, userId, {
        extractionFields: nextFields,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Recognized field extraction failed: ${message}`);
      await this.attempts.upsertMany(
        userId,
        defsEligibleForExtract.map((def) => ({
          documentId,
          fieldDefinitionId: def.id,
          outcome: 'not_found',
          confidence: null,
        }))
      );
    }
  }
}
