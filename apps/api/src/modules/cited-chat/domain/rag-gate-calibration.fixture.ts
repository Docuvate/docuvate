import { passesFusionGate, passesRerankerGate } from './verify-citation-quote.js';
import {
  RAG_FUSION_GATE_MIN_DEFAULT,
  RAG_RERANKER_GATE_MIN_DEFAULT,
} from './cited-chat-constants.js';

/** Recorded sigmoid scores from DE+EN microbench (bge-reranker-v2-m3, CPU). */
export const RAG_GATE_CALIBRATION_FIXTURE = [
  { id: 'de-invoice-total', score: 0.31, expectPass: true },
  { id: 'de-rent-due', score: 0.29, expectPass: true },
  { id: 'de-notice-period', score: 0.27, expectPass: false },
  { id: 'de-notice-period-relaxed', score: 0.28, expectPass: true },
  { id: 'de-off-topic-weather', score: 0.04, expectPass: false },
  { id: 'en-off-topic', score: 0.03, expectPass: false },
  { id: 'fusion-weak', score: 0.01, expectPass: false },
  { id: 'fusion-ok', score: 0.03, expectPass: true },
] as const;

export function calibrationThresholds() {
  return {
    reranker: RAG_RERANKER_GATE_MIN_DEFAULT,
    fusion: RAG_FUSION_GATE_MIN_DEFAULT,
  };
}

export function rerankerGatePasses(score: number): boolean {
  return passesRerankerGate(score, RAG_RERANKER_GATE_MIN_DEFAULT);
}

export function fusionGatePasses(score: number): boolean {
  return passesFusionGate(score, RAG_FUSION_GATE_MIN_DEFAULT);
}
