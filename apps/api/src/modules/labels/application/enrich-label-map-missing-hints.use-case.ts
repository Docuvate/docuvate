// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { LabelMapPointDto } from '@docuvate/contracts';
import { Inject, Injectable, Logger } from '@nestjs/common';

import {
  DOCUMENT_REPOSITORY,
  type DocumentRepository,
} from '../../../shared/domain/ports.js';
import type { MissingLabelHintPort } from '../domain/ce-label-propagation.port.js';
import { HttpCeMlAdapter } from '../infrastructure/http-ce-ml.adapter.js';

const MAX_HINTS_PER_MAP = 12;

interface MapRowRef {
  documentId: string;
  documentIndex: number;
  nonInboxTagIds: string[];
  text: string;
  embedding: number[];
}

@Injectable()
export class EnrichLabelMapMissingHintsUseCase {
  private readonly logger = new Logger(EnrichLabelMapMissingHintsUseCase.name);

  constructor(
    @Inject(DOCUMENT_REPOSITORY) private readonly documents: DocumentRepository,
    @Inject(HttpCeMlAdapter) private readonly ceMl: MissingLabelHintPort
  ) {}

  async execute(
    userId: string,
    points: LabelMapPointDto[],
    rows: MapRowRef[]
  ): Promise<{ points: LabelMapPointDto[]; labelMissingHintCount: number }> {
    const candidates = points.filter(
      (point) =>
        point.kind === 'document' &&
        point.documentId &&
        point.coverageStatus === 'unexplained' &&
        (point.tagIds?.length ?? 0) > 0
    );
    if (candidates.length === 0) {
      return { points, labelMissingHintCount: 0 };
    }
    const byDocumentId = new Map(rows.map((row) => [row.documentId, row] as const));
    const corpus = rows.map((row) => ({
      documentIndex: row.documentIndex,
      embedding: row.embedding,
      tagIds: row.nonInboxTagIds,
      text: row.text,
    }));
    const labeledDocumentIndices = rows.flatMap((row) =>
      row.nonInboxTagIds.length > 0 ? [row.documentIndex] : []
    );
    const sorted = [...candidates].sort(
      (a, b) => (a.coverageScore ?? 0) - (b.coverageScore ?? 0)
    );
    const toScore = sorted.slice(0, MAX_HINTS_PER_MAP);
    const targets: { targetDocumentIndex: number; assignedTagIds: string[]; documentId: string }[] =
      [];
    for (const point of toScore) {
      const documentId = point.documentId;
      if (!documentId) {
        continue;
      }
      const row = byDocumentId.get(documentId);
      if (!row) {
        continue;
      }
      if (row.embedding.length === 0 || labeledDocumentIndices.length < 2) {
        continue;
      }
      targets.push({
        targetDocumentIndex: row.documentIndex,
        assignedTagIds: row.nonInboxTagIds,
        documentId,
      });
    }
    if (targets.length === 0) {
      return { points, labelMissingHintCount: 0 };
    }
    let hintCount = 0;
    const hintByDocId = new Map<string, boolean>();
    try {
      const batch = await this.ceMl.scoreMissingLabelHintsBatch({
        targets: targets.map((target) => ({
          targetDocumentIndex: target.targetDocumentIndex,
          assignedTagIds: target.assignedTagIds,
        })),
        corpus,
        labeledDocumentIndices,
      });
      const showByIndex = new Map(
        batch.filter((row) => row.show).map((row) => [row.targetDocumentIndex, true] as const)
      );
      for (const target of targets) {
        if (showByIndex.get(target.targetDocumentIndex)) {
          hintByDocId.set(target.documentId, true);
          hintCount += 1;
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.debug(`Missing-label hint batch skipped: ${message}`);
    }

    const enriched = points.map((point) => {
      if (point.kind !== 'document' || !point.documentId) {
        return point;
      }
      const hint = hintByDocId.get(point.documentId);
      return hint ? { ...point, labelMissingHint: true } : point;
    });
    return { points: enriched, labelMissingHintCount: hintCount };
  }
}
