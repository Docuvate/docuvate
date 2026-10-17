// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

const MINUTE_MS = 60_000;
const HOUR_MS = 3_600_000;
const DAY_MS = 86_400_000;

/** Customer-facing relative time for document lists (Start S1). */
export function formatDocumentRelativeTime(iso: string, locale: string, nowMs = Date.now()): string {
  const parsed = Date.parse(iso);
  if (Number.isNaN(parsed)) {
    return iso;
  }
  const diffMs = nowMs - parsed;
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

  if (diffMs < HOUR_MS) {
    const minutes = Math.max(1, Math.round(diffMs / MINUTE_MS));
    return rtf.format(-minutes, 'minute');
  }
  if (diffMs < DAY_MS) {
    const hours = Math.max(1, Math.round(diffMs / HOUR_MS));
    return rtf.format(-hours, 'hour');
  }
  const days = Math.max(1, Math.round(diffMs / DAY_MS));
  if (days === 1) {
    return locale.startsWith('de') ? 'gestern' : 'yesterday';
  }
  if (days === 0) {
    return locale.startsWith('de') ? 'heute' : 'today';
  }
  return rtf.format(-days, 'day');
}
