// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { DocumentListQuery } from '@docuvate/contracts';

import type { PipelineOverview } from './documentPipeline';

/** Library shortcuts onto the existing list filters, one per pipeline step. */
export const LIBRARY_STAGE_TABS = [
  'all',
  'review',
  'unlabeled',
  'structuring',
  'failed',
  'ready',
] as const;
export type LibraryStageTab = (typeof LIBRARY_STAGE_TABS)[number];

type StageFilterPatch = Pick<DocumentListQuery, 'inbox' | 'withoutNonInboxLabel' | 'status'>;

const CLEARED: StageFilterPatch = {
  inbox: undefined,
  withoutNonInboxLabel: undefined,
  status: undefined,
};

export function libraryStageTabPatch(tab: LibraryStageTab): StageFilterPatch {
  switch (tab) {
    case 'all':
      return CLEARED;
    case 'review':
      return { ...CLEARED, inbox: true };
    case 'unlabeled':
      return { ...CLEARED, withoutNonInboxLabel: true };
    case 'structuring':
      return { ...CLEARED, status: 'extracting' };
    case 'failed':
      return { ...CLEARED, status: 'failed' };
    case 'ready':
      return { ...CLEARED, status: 'ready' };
  }
}

/**
 * Which tab matches the current filters. Combinations the tabs cannot express (e.g. inbox plus a
 * status, or the queued status) select no tab rather than pretending to be "all".
 */
export function activeLibraryStageTab(
  filters: Pick<DocumentListQuery, 'inbox' | 'withoutNonInboxLabel' | 'status'>
): LibraryStageTab | null {
  const inbox = filters.inbox === true;
  const unlabeled = filters.withoutNonInboxLabel === true;
  const status = filters.status;
  if (inbox && !unlabeled && !status) return 'review';
  if (unlabeled && !inbox && !status) return 'unlabeled';
  if (inbox || unlabeled) return null;
  switch (status) {
    case undefined:
      return 'all';
    case 'extracting':
      return 'structuring';
    case 'failed':
      return 'failed';
    case 'ready':
      return 'ready';
    case 'uploaded':
    case 'queued':
      return null;
  }
}

/** Count badge for a tab; `null` where statistics have no exact number for that filter. */
export function libraryStageTabCount(
  tab: LibraryStageTab,
  overview: PipelineOverview | null
): number | null {
  if (!overview) return null;
  switch (tab) {
    case 'all':
      return overview.total;
    case 'review':
      return null;
    case 'unlabeled':
      return overview.unlabeled;
    case 'structuring':
      return overview.structuring;
    case 'failed':
      return overview.failed;
    case 'ready':
      return overview.ready;
  }
}
