// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { ErrorCode } from './error-codes.js';

export const PROBLEM_DETAILS_MEDIA_TYPE = 'application/problem+json';

/** Default RFC 9457 type URI when no extension type is registered. */
export const PROBLEM_TYPE_ABOUT_BLANK = 'about:blank';

/** RFC 9457 problem response envelope returned by the Docuvate API. */
export interface ProblemDetails {
  type: string;
  title: string;
  status: number;
  code: ErrorCode | string;
  detail: string;
  requestId: string;
}

/** Pre-RFC9457 envelope; prefer {@link ProblemDetails} for new integrations. */
export interface ApiErrorEnvelope {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}
