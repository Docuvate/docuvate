// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { isRecord } from './apiErrors';

export function readCustomEventDetail(event: Event): unknown {
  return event instanceof CustomEvent ? event.detail : undefined;
}

export function readNotifySavedDetail(event: Event): { message?: string } | undefined {
  const detail = readCustomEventDetail(event);
  if (!isRecord(detail)) {
    return undefined;
  }
  const message = detail.message;
  if (message === undefined) {
    return {};
  }
  return typeof message === 'string' ? { message } : undefined;
}

export function readNotifySaveErrorDetail(
  event: Event
): { message: string; retry?: () => void } | undefined {
  const detail = readCustomEventDetail(event);
  if (!isRecord(detail) || typeof detail.message !== 'string') {
    return undefined;
  }
  const retry = detail.retry;
  return {
    message: detail.message,
    retry: isVoidCallback(retry) ? retry : undefined,
  };
}

function isVoidCallback(value: unknown): value is () => void {
  return typeof value === 'function';
}
