// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it } from 'vitest';

import {
  type ExtractionReconcileDocument,
  type ExtractionReconcileJob,
  planExtractionReconcile,
} from './plan-extraction-reconcile.js';

const NOW = 1_800_000_000_000;
const DEADLINE_MS = 900_000;

describe('planExtractionReconcile', () => {
  it('leaves a long queued backlog untouched', () => {
    const docs: ExtractionReconcileDocument[] = [
      { id: 'q1', userId: 'u1', status: 'queued' },
      { id: 'q2', userId: 'u1', status: 'queued' },
    ];
    const jobs = new Map<string, ExtractionReconcileJob>([
      ['q1', { live: true, startedAtMs: null }],
      ['q2', { live: true, startedAtMs: null }],
    ]);

    expect(planExtractionReconcile(docs, jobs, NOW, DEADLINE_MS)).toEqual({
      failIds: [],
      enqueue: [],
    });
  });

  it('re-enqueues orphaned queued documents', () => {
    const docs: ExtractionReconcileDocument[] = [
      { id: 'orphan', userId: 'u2', status: 'queued' },
    ];
    const jobs = new Map<string, ExtractionReconcileJob>();

    expect(planExtractionReconcile(docs, jobs, NOW, DEADLINE_MS)).toEqual({
      failIds: [],
      enqueue: [{ id: 'orphan', userId: 'u2' }],
    });
  });

  it('fails stuck extracting past the lease deadline with no live job', () => {
    const docs: ExtractionReconcileDocument[] = [
      { id: 'stuck', userId: 'u3', status: 'extracting' },
    ];
    const jobs = new Map<string, ExtractionReconcileJob>([
      ['stuck', { live: false, startedAtMs: NOW - DEADLINE_MS - 1 }],
    ]);

    expect(planExtractionReconcile(docs, jobs, NOW, DEADLINE_MS)).toEqual({
      failIds: ['stuck'],
      enqueue: [],
    });
  });

  it('leaves an extracting document with a live job untouched', () => {
    const docs: ExtractionReconcileDocument[] = [
      { id: 'active', userId: 'u4', status: 'extracting' },
    ];
    const jobs = new Map<string, ExtractionReconcileJob>([
      ['active', { live: true, startedAtMs: NOW - DEADLINE_MS * 4 }],
    ]);

    expect(planExtractionReconcile(docs, jobs, NOW, DEADLINE_MS)).toEqual({
      failIds: [],
      enqueue: [],
    });
  });

  it('does not fail extracting when the lease start is unknown', () => {
    const docs: ExtractionReconcileDocument[] = [
      { id: 'unknown', userId: 'u5', status: 'extracting' },
    ];
    const jobs = new Map<string, ExtractionReconcileJob>();

    expect(planExtractionReconcile(docs, jobs, NOW, DEADLINE_MS)).toEqual({
      failIds: [],
      enqueue: [],
    });
  });
});
