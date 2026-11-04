// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { isRecord, parseNumber } from '../../../shared/domain/row-parse.js';

interface CitedChatBenchTimingMs {
  embedMs: number;
  retrieveMs: number;
  rerankMs: number;
  llmMs: number;
  verifyMs: number;
  totalMs: number;
  promptChars: number;
}

interface CitedChatBenchStatsPayload {
  citedRejectedClaims: number;
  timingMs?: CitedChatBenchTimingMs;
}

export function serializeCitedChatBenchStats(payload: CitedChatBenchStatsPayload): string {
  return JSON.stringify(payload);
}

export function parseCitedChatBenchStatsPayload(
  errorDetail: string | null | undefined
): CitedChatBenchStatsPayload | undefined {
  const raw = errorDetail?.trim();
  if (!raw?.startsWith('{')) {
    return undefined;
  }
  try {
    const value: unknown = JSON.parse(raw);
    if (!isRecord(value)) {
      return undefined;
    }
    const citedRejectedClaims = parseNumber(value.citedRejectedClaims, Number.NaN);
    if (!Number.isFinite(citedRejectedClaims)) {
      return undefined;
    }
    return { citedRejectedClaims };
  } catch {
    return undefined;
  }
}
