// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
export const DEFAULT_CHAT_THREAD_TITLE = 'Neuer Chat';

export function resolveChatThreadTitle(title?: string): string {
  const trimmed = title?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : DEFAULT_CHAT_THREAD_TITLE;
}

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
