// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it } from 'vitest';

import { shouldAttemptCitedLlm } from './rag-llm-eligibility.js';

describe('shouldAttemptCitedLlm', () => {
  it('allows soft-band scores for LLM self-check', () => {
    expect(shouldAttemptCitedLlm({ bestScore: 0.1, rerankerUsed: true })).toBe(true);
  });

  it('rejects very weak off-topic scores', () => {
    expect(shouldAttemptCitedLlm({ bestScore: 0.01, rerankerUsed: true })).toBe(false);
  });
});
