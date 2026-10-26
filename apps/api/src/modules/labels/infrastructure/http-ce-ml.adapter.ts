// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Injectable, Logger } from '@nestjs/common';

import { isRecord, parseNumber, parseString } from '../../../shared/infrastructure/database/row-parse.js';
import { workerApiUrl } from '../../../shared/infrastructure/worker/worker-api-path.js';

export interface CeLabelPropagationScore {
  documentIndex: number;
  score: number;
  tier: 'auto_assign' | 'suggest' | 'none';
}

export interface CeDiscoveredField {
  fieldKey: string;
  displayName: string;
  confidence: number;
  kind: string;
}

function workerBase(): { url: string; secret: string } {
  return {
    url: process.env['WORKER_URL'] ?? 'http://localhost:8000',
    secret: process.env['WORKER_SECRET'] ?? 'worker-shared-secret',
  };
}

function parsePropagationScores(raw: unknown): CeLabelPropagationScore[] {
  if (!isRecord(raw) || !Array.isArray(raw.scores)) {
    return [];
  }
  const out: CeLabelPropagationScore[] = [];
  for (const row of raw.scores) {
    if (!isRecord(row)) {
      continue;
    }
    const tierRaw = parseString(row.tier);
    const tier =
      tierRaw === 'auto_assign' || tierRaw === 'suggest' || tierRaw === 'none' ? tierRaw : 'none';
    out.push({
      documentIndex: parseNumber(row.document_index, -1),
      score: parseNumber(row.score, 0),
      tier,
    });
  }
  return out.filter((row) => row.documentIndex >= 0);
}

@Injectable()
export class HttpCeMlAdapter {
  private readonly logger = new Logger(HttpCeMlAdapter.name);
  async propagateLabelScores(input: {
    labelName: string;
    passageVectors: number[][];
    passageTexts: string[];
    seedDocumentIndices: number[];
    positiveDocumentIndices: number[];
    calibrationDocumentIndices: number[];
  }): Promise<CeLabelPropagationScore[]> {
    const { url, secret } = workerBase();
    const response = await fetch(workerApiUrl(url, '/ml/ce/label-propagation'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Worker-Secret': secret,
      },
      body: JSON.stringify({
        label_name: input.labelName,
        passage_vectors: input.passageVectors,
        passage_texts: input.passageTexts,
        seed_document_indices: input.seedDocumentIndices,
        positive_document_indices: input.positiveDocumentIndices,
        calibration_document_indices: input.calibrationDocumentIndices,
      }),
    });
    if (!response.ok) {
      throw new Error(`Worker CE label propagation failed: ${String(response.status)}`);
    }
    return parsePropagationScores(await response.json());
  }

  async discoverConditionalFields(input: {
    labelConfidence: number;
    documents: {
      documentId: string;
      blocks: {
        text: string;
        page: number;
        x: number;
        y: number;
        width: number;
        height: number;
      }[];
    }[];
  }): Promise<CeDiscoveredField[]> {
    const { url, secret } = workerBase();
    const response = await fetch(workerApiUrl(url, '/ml/ce/field-discovery'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Worker-Secret': secret,
      },
      body: JSON.stringify({
        label_confidence: input.labelConfidence,
        documents: input.documents.map((doc) => ({
          document_id: doc.documentId,
          blocks: doc.blocks.map((block) => ({
            text: block.text,
            page: block.page,
            x: block.x,
            y: block.y,
            width: block.width,
            height: block.height,
          })),
        })),
      }),
    });
    if (!response.ok) {
      throw new Error(`Worker CE field discovery failed: ${String(response.status)}`);
    }
    const raw: unknown = await response.json();
    if (!isRecord(raw) || !Array.isArray(raw.fields)) {
      return [];
    }
    const fields: CeDiscoveredField[] = [];
    for (const row of raw.fields) {
      if (!isRecord(row)) {
        continue;
      }
      fields.push({
        fieldKey: parseString(row.field_key),
        displayName: parseString(row.display_name),
        confidence: parseNumber(row.confidence, 0),
        kind: parseString(row.kind),
      });
    }
    return fields.filter((field) => field.fieldKey.length > 0);
  }

  async scoreMissingLabelHint(input: {
    targetDocumentIndex: number;
    assignedTagIds: string[];
    corpus: {
      documentIndex: number;
      embedding: number[];
      tagIds: string[];
      text: string;
    }[];
    labeledDocumentIndices: number[];
  }): Promise<{ score: number; show: boolean }> {
    const { url, secret } = workerBase();
    const response = await fetch(workerApiUrl(url, '/ml/ce/missing-label'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Worker-Secret': secret,
      },
      body: JSON.stringify({
        target_document_index: input.targetDocumentIndex,
        assigned_tag_ids: input.assignedTagIds,
        corpus: input.corpus.map((row) => ({
          document_index: row.documentIndex,
          embedding: row.embedding,
          tag_ids: row.tagIds,
          text: row.text,
        })),
        labeled_document_indices: input.labeledDocumentIndices,
      }),
    });
    if (!response.ok) {
      throw new Error(`Worker CE missing-label hint failed: ${String(response.status)}`);
    }
    const raw: unknown = await response.json();
    if (!isRecord(raw)) {
      return { score: 0, show: false };
    }
    return {
      score: parseNumber(raw.score, 0),
      show: raw.show === true,
    };
  }

  async scoreMissingLabelHintsBatch(input: {
    targets: { targetDocumentIndex: number; assignedTagIds: string[] }[];
    corpus: {
      documentIndex: number;
      embedding: number[];
      tagIds: string[];
      text: string;
    }[];
    labeledDocumentIndices: number[];
  }): Promise<{ targetDocumentIndex: number; score: number; show: boolean }[]> {
    if (input.targets.length === 0) {
      return [];
    }
    const { url, secret } = workerBase();
    const response = await fetch(workerApiUrl(url, '/ml/ce/missing-label-batch'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Worker-Secret': secret,
      },
      body: JSON.stringify({
        targets: input.targets.map((target) => ({
          target_document_index: target.targetDocumentIndex,
          assigned_tag_ids: target.assignedTagIds,
        })),
        corpus: input.corpus.map((row) => ({
          document_index: row.documentIndex,
          embedding: row.embedding,
          tag_ids: row.tagIds,
          text: row.text,
        })),
        labeled_document_indices: input.labeledDocumentIndices,
      }),
    });
    if (response.status === 404 || response.status === 405) {
      this.logger.debug(
        `Worker CE missing-label batch unavailable (${String(response.status)}); skipping batch hints`
      );
      return [];
    }
    if (!response.ok) {
      throw new Error(`Worker CE missing-label batch failed: ${String(response.status)}`);
    }
    const raw: unknown = await response.json();
    if (!isRecord(raw) || !Array.isArray(raw.results)) {
      return [];
    }
    const results: { targetDocumentIndex: number; score: number; show: boolean }[] = [];
    for (const row of raw.results) {
      if (!isRecord(row)) {
        continue;
      }
      results.push({
        targetDocumentIndex: parseNumber(row.target_document_index, -1),
        score: parseNumber(row.score, 0),
        show: row.show === true,
      });
    }
    return results.filter((row) => row.targetDocumentIndex >= 0);
  }
}
