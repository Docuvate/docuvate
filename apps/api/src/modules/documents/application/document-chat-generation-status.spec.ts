import { describe, expect, it } from 'vitest';
import {
  isActiveGenerationStatus,
  isTerminalGenerationStatus,
  normalizeLegacyAssistantStatus,
} from './document-chat-generation-status.js';

describe('document-chat-generation-status', () => {
  it('treats done and failed as terminal', () => {
    expect(isTerminalGenerationStatus('done')).toBe(true);
    expect(isTerminalGenerationStatus('failed')).toBe(true);
    expect(isTerminalGenerationStatus('pending')).toBe(false);
    expect(isTerminalGenerationStatus('streaming')).toBe(false);
  });

  it('treats pending and streaming as active', () => {
    expect(isActiveGenerationStatus('pending')).toBe(true);
    expect(isActiveGenerationStatus('streaming')).toBe(true);
    expect(isActiveGenerationStatus('done')).toBe(false);
  });

  it('normalizes assistant rows without status to done', () => {
    expect(normalizeLegacyAssistantStatus(null)).toBe('done');
    expect(normalizeLegacyAssistantStatus(undefined)).toBe('done');
    expect(normalizeLegacyAssistantStatus('streaming')).toBe('streaming');
  });
});
