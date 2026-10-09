// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

export interface CitedChatBenchTimingMs {
  retrieveMs: number;
  rerankMs: number;
  llmMs: number;
  verifyMs: number;
  totalMs: number;
  promptChars: number;
}

export interface CitedChatBenchStatsPayload {
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
    const parsed = JSON.parse(raw) as CitedChatBenchStatsPayload;
    if (
      typeof parsed.citedRejectedClaims !== 'number' ||
      !Number.isFinite(parsed.citedRejectedClaims)
    ) {
      return undefined;
    }
    return parsed;
  } catch {
    return undefined;
  }
}
