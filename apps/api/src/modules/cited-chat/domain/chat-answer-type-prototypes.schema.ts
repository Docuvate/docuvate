// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { classifyByEmbeddingPrototypes } from './chat-prototype-classifier.js';

export type ChatAnswerType = 'amount' | 'date' | 'entity' | 'free_text';

interface AnswerTypePrototypeFile {
  version: number;
  answer_types: Record<string, number[]>;
  min_score: number;
  min_margin: number;
  default_answer_type: ChatAnswerType;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isAnswerTypePrototypeFile(value: unknown): value is AnswerTypePrototypeFile {
  return (
    isRecord(value) &&
    isRecord(value.answer_types) &&
    typeof value.min_score === 'number' &&
    typeof value.min_margin === 'number' &&
    typeof value.default_answer_type === 'string'
  );
}

function loadAnswerTypeFile(): AnswerTypePrototypeFile {
  const raw = readFileSync(join(__dirname, 'chat-answer-type-prototypes.json'), 'utf8');
  const parsed: unknown = JSON.parse(raw);
  if (!isAnswerTypePrototypeFile(parsed)) {
    throw new Error('Invalid chat-answer-type-prototypes.json');
  }
  return parsed;
}

const answerTypeFile = loadAnswerTypeFile();

function parseAnswerType(key: string): ChatAnswerType {
  if (key === 'amount' || key === 'date' || key === 'entity' || key === 'free_text') {
    return key;
  }
  return answerTypeFile.default_answer_type;
}

export function classifyChatAnswerType(queryVector: number[]): ChatAnswerType {
  const key = classifyByEmbeddingPrototypes(queryVector, {
    prototypes: answerTypeFile.answer_types,
    minScore: answerTypeFile.min_score,
    minMargin: answerTypeFile.min_margin,
    defaultKey: answerTypeFile.default_answer_type,
  });
  return parseAnswerType(key);
}

/** Amount-focused questions: prefer worker extractive answers before / after LLM. */
export function prefersAmountExtractiveAnswer(queryVector: number[] | undefined): boolean {
  if (!queryVector || queryVector.length === 0) {
    return false;
  }
  return classifyChatAnswerType(queryVector) === 'amount';
}

/** Library retrieval: narrow supplement when the question targets a scoped fact or time. */
export function libraryAnswerTypeWantsContextualSupplement(answerType: ChatAnswerType): boolean {
  return answerType === 'amount' || answerType === 'date';
}
