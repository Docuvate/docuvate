// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it } from 'vitest';
import { ValidationError } from '../../domain/errors.js';
import {
  mapWorkerLayoutCompareHttpError,
  parseWorkerLayoutCompareErrorCode,
} from './layout-compare-worker.errors.js';

describe('layout-compare-worker.errors', () => {
  it('parses FastAPI detail errorCode', () => {
    expect(
      parseWorkerLayoutCompareErrorCode({ detail: { errorCode: 'compile_failed' } })
    ).toBe('compile_failed');
  });

  it('maps compile_failed to an i18n validation message without HTTP codes', () => {
    const err = mapWorkerLayoutCompareHttpError(422, 'compile_failed');
    expect(err).toBeInstanceOf(ValidationError);
    expect(err.message).toBe('documents.layoutCompareErrors.compileFailed');
    expect(err.message).not.toMatch(/\d{3}/);
  });
});
