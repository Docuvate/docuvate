// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { TFunction } from 'i18next';

export function formatAdminLastLogin(
  t: TFunction,
  iso: string | null | undefined,
  locale: string
): string {
  if (!iso) {
    return t('admin.usersLastLoginNever');
  }
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return t('admin.usersLastLoginNever');
  }
  const now = Date.now();
  const diffMs = now - date.getTime();
  if (diffMs < 0) {
    return t('admin.usersLastLoginJustNow');
  }
  const diffMinutes = Math.floor(diffMs / 60_000);
  if (diffMinutes < 1) {
    return t('admin.usersLastLoginJustNow');
  }
  if (diffMinutes < 60) {
    return t('admin.usersLastLoginMinutes', { count: diffMinutes });
  }
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return t('admin.usersLastLoginHours', { count: diffHours });
  }
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) {
    return t('admin.usersLastLoginYesterday');
  }
  if (diffDays < 7) {
    return t('admin.usersLastLoginDays', { count: diffDays });
  }
  return date.toLocaleDateString(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}
