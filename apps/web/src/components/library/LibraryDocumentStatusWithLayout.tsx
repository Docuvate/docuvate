// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { DocumentDto } from '@docuvate/contracts';

import { isExtractionPending } from '../../lib/documentExtractionState';
import { documentStageState } from '../../lib/documentPipeline';
import { ExtractionProgressBar } from '../documents';
import { StagePill } from '../pipeline';

interface LibraryDocumentStatusWithLayoutProps {
  doc: DocumentDto;
  pendingReview: boolean;
  pendingReviewLabel: string;
  pendingReviewTooltip?: string;
  failureTitle?: string;
  wrapReadyInSpan?: boolean;
  compact?: boolean;
}

export function LibraryDocumentStatusWithLayout({
  doc,
  pendingReview,
  pendingReviewLabel,
  pendingReviewTooltip,
  failureTitle,
  wrapReadyInSpan = false,
  compact = true,
}: LibraryDocumentStatusWithLayoutProps) {
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

  const badge = <StagePill state={documentStageState(doc)} status={doc.status} />;
  if (wrapReadyInSpan) {
    return <span title={failureTitle}>{badge}</span>;
  }

  return badge;
}
