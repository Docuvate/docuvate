import { describe, expect, it } from 'vitest';
import { isChatGenerationInProgress } from './chatGenerationActive';

describe('isChatGenerationInProgress', () => {
  it('ignores stale in-memory messages while loading a new thread', () => {
    const pending = {
      id: 'a1',
      role: 'assistant' as const,
      content: '',
      createdAt: new Date().toISOString(),
      generationStatus: 'pending' as const,
    };
    expect(isChatGenerationInProgress([pending], true)).toBe(false);
    expect(isChatGenerationInProgress([pending], false)).toBe(true);
  });
});
