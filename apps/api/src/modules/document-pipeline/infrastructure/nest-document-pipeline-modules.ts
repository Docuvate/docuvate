// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Inject, Injectable } from '@nestjs/common';
import { ApplyDuplicateDetectionUseCase } from '../../duplicates/application/apply-duplicate-detection.use-case.js';
import { ApplyEmbeddingSuggestionsUseCase } from '../../labels/application/apply-embedding-suggestions.use-case.js';
import { ApplyLabelMatchingUseCase } from '../../labels/application/apply-label-matching.use-case.js';
import { ApplyGlobalRecognizedFieldsUseCase } from '../../recognized-fields/application/apply-global-recognized-fields.use-case.js';
import { DOCUMENT_REPOSITORY, type DocumentRepository } from '../../../shared/domain/ports.js';
import type {
  DocumentPipelineContext,
  DocumentPipelineModule,
} from '../domain/document-pipeline.types.js';

@Injectable()
export class LabelMatchingDocumentPipelineStep implements DocumentPipelineModule {
  readonly descriptor = {
    id: 'label_matching' as const,
    labelDe: 'Label-Matching (Regeln)',
    descriptionDe: 'Schlüsselwort- und Regex-Regeln; auto-Zuweisung oder Vorschläge.',
    defaultEnabled: true,
    defaultOrder: 10,
  };

  constructor(private readonly applyLabelMatching: ApplyLabelMatchingUseCase) {}

  run(context: DocumentPipelineContext): Promise<void> {
    return this.applyLabelMatching.execute(context.documentId, context.userId, context.content);
  }
}

@Injectable()
export class EmbeddingSuggestionsDocumentPipelineStep implements DocumentPipelineModule {
  readonly descriptor = {
    id: 'embedding_suggestions' as const,
    labelDe: 'Label-Vorschläge (Embeddings)',
    descriptionDe: 'Ähnlichkeit zu bestehenden Labels; Vorschläge mit Konfidenz.',
    defaultEnabled: true,
    defaultOrder: 20,
  };

  constructor(private readonly applyEmbeddingSuggestions: ApplyEmbeddingSuggestionsUseCase) {}

  run(context: DocumentPipelineContext): Promise<void> {
    return this.applyEmbeddingSuggestions.execute(
      context.documentId,
      context.userId,
      context.content
    );
  }
}

@Injectable()
export class GlobalRecognizedFieldsDocumentPipelineStep implements DocumentPipelineModule {
  readonly descriptor = {
    id: 'global_recognized_fields' as const,
    labelDe: 'Erkannte Felder (Katalog)',
    descriptionDe:
      'Katalog-Felder: sofort ohne Schwelle oder nach Qualitäts-Schwelle (Label-Konfidenz und/oder Pflicht-Labels).',
    defaultEnabled: true,
    defaultOrder: 30,
  };

  constructor(private readonly applyGlobalFields: ApplyGlobalRecognizedFieldsUseCase) {}

  run(context: DocumentPipelineContext): Promise<void> {
    return this.applyGlobalFields.execute(context.documentId, context.userId);
  }
}

@Injectable()
export class LabelAttachedFieldsDocumentPipelineStep implements DocumentPipelineModule {
  readonly descriptor = {
    id: 'label_attached_fields' as const,
    labelDe: 'Label-Felder (Archiv)',
    descriptionDe:
      'Veraltet — Feld-Extraktion läuft über den Katalog „Erkannte Felder“. Schritt bleibt für Kompatibilität leer.',
    defaultEnabled: true,
    defaultOrder: 40,
  };

  run(_context: DocumentPipelineContext): Promise<void> {
    return Promise.resolve();
  }
}

@Injectable()
export class DuplicateDetectionDocumentPipelineStep implements DocumentPipelineModule {
  readonly descriptor = {
    id: 'duplicate_detection' as const,
    labelDe: 'Duplikat-Erkennung',
    descriptionDe: 'Hash- und Embedding-Kandidaten nach Verarbeitung.',
    defaultEnabled: true,
    defaultOrder: 50,
  };

  constructor(
    private readonly applyDuplicateDetection: ApplyDuplicateDetectionUseCase,
    @Inject(DOCUMENT_REPOSITORY) private readonly documents: DocumentRepository
  ) {}

  async run(context: DocumentPipelineContext): Promise<void> {
    const doc = await this.documents.findById(context.documentId);
    await this.applyDuplicateDetection.execute(
      context.documentId,
      context.userId,
      doc?.contentHash ?? null
    );
  }
}
