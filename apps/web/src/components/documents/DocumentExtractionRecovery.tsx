// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { DocumentDto } from '@docuvate/contracts';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import {
  isExtractionPending,
  presentExtractionFailure,
} from '../../lib/documentExtractionState';
import { routes } from '../../lib/routes';
import { Button } from '../ui/Button';
import { ExtractionProgressBar } from './ExtractionProgressBar';

interface DocumentExtractionRecoveryProps {
  doc: DocumentDto;
  requeueBusy: boolean;
  onRequeue: () => void;
  onOpenArena?: () => void;
  compact?: boolean;
}

export function DocumentExtractionRecovery({
  doc,
  requeueBusy,
  onRequeue,
  onOpenArena,
  compact = false,
}: DocumentExtractionRecoveryProps) {
  const { t } = useTranslation();
  const pending = isExtractionPending(doc.status);
  const failed = doc.status === 'failed';
  const showRecovery = failed || pending;

  if (!showRecovery) {
    return null;
  }

  const failure = failed ? presentExtractionFailure(doc.extractionFailureReason) : null;
  const message = failed ? failure?.userMessage : t('documents.extractionRunning');

  return (
    <div
      className={`extraction-recovery${compact ? ' extraction-recovery-compact' : ''}${failed ? ' extraction-recovery-failed' : ''}`}
      role={failed ? 'alert' : 'status'}
    >
      <p className="extraction-recovery-message">{message}</p>
      {failed && failure?.technicalDetail ? (
        <details className="extraction-recovery-technical">
          <summary>{t('documents.extractionFailedTechnicalToggle')}</summary>
          <p className="muted extraction-recovery-technical-body">{failure.technicalDetail}</p>
        </details>
      ) : null}
      {pending ? <ExtractionProgressBar doc={doc} /> : null}
      <div className="extraction-recovery-actions">
        {failed ? (
          <>
            <Button type="button" disabled={requeueBusy} onClick={onRequeue}>
              {requeueBusy ? t('documents.reprocessPending') : t('documents.reprocess')}
            </Button>
            {onOpenArena ? (
              <Button type="button" variant="secondary" onClick={onOpenArena}>
                {t('documents.arenaCompare')}
              </Button>
            ) : null}
            <Link className="button-link extraction-recovery-link" to={routes.settings}>
              {t('documents.extractionSettingsLink')}
            </Link>
          </>
        ) : (
          <span className="muted extraction-recovery-pending">
            {t('documents.extractionPleaseWait')}
          </span>
        )}
      </div>
    </div>
  );
}
