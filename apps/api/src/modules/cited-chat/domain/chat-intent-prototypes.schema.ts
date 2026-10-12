// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { cosineSimilarity } from './embedding-cosine.js';

export type ChatRouteIntent = 'document_qa' | 'stats' | 'smalltalk' | 'out_of_scope';

export type ChatStatsOperation =
  | 'count_total'
  | 'count_ready'
  | 'count_by_label'
  | 'list_by_label';

interface IntentPrototypeFile {
  version: number;
  intents: Record<string, number[]>;
  min_score: number;
  min_margin: number;
  default_intent: ChatRouteIntent;
}

interface StatsOperationPrototypeFile {
  version: number;
  operations: Record<string, number[]>;
  min_score: number;
  min_margin: number;
  default_operation: ChatStatsOperation;
}

function loadJson<T>(name: string): T {
  const raw = readFileSync(join(__dirname, name), 'utf8');
  return JSON.parse(raw) as T;
}

const intentFile = loadJson<IntentPrototypeFile>('chat-intent-prototypes.json');
const statsFile = loadJson<StatsOperationPrototypeFile>('chat-stats-operation-prototypes.json');

function classifyPrototype(
  queryVector: number[],
  prototypes: Record<string, number[]>,
  minScore: number,
  minMargin: number,
  fallback: string
): string {
  const scored = Object.entries(prototypes)
    .map(([key, vec]) => ({ key, score: cosineSimilarity(queryVector, vec) }))
    .sort((a, b) => b.score - a.score);
  if (scored.length === 0) {
    return fallback;
  }
  const best = scored[0];
  const second = scored[1]?.score ?? 0;
  if (best.score < minScore || best.score - second < minMargin) {
    return fallback;
  }
  return best.key;
}

export function classifyChatRouteIntent(queryVector: number[]): ChatRouteIntent {
  const key = classifyPrototype(
    queryVector,
    intentFile.intents,
    intentFile.min_score,
    intentFile.min_margin,
    intentFile.default_intent
  );
  if (key === 'document_qa' || key === 'stats' || key === 'smalltalk' || key === 'out_of_scope') {
    return key;
  }
  return intentFile.default_intent;
}

export function classifyStatsOperation(queryVector: number[]): ChatStatsOperation {
  const key = classifyPrototype(
    queryVector,
    statsFile.operations,
    statsFile.min_score,
    statsFile.min_margin,
    statsFile.default_operation
  );
  if (
    key === 'count_total' ||
    key === 'count_ready' ||
    key === 'count_by_label' ||
    key === 'list_by_label'
  ) {
    return key;
  }
  return statsFile.default_operation;
}
