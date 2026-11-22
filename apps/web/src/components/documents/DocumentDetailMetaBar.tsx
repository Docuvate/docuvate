// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { DocumentDto } from '@docuvate/contracts';

import { documentStageState } from '../../lib/documentPipeline';
import { StagePill } from '../pipeline';
import { DocumentDetailOverflowMenu } from './DocumentDetailOverflowMenu';

/** Panel kinds still used by pipeline header / openPanel routing (details inline; Felder/Labels gallery). */
export type InspectorPanel = 'fields' | 'details' | 'labels';

interface DocumentDetailMetaBarProps {
  doc: DocumentDto;
  onDelete: () => void;
  onRequeueExtraction?: () => void;
  requeueBusy?: boolean;
  showTechnicalDetails?: boolean;
  onShowTechnicalDetailsChange?: (open: boolean) => void;
}

export function DocumentDetailMetaBar({
  doc,
  onDelete,
  onRequeueExtraction,
  requeueBusy = false,
  showTechnicalDetails = false,
  onShowTechnicalDetailsChange,
}: DocumentDetailMetaBarProps) {
  const title = doc.title.trim() || doc.filename;

  return (
    <header className="document-detail-meta">
      <div className="document-detail-meta-top">
        <div className="document-detail-meta-primary">
          <StagePill state={documentStageState(doc)} status={doc.status} />
          <h1
            className="document-detail-title"
            data-ux="page-title"
            title={`${title}${doc.filename !== title ? ` · ${doc.filename}` : ''}`}
          >
            {title}
          </h1>
        </div>
        <div className="document-detail-meta-actions">
          <DocumentDetailOverflowMenu
            doc={doc}
            onDelete={onDelete}
            onRequeueExtraction={onRequeueExtraction}
            requeueBusy={requeueBusy}
            showTechnicalDetails={showTechnicalDetails}
            onShowTechnicalDetailsChange={onShowTechnicalDetailsChange}
          />
        </div>
      </div>
    </header>
  );
}
