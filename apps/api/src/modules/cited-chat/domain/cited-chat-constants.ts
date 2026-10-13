// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
export const CITED_CHAT_ABSTENTION_DE = 'Dazu habe ich in Ihren Dokumenten nichts gefunden.';
export const CITED_CHAT_ABSTENTION_EN = 'I did not find anything about that in your documents.';

export const RAG_HYBRID_CANDIDATE_LIMIT = 20;
export const RAG_RERANK_TOP_K = 4;

/** Sigmoid rerank score; calibrated with bench/rag_gate_calibrate.py (bge-reranker-v2-m3-int8). */
export const RAG_RERANKER_GATE_MIN_DEFAULT = 0.21;

/** RRF fusion score when reranker is down (weak matches stay below ~0.02). */
export const RAG_FUSION_GATE_MIN_DEFAULT = 0.02;

/** Below calibrated gate but above this, still attempt LLM (self-check via empty claims). */
export const RAG_RERANKER_SOFT_MIN_DEFAULT = 0.08;

/** Fusion floor for LLM when reranker is unreachable. */
export const RAG_FUSION_SOFT_MIN_DEFAULT = 0.015;

export function ragRerankerGateThreshold(): number {
  const raw = process.env['RAG_RERANKER_GATE_MIN'];
  if (!raw) {
    return RAG_RERANKER_GATE_MIN_DEFAULT;
  }
  const parsed = Number.parseFloat(raw);
  return Number.isFinite(parsed) ? parsed : RAG_RERANKER_GATE_MIN_DEFAULT;
}

export function citedChatBenchStatsEnabled(): boolean {
  return process.env['DOCUVATE_CITED_CHAT_BENCH_STATS']?.toLowerCase() === '1';
}

export function ragFusionGateThreshold(): number {
  const raw = process.env['RAG_FUSION_GATE_MIN'];
  if (!raw) {
    return RAG_FUSION_GATE_MIN_DEFAULT;
  }
  const parsed = Number.parseFloat(raw);
  return Number.isFinite(parsed) ? parsed : RAG_FUSION_GATE_MIN_DEFAULT;
}

export function ragRerankerSoftThreshold(): number {
  const raw = process.env['RAG_RERANKER_SOFT_MIN'];
  if (!raw) {
    return RAG_RERANKER_SOFT_MIN_DEFAULT;
  }
  const parsed = Number.parseFloat(raw);
  return Number.isFinite(parsed) ? parsed : RAG_RERANKER_SOFT_MIN_DEFAULT;
}

export function ragFusionSoftThreshold(): number {
  const raw = process.env['RAG_FUSION_SOFT_MIN'];
  if (!raw) {
    return RAG_FUSION_SOFT_MIN_DEFAULT;
  }
  const parsed = Number.parseFloat(raw);
  return Number.isFinite(parsed) ? parsed : RAG_FUSION_SOFT_MIN_DEFAULT;
}
