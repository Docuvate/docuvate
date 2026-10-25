// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { ExtractionBlock, LabelMapPointDto } from '@docuvate/contracts';
import { Inject, Injectable, Logger } from '@nestjs/common';

import {
  DOCUMENT_REPOSITORY,
  type DocumentRepository,
} from '../../../shared/domain/ports.js';
import { contentTokensFromText } from '../domain/ce-content-tokens.js';
import type { MissingLabelHintPort } from '../domain/ce-label-propagation.port.js';

const MAX_HINTS_PER_MAP = 12;

interface MapRowRef {
  documentId: string;
  nonInboxTagIds: string[];
  text: string;
}

@Injectable()
export class EnrichLabelMapMissingHintsUseCase {
  private readonly logger = new Logger(EnrichLabelMapMissingHintsUseCase.name);

  constructor(
    @Inject(DOCUMENT_REPOSITORY) private readonly documents: DocumentRepository,
    private readonly ceMl: MissingLabelHintPort
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
    const sorted = [...candidates].sort(
      (a, b) => (a.coverageScore ?? 0) - (b.coverageScore ?? 0)
    );
    const toScore = sorted.slice(0, MAX_HINTS_PER_MAP);
    let hintCount = 0;
    const hintByDocId = new Map<string, boolean>();

    for (const point of toScore) {
      const documentId = point.documentId;
      if (!documentId) {
        continue;
      }
      const row = byDocumentId.get(documentId);
      if (!row) {
        continue;
      }
      const entity = await this.documents.findByIdForUser(documentId, userId);
      const blocks = entity?.extraction?.blocks;
      if (!blocks || blocks.length === 0) {
        continue;
      }
      const exampleSets = this.exampleTokenSetsForDocument(row, rows);
      if (exampleSets.length === 0) {
        continue;
      }
      const pageSize = pageDimensions(blocks);
      try {
        const result = await this.ceMl.scoreMissingLabelHint({
          exampleTokenSets: exampleSets,
          words: blocks.map((block) => ({
            text: block.text,
            box: [block.x, block.y, block.x + block.width, block.y + block.height],
          })),
          pageWidth: pageSize.width,
          pageHeight: pageSize.height,
        });
        if (result.show) {
          hintByDocId.set(documentId, true);
          hintCount += 1;
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        this.logger.debug(`Missing-label hint skipped for ${documentId}: ${message}`);
      }
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

  private exampleTokenSetsForDocument(target: MapRowRef, allRows: MapRowRef[]): string[][] {
    const tagSet = new Set(target.nonInboxTagIds);
    const sets: string[][] = [];
    for (const row of allRows) {
      if (row.documentId === target.documentId) {
        continue;
      }
      if (!row.nonInboxTagIds.some((tagId) => tagSet.has(tagId))) {
        continue;
      }
      const tokens = contentTokensFromText(row.text);
      if (tokens.length > 0) {
        sets.push(tokens);
      }
    }
    return sets;
  }
}

function pageDimensions(blocks: ExtractionBlock[]): { width: number; height: number } {
  let maxX = 1;
  let maxY = 1;
  for (const block of blocks) {
    maxX = Math.max(maxX, block.x + block.width);
    maxY = Math.max(maxY, block.y + block.height);
  }
  return { width: maxX, height: maxY };
}
