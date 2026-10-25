// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { parentPort, workerData } from 'node:worker_threads';

import type { LabelHybridDocumentRow } from '../domain/label-hybrid-training.js';
import { trainUserLabelHybridModel } from '../domain/label-hybrid-training.js';

interface LabelHybridTrainWorkerData {
  rows: LabelHybridDocumentRow[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function parseWorkerData(value: unknown): LabelHybridTrainWorkerData {
  if (typeof value !== 'object' || value === null) {
    throw new Error('label hybrid train worker: invalid payload');
  }
  const entries = Object.entries(value);
  const rowsEntry = entries.find(([key]) => key === 'rows');
  if (!rowsEntry || !Array.isArray(rowsEntry[1])) {
    throw new Error('label hybrid train worker: missing rows');
  }
  const rows: LabelHybridDocumentRow[] = [];
  for (const raw of rowsEntry[1]) {
    if (!isRecord(raw)) {
      continue;
    }
    const rowEntries = Object.entries(raw);
    const documentId = rowEntries.find(([key]) => key === 'documentId')?.[1];
    const text = rowEntries.find(([key]) => key === 'text')?.[1];
    const embeddingRaw = rowEntries.find(([key]) => key === 'embedding')?.[1];
    const tagIdsRaw = rowEntries.find(([key]) => key === 'nonInboxTagIds')?.[1];
    if (typeof documentId !== 'string' || typeof text !== 'string') {
      continue;
    }
    if (!Array.isArray(embeddingRaw) || !Array.isArray(tagIdsRaw)) {
      continue;
    }
    const embedding = embeddingRaw.filter((v): v is number => typeof v === 'number');
    const nonInboxTagIds = tagIdsRaw.filter((v): v is string => typeof v === 'string');
    rows.push({ documentId, text, embedding, nonInboxTagIds });
  }
  return { rows };
}

const payload = parseWorkerData(workerData);
const model = trainUserLabelHybridModel(payload.rows);
parentPort?.postMessage(model);
