// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
export const DEFAULT_CHAT_THREAD_TITLE = 'Neuer Chat';

export function resolveChatThreadTitle(title?: string): string {
  const trimmed = title?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : DEFAULT_CHAT_THREAD_TITLE;
}

/** Bench / seed threads keep this title until the user sends a real question. */
export const PLACEHOLDER_CHAT_THREAD_TITLES = new Set([
  DEFAULT_CHAT_THREAD_TITLE,
  'bench cited chat',
  'E2E cited chat',
]);

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
