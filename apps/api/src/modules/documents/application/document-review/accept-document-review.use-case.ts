// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { AcceptDocumentReviewResponseDto } from '@docuvate/contracts';
import {
  dedupeExtractedFields,
  parseSuggestionStorageKey,
  partitionRecognizedAndHeuristicSuggestions,
  semanticFieldKey,
} from '@docuvate/contracts';
import { Inject, Injectable } from '@nestjs/common';

import type { AuthorizationSubject } from '../../../../shared/domain/authorization.js';
import { NotFoundError } from '../../../../shared/domain/errors.js';
import {
  DOCUMENT_REPOSITORY,
  type DocumentRepository,
  TAXONOMY_REPOSITORY,
  type TaxonomyRepository,
} from '../../../../shared/domain/ports.js';
import { AcceptTagSuggestionUseCase } from '../../../labels/application/document-label.use-cases.js';
import { LoadDocumentLabelSuggestionsUseCase } from '../../../labels/application/load-document-labels.use-case.js';
import { ListRecognizedFieldsUseCase } from '../../../recognized-fields/application/recognized-field.use-cases.js';
import { SyncDocumentSearchIndexUseCase } from '../../../search/application/sync-document-search-index.use-case.js';
import { GetDocumentUseCase } from '../get-document.use-case.js';
import { UpdateDocumentUseCase } from '../update-document.use-case.js';
import { isoDateFromFieldValue } from './document-review-field-display.js';

@Injectable()
export class AcceptDocumentReviewUseCase {
  constructor(
    @Inject(DOCUMENT_REPOSITORY) private readonly documents: DocumentRepository,
    @Inject(TAXONOMY_REPOSITORY) private readonly taxonomy: TaxonomyRepository,
    private readonly getDocument: GetDocumentUseCase,
    private readonly loadSuggestions: LoadDocumentLabelSuggestionsUseCase,
    private readonly acceptTagSuggestion: AcceptTagSuggestionUseCase,
    private readonly updateDocument: UpdateDocumentUseCase,
    private readonly listRecognizedFields: ListRecognizedFieldsUseCase,
    private readonly syncSearchIndex: SyncDocumentSearchIndexUseCase
  ) {}

  async execute(
    documentId: string,
    userId: string,
    subject: AuthorizationSubject,
    options: { minConfidence?: number } = {}
  ): Promise<AcceptDocumentReviewResponseDto> {
    const minConfidence = options.minConfidence ?? 0;
    await this.getDocument.execute(documentId, userId, subject);

    const assignedTagIds = new Set(
      (await this.taxonomy.listTagsForDocument(documentId)).map((tag) => tag.id)
    );
    const tagSuggestions = await this.loadSuggestions.execute(documentId, userId);
    let acceptedLabels = 0;
    for (const suggestion of tagSuggestions) {
      if (assignedTagIds.has(suggestion.tag.id)) {
        continue;
      }
      const confidence = suggestion.confidence ?? 0;
      if (confidence < minConfidence) {
        continue;
      }
      await this.acceptTagSuggestion.execute(documentId, userId, suggestion.tag.id);
      acceptedLabels += 1;
      assignedTagIds.add(suggestion.tag.id);
    }

    const doc = await this.documents.findByIdForUser(documentId, userId);
    if (!doc) {
      throw new NotFoundError('Document');
    }
    const catalog = await this.listRecognizedFields.execute(userId);
    const catalogKeys: ReadonlySet<string> = new Set(
      catalog.map((def: { key: string }) => def.key)
    );
    const fields = doc.extraction?.fields ?? [];
    const { suggestions } = partitionRecognizedAndHeuristicSuggestions(fields, catalogKeys);
    let acceptedFields = 0;
    let nextFields = [...fields];
    let documentDatePatch: string | null | undefined;

    for (const suggestion of suggestions) {
      if ((suggestion.confidence ?? 0) < minConfidence) {
        continue;
      }
      const value = suggestion.value.trim();
      if (!value) {
        continue;
      }
      const semantic = suggestion.key;
      nextFields = nextFields.filter(
        (row) =>
          parseSuggestionStorageKey(row.key) !== semantic &&
          semanticFieldKey(row) !== semantic
      );
      if (!nextFields.some((row) => semanticFieldKey(row) === semantic)) {
        nextFields.push({ key: semantic, value, confidence: suggestion.confidence ?? 0.9 });
        acceptedFields += 1;
      }
      if (semantic === 'date' && !doc.documentDate) {
        const iso = isoDateFromFieldValue(value);
        if (iso) {
          documentDatePatch = iso;
        }
      }
    }

    if (acceptedFields > 0 || documentDatePatch !== undefined) {
      await this.updateDocument.execute(documentId, userId, {
        extractionFields: dedupeExtractedFields(nextFields),
        ...(documentDatePatch ? { documentDate: documentDatePatch } : {}),
      });
      const updated = await this.documents.findByIdForUser(documentId, userId);
      if (updated) {
        await this.syncSearchIndex.execute(userId, documentId, {
          text: updated.extraction?.text ?? '',
          title: updated.title,
          filename: updated.filename,
          blocks: updated.extraction?.blocks,
        });
      }
    }

    return { documentId, acceptedLabels, acceptedFields };
  }
}
