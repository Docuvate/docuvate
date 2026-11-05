// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
/** Locale-aware date for customer-facing tables (no time). */
export function formatCustomerDate(iso: string, locale: string): string {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) {
    return iso;
  }
  return parsed.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Locale-aware calendar date for a `YYYY-MM-DD` value (document dates). Formatted in UTC so
 * the day never shifts with the viewer's time zone. Returns the input unchanged if it is not
 * a calendar date.
 */
export function formatCalendarDate(ymd: string, locale: string): string {
  const [yearPart, monthPart, dayPart, ...rest] = ymd.split('-');
  const year = Number(yearPart);
  const month = Number(monthPart);
  const day = Number(dayPart);
  if (
    rest.length > 0 ||
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    !Number.isInteger(day)
  ) {
    return ymd;
  }
  const parsed = new Date(Date.UTC(year, month - 1, day));
  if (Number.isNaN(parsed.getTime()) || parsed.getUTCDate() !== day) {
    return ymd;
  }
  return parsed.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
}
