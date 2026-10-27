// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { afterEach, describe, expect, it } from 'vitest';

import { workerExtractTimeoutMs, workerExtractTimeoutSeconds } from './worker-fetch.js';

describe('workerExtractTimeoutMs', () => {
  const previousMs = process.env['WORKER_EXTRACT_TIMEOUT_MS'];
  const previousSeconds = process.env['DOCUVATE_EXTRACT_TIMEOUT_SECONDS'];

  afterEach(() => {
    if (previousMs === undefined) {
      delete process.env['WORKER_EXTRACT_TIMEOUT_MS'];
    } else {
      process.env['WORKER_EXTRACT_TIMEOUT_MS'] = previousMs;
    }
    if (previousSeconds === undefined) {
      delete process.env['DOCUVATE_EXTRACT_TIMEOUT_SECONDS'];
    } else {
      process.env['DOCUVATE_EXTRACT_TIMEOUT_SECONDS'] = previousSeconds;
    }
  });

  it('defaults to the worker subprocess deadline of 900s', () => {
    delete process.env['WORKER_EXTRACT_TIMEOUT_MS'];
    delete process.env['DOCUVATE_EXTRACT_TIMEOUT_SECONDS'];
    expect(workerExtractTimeoutMs()).toBe(900_000);
    expect(workerExtractTimeoutSeconds()).toBe(900);
  });

  it('prefers WORKER_EXTRACT_TIMEOUT_MS', () => {
    process.env['WORKER_EXTRACT_TIMEOUT_MS'] = '240000';
    process.env['DOCUVATE_EXTRACT_TIMEOUT_SECONDS'] = '12';
    expect(workerExtractTimeoutMs()).toBe(240_000);
    expect(workerExtractTimeoutSeconds()).toBe(240);
  });

  it('falls back to DOCUVATE_EXTRACT_TIMEOUT_SECONDS', () => {
    delete process.env['WORKER_EXTRACT_TIMEOUT_MS'];
    process.env['DOCUVATE_EXTRACT_TIMEOUT_SECONDS'] = '120';
    expect(workerExtractTimeoutMs()).toBe(120_000);
    expect(workerExtractTimeoutSeconds()).toBe(120);
  });
});
