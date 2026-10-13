// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { cosineSimilarity } from './embedding-cosine.js';

interface OverviewPrototypeFile {
  version: number;
  positive: number[];
  min_score: number;
}

function isOverviewPrototypeFile(value: unknown): value is OverviewPrototypeFile {
  return (
    typeof value === 'object' &&
    value !== null &&
    Array.isArray((value as OverviewPrototypeFile).positive) &&
    typeof (value as OverviewPrototypeFile).min_score === 'number'
  );
}

function loadOverviewFile(): OverviewPrototypeFile {
  const raw = readFileSync(join(__dirname, 'chat-document-overview-prototypes.json'), 'utf8');
  const parsed: unknown = JSON.parse(raw);
  if (!isOverviewPrototypeFile(parsed)) {
    throw new Error('Invalid chat-document-overview-prototypes.json');
  }
  return parsed;
}

const overviewFile = loadOverviewFile();

/** Whole-document questions (summary / topic) should not rely on similarity retrieval gates. */
export function isDocumentOverviewQuestion(queryVector: number[]): boolean {
  if (queryVector.length === 0) {
    return false;
  }
  const score = cosineSimilarity(queryVector, overviewFile.positive);
  return score >= overviewFile.min_score;
}
