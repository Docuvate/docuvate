export const CITED_CHAT_ABSTENTION_DE =
  'Dazu habe ich in Ihren Dokumenten nichts gefunden.';
export const CITED_CHAT_ABSTENTION_EN =
  'I did not find anything about that in your documents.';

export const RAG_HYBRID_CANDIDATE_LIMIT = 20;
export const RAG_RERANK_TOP_K = 4;

/** Sigmoid rerank score; calibrated with bench/rag_gate_calibrate.py (bge-reranker-v2-m3-int8). */
export const RAG_RERANKER_GATE_MIN_DEFAULT = 0.21;

/** RRF fusion score when reranker is down (weak matches stay below ~0.02). */
export const RAG_FUSION_GATE_MIN_DEFAULT = 0.02;

export function ragRerankerGateThreshold(): number {
  const raw = process.env['RAG_RERANKER_GATE_MIN'];
  if (!raw) {
    return RAG_RERANKER_GATE_MIN_DEFAULT;
  }
  const parsed = Number.parseFloat(raw);
  return Number.isFinite(parsed) ? parsed : RAG_RERANKER_GATE_MIN_DEFAULT;
}

export function ragFusionGateThreshold(): number {
  const raw = process.env['RAG_FUSION_GATE_MIN'];
  if (!raw) {
    return RAG_FUSION_GATE_MIN_DEFAULT;
  }
  const parsed = Number.parseFloat(raw);
  return Number.isFinite(parsed) ? parsed : RAG_FUSION_GATE_MIN_DEFAULT;
}
