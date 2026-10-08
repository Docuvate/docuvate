import { Inject, Injectable, Logger } from '@nestjs/common';
import type { ExtractedField } from '@docuvate/contracts';
import {
  DOCUMENT_REPOSITORY,
  LABEL_FIELD_EXTRACTION_PORT,
  RECOGNIZED_FIELD_REPOSITORY,
  TAXONOMY_REPOSITORY,
  USER_PREFERENCES_REPOSITORY,
  type DocumentRepository,
  type LabelFieldExtractionPort,
  type RecognizedFieldRepository,
  type TaxonomyRepository,
  type UserPreferencesRepository,
} from '../../../shared/domain/ports.js';
import { mergeExtractedFields } from '../../document-pipeline/domain/merge-extracted-fields.js';
import { globalFieldStorageKey } from '../domain/recognized-field.entity.js';
import { evaluateFieldExtractionGate } from '../domain/field-extraction-gate.js';
import { resolveFieldExtractionGateConfig } from '../domain/resolve-field-extraction-gate.js';
import { SyncDocumentFieldValuesUseCase } from '../../search/application/sync-document-field-values.use-case.js';

@Injectable()
export class ApplyGlobalRecognizedFieldsUseCase {
  private readonly logger = new Logger(ApplyGlobalRecognizedFieldsUseCase.name);

  constructor(
    @Inject(DOCUMENT_REPOSITORY) private readonly documents: DocumentRepository,
    @Inject(RECOGNIZED_FIELD_REPOSITORY) private readonly fieldDefs: RecognizedFieldRepository,
    @Inject(LABEL_FIELD_EXTRACTION_PORT) private readonly extraction: LabelFieldExtractionPort,
    @Inject(TAXONOMY_REPOSITORY) private readonly taxonomy: TaxonomyRepository,
    @Inject(USER_PREFERENCES_REPOSITORY) private readonly prefs: UserPreferencesRepository,
    private readonly syncFieldValues: SyncDocumentFieldValuesUseCase
  ) {}

  async execute(documentId: string, userId: string): Promise<void> {
    const doc = await this.documents.findByIdForUser(documentId, userId);
    if (!doc?.extraction?.text?.trim()) {
      return;
    }
    const text = doc.extraction.text.trim();

    const allDefs = await this.fieldDefs.listForUser(userId);
    if (allDefs.length === 0) {
      return;
    }

    const prefs = await this.prefs.getForUser(userId);

    const assignedTags = await this.taxonomy.listTagsForDocument(documentId);
    const suggestions = await this.taxonomy.listSuggestions(documentId, userId);
    const assignedTagIds = assignedTags.map((t) => t.id);
    const assignedNonInboxTagIds = assignedTags.filter((t) => !t.isInbox).map((t) => t.id);
    const labelContext = {
      assignedTagIds,
      assignedNonInboxTagIds,
      suggestions: suggestions.map((s) => ({
        tagId: s.tag.id,
        confidence: s.confidence ?? 0,
        isInbox: s.tag.isInbox,
      })),
    };

    const defsToExtract = allDefs.filter((def) => {
      if (def.extractForAllDocuments) {
        return true;
      }
      const gateConfig = resolveFieldExtractionGateConfig(def, prefs);
      return evaluateFieldExtractionGate(labelContext, gateConfig);
    });
    if (defsToExtract.length === 0) {
      return;
    }

    try {
      const extracted = await this.extraction.extractLabelFields(
        text,
        'Dokument',
        defsToExtract.map((d) => ({
          key: d.key,
          label: d.label,
          fieldType: d.fieldType,
        }))
      );

      const existing = doc.extraction.fields ?? [];
      const patches: ExtractedField[] = [];
      for (const row of extracted) {
        if (!row.value.trim()) {
          continue;
        }
        patches.push({
          key: globalFieldStorageKey(row.key),
          value: row.value.trim(),
          confidence: row.confidence ?? 0.75,
        });
      }

      const nextFields = mergeExtractedFields(existing, patches);
      if (nextFields === existing) {
        return;
      }

      await this.documents.updateForUser(documentId, userId, {
        extractionFields: nextFields,
      });
      await this.syncFieldValues.execute(userId, documentId, nextFields);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Recognized field extraction failed: ${message}`);
    }
  }
}
