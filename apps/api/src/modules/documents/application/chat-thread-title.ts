export const DEFAULT_CHAT_THREAD_TITLE = 'Neuer Chat';

export function chatThreadTitleFromMessage(message: string): string {
  const normalized = message.trim().replace(/\s+/g, ' ');
  if (!normalized) {
    return DEFAULT_CHAT_THREAD_TITLE;
  }
  if (normalized.length <= 56) {
    return normalized;
  }
  return `${normalized.slice(0, 53)}…`;
}
