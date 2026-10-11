// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { DuplicateStackDto, DuplicateStackMemberDto } from '@docuvate/contracts';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
  deleteDocument,
  fetchDocumentContentBlob,
  getDuplicateStack,
  keepDuplicateStackVersion,
  markDuplicateStackNotDuplicate,
  setDuplicateStackPrimary,
} from '../../lib/api';
import { formatUserFacingError } from '../../lib/apiErrors';
import { bufferToDataUrl } from '../../lib/documentPreview';
import { fetchDocumentPreviewBuffer } from '../../lib/documentPreviewCache';
import { PdfViewer } from '../documents/PdfViewer';
import { Button } from '../ui/Button';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { isImageMime, isPdfMime } from './libraryDocumentUtils';

interface DuplicateStackReviewDialogProps {
  primaryDocumentId: string;
  initialVersionId?: string | null;
  onClose: () => void;
  onChanged: () => void;
}

function memberLabel(member: DuplicateStackMemberDto, t: (key: string) => string): string {
  const pct = member.similarity != null ? `${String(Math.round(member.similarity * 100))} %` : null;
  const source =
    member.source === 'hash'
      ? t('library.duplicateStackMemberHash')
      : member.source === 'embedding'
        ? t('library.duplicateStackMemberEmbedding')
        : null;
  if (pct && source) return `${pct} · ${source}`;
  if (member.role === 'primary') return t('library.duplicateStackMemberPrimary');
  return t('library.duplicateStackMemberVersion');
}

