import { describe, expect, it } from 'vitest';
import { buildKlmTaskResult, predictKlmTimeMs } from './klm.js';

describe('predictKlmTimeMs', () => {
  it('sums operator times', () => {
    expect(predictKlmTimeMs(['M', 'P', 'B'])).toBe(1350 + 1100 + 100);
  });
});

describe('buildKlmTaskResult', () => {
  it('counts clicks and keystrokes', () => {
    const r = buildKlmTaskResult('t', 'T', ['M', 'H', 'K', 'K', 'P', 'B']);
    expect(r.clicks).toBe(1);
    expect(r.keystrokes).toBe(2);
    expect(r.pointerKeyboardSwitches).toBeGreaterThanOrEqual(1);
  });
});
