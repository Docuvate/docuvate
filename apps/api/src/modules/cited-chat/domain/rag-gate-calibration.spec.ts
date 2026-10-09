import { describe, expect, it } from 'vitest';
import {
  calibrationThresholds,
  fusionGatePasses,
  RAG_GATE_CALIBRATION_FIXTURE,
  rerankerGatePasses,
} from './rag-gate-calibration.fixture.js';

describe('rag gate calibration fixture', () => {
  it('uses recalibrated default thresholds', () => {
    expect(calibrationThresholds()).toEqual({ reranker: 0.28, fusion: 0.02 });
  });

  it('matches recorded DE+EN fixture expectations', () => {
    for (const row of RAG_GATE_CALIBRATION_FIXTURE) {
      const pass =
        row.id.startsWith('fusion')
          ? fusionGatePasses(row.score)
          : rerankerGatePasses(row.score);
      expect(pass).toBe(row.expectPass);
    }
  });
});
