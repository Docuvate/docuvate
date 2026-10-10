// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { isRecord } from '../../../shared/infrastructure/database/row-parse.js';

export interface CitedClaimCitationJson {
  source: string;
  quote: string;
}

export interface CitedClaimJson {
  text: string;
  source?: string;
  quote?: string;
  /** Multiple source/quote pairs when one sentence cites several documents or spans. */
  citations?: CitedClaimCitationJson[];
}

export interface CitedAnswerJson {
  claims: CitedClaimJson[];
}

function isCitedClaimCitationJson(value: unknown): value is CitedClaimCitationJson {
  if (!isRecord(value)) {
    return false;
  }
  return typeof value.source === 'string' && typeof value.quote === 'string';
}

function isCitedClaimJson(value: unknown): value is CitedClaimJson {
  if (!isRecord(value)) {
    return false;
  }
  if (typeof value.text !== 'string') {
    return false;
  }
  if (value.source !== undefined && typeof value.source !== 'string') {
    return false;
  }
  if (value.quote !== undefined && typeof value.quote !== 'string') {
    return false;
  }
  if (value.citations !== undefined) {
    if (!Array.isArray(value.citations)) {
      return false;
    }
    for (const item of value.citations) {
      if (!isCitedClaimCitationJson(item)) {
        return false;
      }
    }
  }
  return true;
}

export function parseCitedAnswerJson(value: unknown): CitedAnswerJson | null {
  if (!isRecord(value)) {
    return null;
  }
  if (!Array.isArray(value.claims)) {
    return null;
  }
  const claims: CitedClaimJson[] = [];
  for (const claim of value.claims) {
    if (!isCitedClaimJson(claim)) {
      return null;
    }
    claims.push(claim);
  }
  return { claims };
}
