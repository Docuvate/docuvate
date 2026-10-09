export const CITED_CHAT_ABSTENTION_DE =
  'Dazu habe ich in Ihren Dokumenten nichts gefunden.';
export const CITED_CHAT_ABSTENTION_EN =
  'I did not find anything about that in your documents.';

export const RAG_HYBRID_CANDIDATE_LIMIT = 20;
export const RAG_RERANK_TOP_K = 4;

export function ragRerankerGateThreshold(): number {
  const raw = process.env['RAG_RERANKER_GATE_MIN'];
  if (!raw) {
    return 0;
  }
  const parsed = Number.parseFloat(raw);
  return Number.isFinite(parsed) ? parsed : 0;
}
