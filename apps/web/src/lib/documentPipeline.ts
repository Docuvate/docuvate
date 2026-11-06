// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type {
  DashboardStatisticsDto,
  DocumentDto,
  DocumentStatus,
  ExtractedField,
} from '@docuvate/contracts';

import { routes } from './routes';

/**
 * The structuring pipeline every document moves through:
 * Upload → Structure (OCR + field extraction) → Review (labels / fields) → Record.
 *
 * A record is the durable, structured state of a document; it stays refinable. Export is an
 * action on records, not a stage, so the model leaves room for versioned records later.
 *
 * Pure derivation from existing API data (status, tags, suggestions, statistics); no extra
 * backend state. Used by the dashboard hub, the library stage tabs and the viewer stepper so all
 * three screens describe a document's progress the same way.
 */
export const PIPELINE_STAGES = ['upload', 'structure', 'review', 'record'] as const;
export type PipelineStage = (typeof PIPELINE_STAGES)[number];

/** Where a single document currently is. */
export type DocumentStageState = 'intake' | 'structuring' | 'failed' | 'review' | 'structured';

/** What the user should do next with a document. */
type DocumentNextAction = 'wait' | 'retry' | 'review' | 'none';

type PipelineStepStatus = 'done' | 'current' | 'error' | 'todo';

/** Fields below this confidence need a human look (matches the review queue "≥ 90 %" batch accept). */
const REVIEW_CONFIDENCE_MIN = 0.9;

interface PipelineDocument {
  status: DocumentStatus;
  tags: readonly Pick<DocumentDto['tags'][number], 'isInbox'>[];
  tagSuggestions?: readonly unknown[];
}

function hasInboxTag(doc: PipelineDocument): boolean {
  return doc.tags.some((tag) => tag.isInbox);
}

function hasStructuringLabel(doc: PipelineDocument): boolean {
  return doc.tags.some((tag) => !tag.isInbox);
}

export function documentStageState(doc: PipelineDocument): DocumentStageState {
  switch (doc.status) {
    case 'failed':
      return 'failed';
    case 'uploaded':
    case 'queued':
      return 'intake';
    case 'extracting':
      return 'structuring';
    case 'ready': {
      const openSuggestions = (doc.tagSuggestions?.length ?? 0) > 0;
      if (hasInboxTag(doc) || openSuggestions || !hasStructuringLabel(doc)) {
        return 'review';
      }
      return 'structured';
    }
  }
}

export function stageOfState(state: DocumentStageState): PipelineStage {
  switch (state) {
    case 'intake':
      return 'upload';
    case 'structuring':
    case 'failed':
      return 'structure';
    case 'review':
      return 'review';
    case 'structured':
      return 'record';
  }
}

export function nextDocumentAction(state: DocumentStageState): DocumentNextAction {
  switch (state) {
    case 'intake':
    case 'structuring':
      return 'wait';
    case 'failed':
      return 'retry';
    case 'review':
      return 'review';
    case 'structured':
      return 'none';
  }
}

/** Step status for one stage of the stepper, given where the document is. */
export function pipelineStepStatus(
  stage: PipelineStage,
  state: DocumentStageState
): PipelineStepStatus {
  const current = PIPELINE_STAGES.indexOf(stageOfState(state));
  const index = PIPELINE_STAGES.indexOf(stage);
  if (index < current) return 'done';
  if (index > current) return 'todo';
  if (state === 'failed') return 'error';
  // A structured document is a record: every stage is done, it simply stays refinable.
  if (state === 'structured') return 'done';
  return 'current';
}

/** Recognized fields that still need a decision (low confidence and not confirmed by a person). */
export function fieldsNeedingReview(
  fields: readonly Pick<ExtractedField, 'confidence' | 'userConfirmed'>[]
): number {
  return fields.filter(
    (field) =>
      field.userConfirmed !== true &&
      field.confidence != null &&
      field.confidence < REVIEW_CONFIDENCE_MIN
  ).length;
}

function libraryFilterHref(token: string): string {
  return `${routes.documents}?filter=${encodeURIComponent(token)}`;
}

export const PIPELINE_HREFS = {
  queued: libraryFilterHref('status:queued'),
  structuring: libraryFilterHref('status:extracting'),
  failed: libraryFilterHref('status:error'),
  inbox: libraryFilterHref('in:inbox'),
  unlabeled: libraryFilterHref('label:none'),
  ready: libraryFilterHref('status:ready'),
  review: routes.reviewQueue,
} as const;

export interface PipelineOverview {
  /** Uploaded or waiting in the extraction queue. */
  waiting: number;
  /** Currently being read (OCR / layout / fields). */
  structuring: number;
  /** Extraction failed and needs a retry. */
  failed: number;
  /** Documents with open label/field suggestions (review queue). */
  review: number;
  /** Ready documents without any structuring label. */
  unlabeled: number;
  /** Ready documents: field values can be exported. */
  ready: number;
  total: number;
}

export function pipelineOverview(
  statistics: Pick<DashboardStatisticsDto, 'byStatus' | 'documentsTotal' | 'unlabeledCount'>,
  reviewPendingCount: number
): PipelineOverview {
  const { byStatus } = statistics;
  return {
    waiting: byStatus.uploaded + byStatus.queued,
    structuring: byStatus.extracting,
    failed: byStatus.failed,
    review: reviewPendingCount,
    unlabeled: statistics.unlabeledCount,
    ready: byStatus.ready,
    total: statistics.documentsTotal,
  };
}

export type PipelineTaskKind = 'review' | 'failed' | 'unlabeled' | 'structuring' | 'waiting';

export interface PipelineTask {
  kind: PipelineTaskKind;
  count: number;
  href: string;
}

/** Ordered "next steps" for the dashboard: blocking work first, passive progress last. */
export function pipelineTasks(overview: PipelineOverview): PipelineTask[] {
  const tasks: PipelineTask[] = [
    { kind: 'review', count: overview.review, href: PIPELINE_HREFS.review },
    { kind: 'failed', count: overview.failed, href: PIPELINE_HREFS.failed },
    { kind: 'unlabeled', count: overview.unlabeled, href: PIPELINE_HREFS.unlabeled },
    { kind: 'structuring', count: overview.structuring, href: PIPELINE_HREFS.structuring },
    { kind: 'waiting', count: overview.waiting, href: PIPELINE_HREFS.queued },
  ];
  return tasks.filter((task) => task.count > 0);
}
