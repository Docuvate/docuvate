// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { classifyByEmbeddingPrototypes } from './chat-prototype-classifier.js';

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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isIntentPrototypeFile(value: unknown): value is IntentPrototypeFile {
  return (
    isRecord(value) &&
    isRecord(value.intents) &&
    typeof value.min_score === 'number' &&
    typeof value.min_margin === 'number' &&
    typeof value.default_intent === 'string'
  );
}

function isStatsOperationPrototypeFile(value: unknown): value is StatsOperationPrototypeFile {
  return (
    isRecord(value) &&
    isRecord(value.operations) &&
    typeof value.min_score === 'number' &&
    typeof value.min_margin === 'number' &&
    typeof value.default_operation === 'string'
  );
}

function loadIntentFile(): IntentPrototypeFile {
  const raw = readFileSync(join(__dirname, 'chat-intent-prototypes.json'), 'utf8');
  const parsed: unknown = JSON.parse(raw);
  if (!isIntentPrototypeFile(parsed)) {
    throw new Error('Invalid chat-intent-prototypes.json');
  }
  return parsed;
}

function loadStatsFile(): StatsOperationPrototypeFile {
  const raw = readFileSync(join(__dirname, 'chat-stats-operation-prototypes.json'), 'utf8');
  const parsed: unknown = JSON.parse(raw);
  if (!isStatsOperationPrototypeFile(parsed)) {
    throw new Error('Invalid chat-stats-operation-prototypes.json');
  }
  return parsed;
}

const intentFile = loadIntentFile();
const statsFile = loadStatsFile();

export function classifyChatRouteIntent(queryVector: number[]): ChatRouteIntent {
  const key = classifyByEmbeddingPrototypes(queryVector, {
    prototypes: intentFile.intents,
    minScore: intentFile.min_score,
    minMargin: intentFile.min_margin,
    defaultKey: intentFile.default_intent,
  });
  if (key === 'document_qa' || key === 'stats' || key === 'smalltalk' || key === 'out_of_scope') {
    return key;
  }
  return intentFile.default_intent;
}

export function classifyStatsOperation(queryVector: number[]): ChatStatsOperation {
  const key = classifyByEmbeddingPrototypes(queryVector, {
    prototypes: statsFile.operations,
    minScore: statsFile.min_score,
    minMargin: statsFile.min_margin,
    defaultKey: statsFile.default_operation,
  });
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
