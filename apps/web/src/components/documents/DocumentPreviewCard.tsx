// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { DocumentDto, ExtractionBlock } from '@docuvate/contracts';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import {
  isDocumentPipelinePending,
  isDocumentPreviewPending,
} from '../../lib/documentDetailLoadingSteps';
import { bufferToDataUrl } from '../../lib/documentPreview';
import { Card } from '../ui/Card';
import { DocumentPreviewPlaceholder } from './DocumentPreviewPlaceholder';
import { PdfViewer } from './PdfViewer';

const NO_HIGHLIGHTS: ExtractionBlock[] = [];

interface DocumentPreviewCardProps {
  doc: DocumentDto;
  previewUrl?: string | null;
  previewData?: ArrayBuffer | null;
  previewLoading?: boolean;
  previewUnavailable?: boolean;
  isPdf: boolean;
  isImage: boolean;
  isPlainText?: boolean;
  plainTextPreview?: string | null;
  highlightBlocks?: ExtractionBlock[];
  viewerPage?: number;
  onViewerPageChange?: (page: number) => void;
  paginated?: boolean;
  fitWidth?: boolean;
  compact?: boolean;
  title?: string;
  onPageClick?: (page: number, nx: number, ny: number) => void;
}

export function DocumentPreviewCard({
  doc,
  previewUrl,
  previewData,
  previewLoading = false,
  previewUnavailable = false,
  isPdf,
  isImage,
  isPlainText = false,
  plainTextPreview = null,
  highlightBlocks = NO_HIGHLIGHTS,
  viewerPage,
  onViewerPageChange,
  paginated = true,
  fitWidth = false,
  compact = false,
  title,
  onPageClick,
}: DocumentPreviewCardProps) {
  const { t } = useTranslation();
  const previewTitle = title ?? t('documents.previewTitle');
  const highlights = useMemo(
    () =>
      highlightBlocks.map((b) => ({
        page: b.page,
        x: b.x,
        y: b.y,
        width: b.width,
        height: b.height,
      })),
    [highlightBlocks]
  );

  const imageSrc = useMemo(() => {
    if (!isImage || !previewData) return previewUrl ?? null;
    return bufferToDataUrl(previewData, doc.mimeType);
  }, [doc.mimeType, isImage, previewData, previewUrl]);

  const previewPending =
    previewLoading ||
    (!previewUnavailable && isDocumentPreviewPending(doc, previewData, previewUrl));
  const pipelinePending = isDocumentPipelinePending(doc);
  const showProcessingHint = pipelinePending && !previewPending && !previewUnavailable;

  return (
    <Card className={isPdf ? 'preview-card preview-card-pdf' : 'preview-card'}>
      {!compact ? <h2 className="detail-pane-title">{previewTitle}</h2> : null}
      {showProcessingHint ? (
        <p className="muted preview-card-hint">{t('documents.extractionRunning')}</p>
      ) : null}
      {previewUnavailable ? (
        <div className="doc-preview-unavailable">
          <p className="muted">{t('documents.previewUnavailable')}</p>
        </div>
      ) : null}
      {previewPending && !previewUnavailable ? (
        <DocumentPreviewPlaceholder pipelinePending={pipelinePending} />
      ) : null}
      {!previewUnavailable && isImage && imageSrc ? (
        <img src={imageSrc} alt="" className="doc-preview-image" />
      ) : null}
      {!previewUnavailable && isPdf && (previewData || previewUrl) ? (
        <PdfViewer
          data={previewData ?? undefined}
          url={previewData ? undefined : (previewUrl ?? undefined)}
          highlightBlocks={highlights}
          paginated={paginated}
          fitWidth={fitWidth}
          page={viewerPage}
          onPageChange={onViewerPageChange}
          onPageClick={onPageClick}
        />
      ) : null}
      {isPlainText ? (
        plainTextPreview?.trim() ? (
          <pre className="doc-preview-text">{plainTextPreview}</pre>
        ) : (
          <p className="muted">{t('documents.previewTextEmpty')}</p>
        )
      ) : null}
      {!isImage && !isPdf && !isPlainText ? (
        <p className="muted">{t('documents.previewUnsupported')}</p>
      ) : null}
    </Card>
  );
}
