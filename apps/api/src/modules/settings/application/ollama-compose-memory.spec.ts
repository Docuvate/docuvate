import { describe, expect, it } from 'vitest';
import {
  modelFitsOllamaMemLimit,
  modelMinGiB,
  parseMemLimitToGiB,
} from './ollama-compose-memory.js';

describe('ollama-compose-memory', () => {
  it('parses gigabyte limits', () => {
    expect(parseMemLimitToGiB('3g')).toBe(3);
    expect(parseMemLimitToGiB('5g')).toBe(5);
  });

  it('qwen3:4b needs 5g container limit', () => {
    expect(modelMinGiB('qwen3:4b')).toBe(5);
    expect(modelFitsOllamaMemLimit('qwen3:4b', 3)).toBe(false);
    expect(modelFitsOllamaMemLimit('qwen3:4b', 5)).toBe(true);
  });

  it('qwen2.5:3b fits 3g limit', () => {
    expect(modelFitsOllamaMemLimit('qwen2.5:3b', 3)).toBe(true);
  });
});
