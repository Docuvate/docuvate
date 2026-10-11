// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import {
  duplicatePairDifferenceRows,
  type DuplicateDocumentSignals,
  type DuplicateStackMemberDto,
} from '@docuvate/contracts';
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
  getDuplicateStack,
  keepDuplicateStackVersion,
  markDuplicateStackNotDuplicate,
  restoreDuplicateStackPair,
} from '../../lib/api';
import { formatUserFacingError } from '../../lib/apiErrors';
import { Button } from '../ui/Button';

const DIFF_LABEL_KEYS: Record<string, string> = {
  period: 'library.duplicateStackDiffPeriod',
  filename: 'library.duplicateStackDiffFilename',
  title: 'library.duplicateStackDiffTitle',
  amounts: 'library.duplicateStackDiffAmounts',
  taxId: 'library.duplicateStackDiffTaxId',
};

type UndoState =
  | { kind: 'separated'; primaryId: string; otherId: string }
  | { kind: 'confirmed'; primaryId: string; otherId: string };

function signalsFromMember(member: DuplicateStackMemberDto): DuplicateDocumentSignals {
  return {
    documentId: member.documentId,
    filename: member.filename,
    title: member.title,
    documentDateYear: null,
    extractedTextSample: '',
    pageCount: null,
  };
}

interface DuplicateStackQuickReviewProps {
  primaryDocumentId: string;
  label: string;
  className?: string;
  onChanged: () => void;
  onOpenFullReview?: (primaryId: string, versionId?: string | null) => void;
}

export function DuplicateStackQuickReview({
  primaryDocumentId,
  label,
  className,
  onChanged,
  onOpenFullReview,
}: DuplicateStackQuickReviewProps) {
  const { t } = useTranslation();
  const popoverId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [primary, setPrimary] = useState<DuplicateStackMemberDto | null>(null);
  const [version, setVersion] = useState<DuplicateStackMemberDto | null>(null);
  const [undo, setUndo] = useState<UndoState | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const stack = await getDuplicateStack(primaryDocumentId);
      const primaryMember = stack?.members.find((m) => m.role === 'primary') ?? null;
      const versionMember = stack?.members.find((m) => m.role === 'version') ?? null;
      setPrimary(primaryMember);
      setVersion(versionMember);
    } catch (err) {
      setError(formatUserFacingError(err, 'errors.duplicateStackLoadFailed'));
      setPrimary(null);
      setVersion(null);
    } finally {
      setLoading(false);
    }
  }, [primaryDocumentId]);

  useEffect(() => {
    if (!open) return;
    void load();
  }, [load, open]);

  useEffect(() => {
    if (!undo) return;
    const timer = window.setTimeout(() => { setUndo(null); }, 8000);
    return () => { window.clearTimeout(timer); };
  }, [undo]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => { document.removeEventListener('mousedown', onPointerDown); };
  }, [open]);

  const runAction = async (action: () => Promise<void>, nextUndo: UndoState | null) => {
    setBusy(true);
    setError(null);
    try {
      await action();
      setUndo(nextUndo);
      onChanged();
      await load();
    } catch (err) {
      setError(formatUserFacingError(err, 'errors.actionFailed'));
    } finally {
      setBusy(false);
    }
  };

  const diffRows =
    primary && version
      ? duplicatePairDifferenceRows(signalsFromMember(primary), signalsFromMember(version))
      : [];

  return (
    <div className="duplicate-stack-quick-review" ref={rootRef}>
      <button
        type="button"
        className={className}
        aria-expanded={open}
        aria-controls={popoverId}
        onClick={() => { setOpen((prev) => !prev); }}
      >
        {label}
      </button>
      {open ? (
        <div className="duplicate-stack-quick-review-panel" id={popoverId} role="dialog">
          <p className="duplicate-stack-quick-review-lead">{t('library.duplicateStackPopoverLead')}</p>
          {loading ? <p className="muted">{t('library.duplicateStackLoading')}</p> : null}
          {error ? <p className="form-error">{error}</p> : null}
          {primary && version ? (
            <>
              <div className="duplicate-stack-quick-review-pair">
                <div>
                  <span className="muted">{t('library.duplicateStackMemberPrimary')}</span>
                  <div className="duplicate-stack-quick-review-doc" title={primary.filename}>
                    {primary.title}
                  </div>
                </div>
                <div>
                  <span className="muted">{t('library.duplicateStackMemberVersion')}</span>
                  <div className="duplicate-stack-quick-review-doc" title={version.filename}>
                    {version.title}
                  </div>
                </div>
              </div>
              <table className="duplicate-stack-quick-review-diff">
                <thead>
                  <tr>
                    <th scope="col" />
                    <th scope="col">{t('library.duplicateStackDiffPrimaryCol')}</th>
                    <th scope="col">{t('library.duplicateStackDiffOtherCol')}</th>
                  </tr>
                </thead>
                <tbody>
                  {diffRows.map((row) => (
                    <tr key={row.label} className={row.differs ? 'duplicate-stack-diff-row-warn' : ''}>
                      <th scope="row">{t(DIFF_LABEL_KEYS[row.label] ?? row.label)}</th>
                      <td>{row.primary}</td>
                      <td>{row.other}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="duplicate-stack-quick-review-actions">
                <Button
                  type="button"
                  variant="secondary"
                  disabled={busy}
                  onClick={() =>
                    void runAction(
                      async () => {
                        await markDuplicateStackNotDuplicate(primary.documentId, version.documentId);
                        setOpen(false);
                      },
                      { kind: 'separated', primaryId: primary.documentId, otherId: version.documentId }
                    )
                  }
                >
                  {t('library.duplicateStackSeparateAction')}
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  disabled={busy}
                  onClick={() =>
                    void runAction(
                      async () => {
                        await keepDuplicateStackVersion(primary.documentId, version.documentId);
                      },
                      { kind: 'confirmed', primaryId: primary.documentId, otherId: version.documentId }
                    )
                  }
                >
                  {t('library.duplicateStackConfirmAction')}
                </Button>
                {onOpenFullReview ? (
                  <Button
                    type="button"
                    variant="ghost"
                    disabled={busy}
                    onClick={() => {
                      setOpen(false);
                      onOpenFullReview(primary.documentId, version.documentId);
                    }}
                  >
                    {t('library.stackCompareAction')}
                  </Button>
                ) : null}
              </div>
            </>
          ) : null}
          {undo ? (
            <div className="duplicate-stack-quick-review-undo" role="status">
              <span>{t('library.duplicateStackUndoMessage')}</span>
              <button
                type="button"
                className="button-link"
                disabled={busy}
                onClick={() =>
                  void runAction(
                    async () => {
                      if (undo.kind === 'separated') {
                        await restoreDuplicateStackPair(undo.primaryId, undo.otherId);
                      } else {
                        await markDuplicateStackNotDuplicate(undo.primaryId, undo.otherId);
                      }
                      setUndo(null);
                    },
                    null
                  )
                }
              >
                {t('common.undo')}
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
