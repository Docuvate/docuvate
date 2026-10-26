// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { createHash } from 'node:crypto';

/** Collapse whitespace and lowercase for stable exact-text duplicate matching. */
export function normalizeExtractedTextForHash(text: string): string {
  return text.trim().toLowerCase().replace(/\s+/g, ' ');
}

export function hashNormalizedExtractedText(text: string | null | undefined): string | null {
  if (text == null) return null;
  const normalized = normalizeExtractedTextForHash(text);
  if (normalized.length === 0) return null;
  return createHash('sha256').update(normalized, 'utf8').digest('hex');
}
