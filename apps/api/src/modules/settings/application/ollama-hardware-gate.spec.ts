// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it } from 'vitest';

import { ollamaAvailableForHardware, ollamaModelLikelyNeedsGpu } from './ollama-hardware-gate.js';

describe('ollamaModelLikelyNeedsGpu', () => {
  it('treats small defaults as CPU-safe', () => {
    expect(ollamaModelLikelyNeedsGpu('llama3.2')).toBe(false);
    expect(ollamaModelLikelyNeedsGpu('qwen2.5:3b')).toBe(false);
    expect(ollamaModelLikelyNeedsGpu('qwen3:4b')).toBe(false);
    expect(ollamaModelLikelyNeedsGpu('qwen2.5:7b')).toBe(false);
    expect(ollamaModelLikelyNeedsGpu('gemma3:4b')).toBe(false);
  });

  it('flags large tags', () => {
    expect(ollamaModelLikelyNeedsGpu('llama3.1:70b')).toBe(true);
    expect(ollamaModelLikelyNeedsGpu('mixtral')).toBe(true);
  });
});

describe('ollamaAvailableForHardware', () => {
  it('allows small models without GPU', () => {
    expect(
      ollamaAvailableForHardware('llama3.2', {
        capabilities: { largeLocalLlm: false },
      })
    ).toBe(true);
  });

  it('blocks large models when VRAM gate is off', () => {
    expect(
      ollamaAvailableForHardware('llama3.1:70b', {
        capabilities: { largeLocalLlm: false },
      })
    ).toBe(false);
  });
});
