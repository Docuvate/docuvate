// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  classifyChatAnswerType,
  prefersAmountExtractiveAnswer,
} from './chat-answer-type-prototypes.schema.js';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function loadPrototype(key: string): number[] {
  const raw = readFileSync(join(__dirname, 'chat-answer-type-prototypes.json'), 'utf8');
  const parsed: unknown = JSON.parse(raw);
  if (!isRecord(parsed)) {
    throw new Error('invalid prototypes');
  }
  const typesRaw = parsed.answer_types;
  if (!isRecord(typesRaw)) {
    throw new Error('invalid answer_types');
  }
  const vecRaw = typesRaw[key];
  if (!Array.isArray(vecRaw) || !vecRaw.every((entry) => typeof entry === 'number')) {
    throw new Error(`missing prototype ${key}`);
  }
  return vecRaw;
}

describe('classifyChatAnswerType', () => {
  it('classifies smoke payroll amount questions as amount', () => {
    const amountVec = loadPrototype('amount');
    expect(classifyChatAnswerType(amountVec)).toBe('amount');
    expect(prefersAmountExtractiveAnswer(amountVec)).toBe(true);
  });

  it('classifies date questions separately from amount centroids', () => {
    const dateVec = loadPrototype('date');
    expect(classifyChatAnswerType(dateVec)).toBe('date');
    expect(prefersAmountExtractiveAnswer(dateVec)).toBe(false);
  });

  it('does not prefer extractive answers without an embedding', () => {
    expect(prefersAmountExtractiveAnswer(undefined)).toBe(false);
    expect(prefersAmountExtractiveAnswer([])).toBe(false);
  });

  it('free-text centroid is not treated as amount for extractive routing', () => {
    const free = loadPrototype('free_text');
    expect(classifyChatAnswerType(free)).toBe('free_text');
    expect(prefersAmountExtractiveAnswer(free)).toBe(false);
  });
});
