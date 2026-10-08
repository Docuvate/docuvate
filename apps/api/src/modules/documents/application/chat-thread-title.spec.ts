import { describe, expect, it } from 'vitest';
import { chatThreadTitleFromMessage, DEFAULT_CHAT_THREAD_TITLE } from './chat-thread-title.js';

describe('chatThreadTitleFromMessage', () => {
  it('returns default for blank input', () => {
    expect(chatThreadTitleFromMessage('   ')).toBe(DEFAULT_CHAT_THREAD_TITLE);
  });

  it('truncates long messages', () => {
    const long = 'a'.repeat(80);
    expect(chatThreadTitleFromMessage(long)).toHaveLength(54);
    expect(chatThreadTitleFromMessage(long).endsWith('…')).toBe(true);
  });
});
