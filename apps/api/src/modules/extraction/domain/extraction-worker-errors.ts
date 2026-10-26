// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

import { isRecord, parseString } from '../../../shared/infrastructure/database/row-parse.js';

export const WORKER_EXTRACT_DEADLINE_ERROR_TYPE = 'ExtractDeadlineExceeded';
export const WORKER_EXTRACT_CLIENT_DISCONNECTED_ERROR_TYPE = 'ExtractClientDisconnected';

export class WorkerExtractDeadlineError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WorkerExtractDeadlineError';
  }
}

export function parseWorkerExtractErrorBody(raw: unknown): {
  errorCode: string;
  errorType: string;
  reason: string;
} | null {
  if (!isRecord(raw)) {
    return null;
  }
  const detail = isRecord(raw.detail) ? raw.detail : raw;
  const errorCode = parseString(detail.errorCode).trim();
  const errorType = parseString(detail.errorType).trim();
  const reason = parseString(detail.reason).trim();
  if (!errorType && !errorCode) {
    return null;
  }
  return { errorCode, errorType, reason };
}

export function isWorkerExtractDeadlineResponse(
  status: number,
  body: { errorCode: string; errorType: string; reason: string } | null
): boolean {
  if (status !== 503 || !body) {
    return false;
  }
  return (
    body.errorType === WORKER_EXTRACT_DEADLINE_ERROR_TYPE ||
    body.errorCode === 'extract_deadline_exceeded' ||
    body.errorCode === 'extract_client_disconnected'
  );
}

export function workerExtractDeadlineFailureMessage(body: {
  errorType: string;
  reason: string;
}): string {
  return `Worker extraction deadline: 503 ${body.errorType} ${body.reason}`;
}

export function isWorkerExtractDeadlineFailureMessage(message: string): boolean {
  return message.includes('Worker extraction deadline: 503');
}
