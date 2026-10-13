// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { ExtractedFactDto, ExtractedFactKind } from '@docuvate/contracts';

import { isRecord, parseString } from '../../../shared/infrastructure/database/row-parse.js';

const FACT_KINDS: ExtractedFactKind[] = ['key_value', 'amount', 'date', 'table_cell'];

function isFactKind(value: string): value is ExtractedFactKind {
  for (const kind of FACT_KINDS) {
    if (kind === value) {
      return true;
    }
  }
  return false;
}

function parseProvenance(value: unknown): ExtractedFactDto['provenance'] | null {
  if (!isRecord(value)) {
    return null;
  }
  return {
    page: typeof value.page === 'number' ? value.page : null,
    x: typeof value.x === 'number' ? value.x : null,
    y: typeof value.y === 'number' ? value.y : null,
    width: typeof value.width === 'number' ? value.width : null,
    height: typeof value.height === 'number' ? value.height : null,
    charStart: typeof value.charStart === 'number' ? value.charStart : null,
    charEnd: typeof value.charEnd === 'number' ? value.charEnd : null,
  };
}

function parseFact(value: unknown): ExtractedFactDto | null {
  if (!isRecord(value)) {
    return null;
  }
  const kindRaw = parseString(value.kind);
  if (!isFactKind(kindRaw)) {
    return null;
  }
  const predicateKey = parseString(value.predicateKey).trim();
  if (!predicateKey) {
    return null;
  }
  const confidence = Number(value.confidence);
  if (!Number.isFinite(confidence)) {
    return null;
  }
  const provenance = parseProvenance(value.provenance);
  if (!provenance) {
    return null;
  }
  const fact: ExtractedFactDto = {
    kind: kindRaw,
    predicateKey,
    confidence,
    provenance,
  };
  if (typeof value.valueText === 'string') {
    fact.valueText = value.valueText;
  }
  if (typeof value.amountNumeric === 'number' && Number.isFinite(value.amountNumeric)) {
    fact.amountNumeric = value.amountNumeric;
  }
  if (typeof value.currencyCode === 'string') {
    fact.currencyCode = value.currencyCode;
  }
  if (typeof value.valueDateIso === 'string') {
    fact.valueDateIso = value.valueDateIso;
  }
  if (typeof value.tableIndex === 'number') {
    fact.tableIndex = value.tableIndex;
  }
  if (typeof value.rowIndex === 'number') {
    fact.rowIndex = value.rowIndex;
  }
  if (typeof value.colIndex === 'number') {
    fact.colIndex = value.colIndex;
  }
  return fact;
}

export function parseExtractedFacts(value: unknown): ExtractedFactDto[] {
  if (!Array.isArray(value)) {
    return [];
  }
  const facts: ExtractedFactDto[] = [];
  for (const item of value) {
    const parsed = parseFact(item);
    if (parsed) {
      facts.push(parsed);
    }
  }
  return facts;
}
