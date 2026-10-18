// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import {
  RAG_FUSION_GATE_MIN_DEFAULT,
  RAG_RERANKER_GATE_MIN_DEFAULT,
} from './cited-chat-constants.js';
import { passesFusionGate, passesRerankerGate } from './verify-citation-quote.js';

/**
 * Sigmoid scores from bench/rag_gate_calibrate.py (BAAI/bge-reranker-v2-m3-int8, simulated retrieval sets).
 * Gate default 0.21 sits above max off-topic (0.038, excl. known semantic false-positive) with margin below weakest in-domain pass (0.231).
 */
export const RAG_GATE_CALIBRATION_FIXTURE = [
  { id: 'de-invoice-total', score: 0.9943, expectPass: true },
  { id: 'de-rent-due', score: 0.974, expectPass: true },
  { id: 'de-notice-period', score: 0.9383, expectPass: true },
  { id: 'de-tax-fee', score: 0.2305, expectPass: true },
  { id: 'de-iban', score: 0.0004, expectPass: false },
  { id: 'de-rent-wording', score: 0.595, expectPass: true },
  { id: 'de-invoice-vendor', score: 0.9945, expectPass: true },
  { id: 'de-notice-end', score: 0.999, expectPass: true },
  { id: 'de-tax-city', score: 0.9309, expectPass: true },
  { id: 'de-invoice-currency', score: 0.3917, expectPass: true },
  { id: 'de-off-topic-weather', score: 0.0, expectPass: false },
  { id: 'en-off-topic', score: 0.0, expectPass: false },
  { id: 'de-off-topic-sports', score: 0.0379, expectPass: false },
  { id: 'en-off-topic-stocks', score: 0.0001, expectPass: false },
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
