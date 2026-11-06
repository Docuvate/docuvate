// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it } from 'vitest';

import {
  documentStageState,
  fieldsNeedingReview,
  nextDocumentAction,
  PIPELINE_HREFS,
  PIPELINE_STAGES,
  pipelineOverview,
  pipelineStepStatus,
  pipelineTasks,
  stageOfState,
} from './documentPipeline';

const inbox = { isInbox: true };
const label = { isInbox: false };

describe('documentStageState', () => {
  it('maps processing statuses', () => {
    expect(documentStageState({ status: 'uploaded', tags: [] })).toBe('intake');
    expect(documentStageState({ status: 'queued', tags: [inbox] })).toBe('intake');
    expect(documentStageState({ status: 'extracting', tags: [inbox] })).toBe('structuring');
    expect(documentStageState({ status: 'failed', tags: [label] })).toBe('failed');
  });

  it('keeps ready documents in review while they sit in the inbox, lack labels or have suggestions', () => {
    expect(documentStageState({ status: 'ready', tags: [inbox] })).toBe('review');
    expect(documentStageState({ status: 'ready', tags: [] })).toBe('review');
    expect(documentStageState({ status: 'ready', tags: [label], tagSuggestions: [{}] })).toBe(
      'review'
    );
  });

  it('marks labelled ready documents as structured', () => {
    expect(documentStageState({ status: 'ready', tags: [label] })).toBe('structured');
    expect(documentStageState({ status: 'ready', tags: [label], tagSuggestions: [] })).toBe(
      'structured'
    );
  });
});

describe('stage mapping and next action', () => {
  it('maps states to stages and actions', () => {
    expect(stageOfState('intake')).toBe('upload');
    expect(stageOfState('structuring')).toBe('structure');
    expect(stageOfState('failed')).toBe('structure');
    expect(stageOfState('review')).toBe('review');
    expect(stageOfState('structured')).toBe('record');
    expect(nextDocumentAction('intake')).toBe('wait');
    expect(nextDocumentAction('structuring')).toBe('wait');
    expect(nextDocumentAction('failed')).toBe('retry');
    expect(nextDocumentAction('review')).toBe('review');
    expect(nextDocumentAction('structured')).toBe('none');
  });

  it('derives stepper statuses', () => {
    expect(PIPELINE_STAGES.map((s) => pipelineStepStatus(s, 'review'))).toEqual([
      'done',
      'done',
      'current',
      'todo',
    ]);
    expect(PIPELINE_STAGES.map((s) => pipelineStepStatus(s, 'failed'))).toEqual([
      'done',
      'error',
      'todo',
      'todo',
    ]);
    expect(PIPELINE_STAGES.map((s) => pipelineStepStatus(s, 'intake'))).toEqual([
      'current',
      'todo',
      'todo',
      'todo',
    ]);
    expect(PIPELINE_STAGES.map((s) => pipelineStepStatus(s, 'structured'))).toEqual([
      'done',
      'done',
      'done',
      'done',
    ]);
  });
});

describe('fieldsNeedingReview', () => {
  it('counts unconfirmed low-confidence fields only', () => {
    expect(
      fieldsNeedingReview([
        { confidence: 0.97 },
        { confidence: 0.64 },
        { confidence: 0.5, userConfirmed: true },
        {},
      ])
    ).toBe(1);
  });
});

describe('pipelineOverview / pipelineTasks', () => {
  const statistics = {
    documentsTotal: 12,
    unlabeledCount: 1,
    byStatus: { uploaded: 1, queued: 1, extracting: 1, ready: 8, failed: 1 },
  };

  it('aggregates statistics into stage counts', () => {
    expect(pipelineOverview(statistics, 3)).toEqual({
      waiting: 2,
      structuring: 1,
      failed: 1,
      review: 3,
      unlabeled: 1,
      ready: 8,
      total: 12,
    });
  });

  it('orders blocking tasks first and drops empty ones', () => {
    const tasks = pipelineTasks(pipelineOverview({ ...statistics, unlabeledCount: 0 }, 3));
    expect(tasks.map((task) => task.kind)).toEqual(['review', 'failed', 'structuring', 'waiting']);
    expect(tasks[0]?.href).toBe('/review');
    expect(tasks[1]?.href).toBe(PIPELINE_HREFS.failed);
    expect(PIPELINE_HREFS.failed).toBe('/documents?filter=status%3Aerror');
  });
});
