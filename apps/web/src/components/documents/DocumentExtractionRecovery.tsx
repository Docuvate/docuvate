// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { DocumentDto } from '@docuvate/contracts';
import { routes } from '../../lib/routes';
import { extractionFailureMessage, isExtractionPending } from '../../lib/documentExtractionState';
import { ExtractionProgressBar } from './ExtractionProgressBar';
import { Button } from '../ui/Button';

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

  const message = failed ? extractionFailureMessage(doc) : t('documents.extractionRunning');

  return (
    <div
      className={`extraction-recovery${compact ? ' extraction-recovery-compact' : ''}${failed ? ' extraction-recovery-failed' : ''}`}
      role={failed ? 'alert' : 'status'}
    >
      <p className="extraction-recovery-message">{message}</p>
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
