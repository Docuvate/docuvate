// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { DocumentDto } from '@docuvate/contracts';

import { isExtractionPending } from '../../lib/documentExtractionState';
import { documentStageState } from '../../lib/documentPipeline';
import { structuringAspects } from '../../lib/structuringAspects';
import { ExtractionProgressBar } from '../documents';
import { StagePill, StructuringAspectStrip } from '../pipeline';
import { LayoutMissingBadge } from './LayoutMissingBadge';
import { showLayoutMissingBadge } from './layoutMissingBadgeVisibility';

interface LibraryDocumentStatusWithLayoutProps {
  doc: DocumentDto;
  pendingReview: boolean;
  pendingReviewLabel: string;
  pendingReviewTooltip?: string;
  requeueBusy: boolean;
  onRequeue?: () => void;
  failureTitle?: string;
  wrapReadyInSpan?: boolean;
  compact?: boolean;
}

export function LibraryDocumentStatusWithLayout({
  doc,
  pendingReview,
  pendingReviewLabel,
  pendingReviewTooltip,
  requeueBusy,
  onRequeue,
  failureTitle,
  wrapReadyInSpan = false,
  compact = true,
}: LibraryDocumentStatusWithLayoutProps) {
  const layoutBadge = showLayoutMissingBadge(doc) ? (
    <LayoutMissingBadge compact={compact} requeueBusy={requeueBusy} onRequeue={onRequeue} />
  ) : null;

  if (pendingReview) {
    return (
      <span className="badge badge-warn" title={pendingReviewTooltip}>
        {pendingReviewLabel}
      </span>
    );
  }

  if (isExtractionPending(doc.status)) {
    return <ExtractionProgressBar doc={doc} compact={compact} className="library-row-progress" />;
  }

  const aspects = structuringAspects(doc, null).filter((status) => status.state !== 'unknown');
  const badge = (
    <>
      <StagePill state={documentStageState(doc)} status={doc.status} />
      <StructuringAspectStrip statuses={aspects} compact className="library-row-aspects" />
    </>
  );
  if (wrapReadyInSpan) {
    return (
      <>
        <span title={failureTitle}>{badge}</span>
        {layoutBadge}
      </>
    );
  }

  return (
    <>
      {badge}
      {layoutBadge}
    </>
  );
}
