// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { useTranslation } from 'react-i18next';
import { DocumentDetailLoadStepList } from './DocumentDetailLoadStepList';
import { Skeleton } from '../ui/Skeleton';

interface DocumentPreviewPlaceholderProps {
  pipelinePending: boolean;
}

export function DocumentPreviewPlaceholder({ pipelinePending }: DocumentPreviewPlaceholderProps) {
  const { t } = useTranslation();
  const activeStep = pipelinePending ? 'pipeline' : 'preview';

  return (
    <div className="doc-preview-placeholder" role="status" aria-live="polite">
      <DocumentDetailLoadStepList
        activeStep={activeStep}
        metadataReady
        previewReady={false}
        compact
      />
      <p className="muted doc-preview-placeholder-lead">
        {pipelinePending ? t('documents.extractionRunning') : t('documents.loadingPreviewLead')}
      </p>
      <Skeleton
        className="doc-load-preview-frame doc-preview-placeholder-frame"
        decorative={false}
        label={t('documents.loadingPreviewLead')}
      />
      {!pipelinePending ? (
        <div className="extraction-progress extraction-progress-indeterminate doc-preview-placeholder-progress">
          <div className="extraction-progress-track">
            <div className="extraction-progress-fill" />
          </div>
        </div>
      ) : null}
    </div>
  );
}
