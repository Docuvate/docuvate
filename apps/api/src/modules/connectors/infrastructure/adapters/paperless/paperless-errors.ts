// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { ValidationError } from '../../../../../shared/domain/errors.js';
import { PaperlessUrlValidationError } from './paperless-url-security.js';

export function mapPaperlessClientError(err: unknown): ValidationError {
  if (err instanceof PaperlessUrlValidationError) {
    return new ValidationError(err.messageKey);
  }
  const message = err instanceof Error ? err.message : String(err);
  if (message === 'PAPERLESS_UNAUTHORIZED') {
    return new ValidationError('connectors.paperless.errors.unauthorized');
  }
  if (message === 'PAPERLESS_NOT_FOUND') {
    return new ValidationError('connectors.paperless.errors.notFound');
  }
  if (message === 'PAPERLESS_VERSION_UNSUPPORTED') {
    return new ValidationError('connectors.paperless.errors.versionUnsupported');
  }
  if (message === 'PAPERLESS_TIMEOUT') {
    return new ValidationError('connectors.paperless.errors.timeout');
  }
  if (message === 'PAPERLESS_UNREACHABLE' || message === 'PAPERLESS_LIST_FAILED') {
    return new ValidationError('connectors.paperless.errors.unreachable');
  }
  return new ValidationError('connectors.paperless.errors.unreachable');
}