export function DuplicateStackReviewDialog({
  primaryDocumentId,
  initialVersionId,
  onClose,
  onChanged,
}: DuplicateStackReviewDialogProps) {
  const { t } = useTranslation();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [stack, setStack] = useState<DuplicateStackDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [versionId, setVersionId] = useState<string | null>(null);
  const [leftPreviewData, setLeftPreviewData] = useState<ArrayBuffer | null>(null);
  const [rightPreviewData, setRightPreviewData] = useState<ArrayBuffer | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const load = useCallback(
    async (options?: { silent?: boolean }) => {
      if (!options?.silent) setLoading(true);
      setError(null);
      try {
        const data = await getDuplicateStack(primaryDocumentId);
        setStack(data);
        const versions =
          data?.members.filter((m) => m.role === 'version').map((m) => m.documentId) ?? [];
        setVersionId((prev) => {
          if (initialVersionId && versions.includes(initialVersionId)) {
            return initialVersionId;
          }
          if (prev && versions.includes(prev)) return prev;
          return versions[0] ?? null;
        });
      } catch (err) {
        setError(formatUserFacingError(err, 'errors.duplicateStackLoadFailed'));
        setStack(null);
      } finally {
        if (!options?.silent) setLoading(false);
      }
    },
    [primaryDocumentId, initialVersionId]
  );

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
    void load();
  }, [load]);

  const primary = useMemo(() => stack?.members.find((m) => m.role === 'primary') ?? null, [stack]);
  const version = useMemo(
    () => stack?.members.find((m) => m.documentId === versionId) ?? null,
    [stack, versionId]
  );

  useEffect(() => {
    if (!primary) {
      setLeftPreviewData(null);
      return;
    }
    let active = true;
    void fetchDocumentPreviewBuffer(primary.documentId, () =>
      fetchDocumentContentBlob(primary.documentId)
    )
      .then((data) => {
        if (active) setLeftPreviewData(data);
      })
      .catch(() => {
        if (active) setLeftPreviewData(null);
      });
    return () => {
      active = false;
    };
  }, [primary]);

  useEffect(() => {
    if (!version) {
      setRightPreviewData(null);
      return;
    }
    let active = true;
    void fetchDocumentPreviewBuffer(version.documentId, () =>
      fetchDocumentContentBlob(version.documentId)
    )
      .then((data) => {
        if (active) setRightPreviewData(data);
      })
      .catch(() => {
        if (active) setRightPreviewData(null);
      });
    return () => {
      active = false;
    };
  }, [version]);

  const versions = stack?.members.filter((m) => m.role === 'version') ?? [];

  const runAction = async (action: () => Promise<void>, options?: { refresh?: boolean }) => {
    setBusy(true);
    setError(null);
    try {
      await action();
      onChanged();
      if (options?.refresh !== false) {
        await load({ silent: true });
      }
    } catch (err) {
      setError(formatUserFacingError(err, 'errors.actionFailed'));
    } finally {
      setBusy(false);
    }
  };

  const deleteSelectedVersion = async () => {
    if (!version || !primary) return;
    setBusy(true);
    setError(null);
    try {
      await deleteDocument(version.documentId);
      setDeleteConfirmOpen(false);
      onChanged();
      const stackContextId = primary.documentId;
      const updated = await getDuplicateStack(stackContextId);
      const remainingVersions = updated?.members.filter((m) => m.role === 'version') ?? [];
      if (remainingVersions.length === 0) {
        onClose();
        return;
      }
      setStack(updated);
      setVersionId(remainingVersions[0]?.documentId ?? null);
    } catch (err) {
      setError(formatUserFacingError(err, 'errors.deleteFailed'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <dialog
        ref={dialogRef}
        className="dup-dialog"
        aria-labelledby="dup-dialog-title"
        onCancel={(e) => {
          e.preventDefault();
          onClose();
        }}
      >
        <header className="dup-dialog-header">
          <div>
            <h2 id="dup-dialog-title">{t('library.duplicateStackReviewTitle')}</h2>
            <p className="muted">{t('library.duplicateStackReviewLead')}</p>
          </div>
          <Button type="button" variant="ghost" onClick={onClose} aria-label={t('common.close')}>
            {t('common.close')}
          </Button>
        </header>

        {loading ? <p className="muted">{t('library.duplicateStackLoading')}</p> : null}
        {error ? (
          <p className="error" role="alert">
            {error}
          </p>
        ) : null}

        {stack && primary ? (
          <>
            {versions.length > 1 ? (
              <div className="dup-dialog-version-picker">
                <label htmlFor="dup-version-select">{t('library.stackVersionLabel')}</label>
                <select
                  id="dup-version-select"
                  value={versionId ?? ''}
                  onChange={(e) => { setVersionId(e.target.value); }}
                >
                  {versions.map((v) => (
                    <option key={v.documentId} value={v.documentId}>
                      {v.title} ({v.filename})
                    </option>
                  ))}
                </select>
              </div>
            ) : null}

            <div className="dup-compare-grid">
              <ComparePane member={primary} previewData={leftPreviewData} side="links" />
              {version ? (
                <ComparePane member={version} previewData={rightPreviewData} side="rechts" />
              ) : (
                <div className="dup-compare-pane muted">{t('library.duplicateStackNoVersion')}</div>
              )}
            </div>

            {version ? (
              <div className="dup-dialog-actions">
                <Button
                  type="button"
                  variant="primary"
                  disabled={busy || version.role === 'primary'}
                  onClick={() =>
                    void runAction(async () => {
                      await setDuplicateStackPrimary(
                        primaryDocumentId,
                        stack.stackId,
                        version.documentId
                      );
                    })
                  }
                >
                  {t('library.duplicateStackKeepPrimary')}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  disabled={busy}
                  onClick={() =>
                    void runAction(async () => {
                      await keepDuplicateStackVersion(primary.documentId, version.documentId);
                    })
                  }
                >
                  {t('library.duplicateStackKeepVersion')}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  disabled={busy}
                  onClick={() =>
                    void runAction(async () => {
                      await markDuplicateStackNotDuplicate(primary.documentId, version.documentId);
                      onClose();
                    })
                  }
                >
                  {t('library.duplicateStackNotDuplicate')}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  disabled={busy}
                  onClick={() => { setDeleteConfirmOpen(true); }}
                >
                  {t('library.duplicateStackDeleteVersion')}
                </Button>
              </div>
            ) : null}
          </>
        ) : null}
      </dialog>
      <ConfirmDialog
        open={deleteConfirmOpen}
        title={t('library.duplicateDeleteTitle')}
        description={t('library.duplicateDeleteDescription', {
          filename: version?.filename ?? t('library.duplicateDeleteFallbackFile'),
        })}
        confirmLabel={t('common.deletePermanently')}
        cancelLabel={t('common.cancel')}
        tone="danger"
        busy={busy}
        onCancel={() => { setDeleteConfirmOpen(false); }}
        onConfirm={() => void deleteSelectedVersion()}
      />
    </>
  );
}

const ComparePane = memo(function ComparePane({
  member,
  previewData,
  side,
}: {
  member: DuplicateStackMemberDto;
  previewData: ArrayBuffer | null;
  side: string;
}) {
  const { t } = useTranslation();
  const isPdf = isPdfMime(member.mimeType);
  const isImage = isImageMime(member.mimeType);
  const imageSrc = isImage && previewData ? bufferToDataUrl(previewData, member.mimeType) : null;

  return (
    <div className="dup-compare-pane">
      <div className="dup-compare-pane-head">
        <span className="dup-compare-side">{side}</span>
        <strong className="dup-compare-truncate" title={member.title}>
          {member.title}
        </strong>
        <span
          className="muted cell-sub dup-compare-truncate"
          title={`${member.filename} · ${memberLabel(member, t)}`}
        >
          {member.filename} · {memberLabel(member, t)}
        </span>
      </div>
      <div className="dup-compare-preview">
        {!previewData ? (
          <p className="muted">{t('library.duplicateStackPreviewLoading')}</p>
        ) : isPdf ? (
          <PdfViewer data={previewData} paginated={false} fitWidth />
        ) : isImage && imageSrc ? (
          <img src={imageSrc} alt="" className="dup-compare-image" />
        ) : (
          <p className="muted">{t('library.duplicateStackPreviewUnsupported')}</p>
        )}
      </div>
    </div>
  );
});
