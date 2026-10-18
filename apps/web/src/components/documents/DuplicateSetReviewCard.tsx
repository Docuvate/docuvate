// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { DuplicateSetDto } from '@docuvate/contracts';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import {
  deleteDocument,
  dismissDuplicateSet,
  keepDuplicateStackVersion,
  markDuplicateStackNotDuplicate,
} from '../../lib/api';
import { formatUserFacingError } from '../../lib/apiErrors';
import { routes } from '../../lib/routes';
import { Button } from '../ui/Button';
import { Dialog, DialogBody, DialogFooter, DialogHeader } from '../ui/Dialog';
import { SegmentedControl } from '../ui/SegmentedControl';

type DuplicateDocumentRole = 'primary' | 'version' | 'notDuplicate' | 'delete';

interface DuplicateSetReviewCardProps {
  set: DuplicateSetDto;
  onResolved: () => void;
}

function defaultRoles(set: DuplicateSetDto): Record<string, DuplicateDocumentRole> {
  const roles: Record<string, DuplicateDocumentRole> = {};
  for (const [index, doc] of set.documents.entries()) {
    roles[doc.documentId] = index === 0 ? 'primary' : 'version';
  }
  return roles;
}

export function DuplicateSetReviewCard({ set, onResolved }: DuplicateSetReviewCardProps) {
  const { t } = useTranslation();
  const baselineRoles = useMemo(() => defaultRoles(set), [set]);
  const [roles, setRoles] = useState<Record<string, DuplicateDocumentRole>>(() =>
    defaultRoles(set)
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const decisionCount = useMemo(() => {
    let count = 0;
    for (const doc of set.documents) {
      if (roles[doc.documentId] !== baselineRoles[doc.documentId]) count += 1;
    }
    return count;
  }, [baselineRoles, roles, set.documents]);

  const deleteCount = useMemo(
    () => set.documents.filter((doc) => roles[doc.documentId] === 'delete').length,
    [roles, set.documents]
  );

  function resetRoles() {
    setRoles(defaultRoles(set));
    setError(null);
  }

  function presetAllVersionExceptNewest() {
    const next = defaultRoles(set);
    setRoles(next);
  }

  function presetAllNotDuplicate() {
    const next: Record<string, DuplicateDocumentRole> = {};
    for (const doc of set.documents) {
      next[doc.documentId] = 'notDuplicate';
    }
    setRoles(next);
  }

  async function applyDecisions() {
    const primaryId =
      set.documents.find((doc) => roles[doc.documentId] === 'primary')?.documentId ??
      set.documents[0]?.documentId;
    if (!primaryId) return;

    setBusy(true);
    setError(null);
    try {
      for (const doc of set.documents) {
        const role = roles[doc.documentId];
        if (doc.documentId === primaryId) continue;
        if (role === 'delete') {
          await deleteDocument(doc.documentId);
        } else if (role === 'notDuplicate') {
          await markDuplicateStackNotDuplicate(primaryId, doc.documentId);
        } else if (role === 'version') {
          await keepDuplicateStackVersion(primaryId, doc.documentId);
        }
      }
      const allDismiss = set.documents.every((doc) => roles[doc.documentId] === 'notDuplicate');
      if (allDismiss) {
        await dismissDuplicateSet(set.setId);
      }
      onResolved();
    } catch (err) {
      setError(formatUserFacingError(err, 'errors.actionFailed'));
    } finally {
      setBusy(false);
      setDeleteConfirmOpen(false);
    }
  }

  function onApplyClick() {
    if (deleteCount > 0) {
      setDeleteConfirmOpen(true);
      return;
    }
    void applyDecisions();
  }

  return (
    <article className="duplicate-set-review-card" data-testid="duplicate-set-review-card">
      <header className="duplicate-set-card-header">
        <h3>{t('documents.duplicateSetTitle', { count: set.documents.length })}</h3>
        <span className="muted">
          {set.bulkArchiveEligible
            ? t('documents.duplicateSetHashIdentical')
            : t('documents.duplicateSetSimilarity', { percent: set.similarityPercent })}
        </span>
      </header>

      <div className="duplicate-set-quick-actions">
        <Button type="button" variant="secondary" disabled={busy} onClick={presetAllVersionExceptNewest}>
          {t('documents.duplicateSetPresetStack')}
        </Button>
        <Button type="button" variant="secondary" disabled={busy} onClick={presetAllNotDuplicate}>
          {t('documents.duplicateSetPresetDismiss')}
        </Button>
      </div>

      <ul className="duplicate-set-role-list">
        {set.documents.map((doc, index) => {
          const role = roles[doc.documentId] ?? 'version';
          return (
            <li key={doc.documentId} className="duplicate-set-role-row" data-testid="duplicate-set-role-row">
              <div className="duplicate-set-role-doc">
                <Link to={routes.document(doc.documentId)}>{doc.title || doc.filename}</Link>
                <span className="muted cell-sub">
                  {doc.filename}
                  {index === 0 ? ` · ${t('documents.duplicateSetNewest')}` : ''}
                </span>
              </div>
              <SegmentedControl<DuplicateDocumentRole>
                ariaLabel={t('documents.duplicateSetRoleAria', { title: doc.title || doc.filename })}
                className="duplicate-set-role-control segmented-control--text"
                value={role}
                options={[
                  { value: 'primary', label: t('documents.duplicateSetRolePrimary') },
                  { value: 'version', label: t('documents.duplicateSetRoleVersion') },
                  { value: 'notDuplicate', label: t('documents.duplicateSetRoleNotDuplicate') },
                  { value: 'delete', label: t('documents.duplicateSetRoleDelete') },
                ]}
                onChange={(next) => {
                  setRoles((prev) => {
                    const updated = { ...prev, [doc.documentId]: next };
                    if (next === 'primary') {
                      for (const other of set.documents) {
                        if (other.documentId === doc.documentId) continue;
                        if (updated[other.documentId] === 'primary') {
                          updated[other.documentId] = 'version';
                        }
                      }
                    }
                    return updated;
                  });
                }}
              />
              {role === 'version' ? (
                <p className="muted duplicate-set-role-hint">{t('documents.duplicateSetVersionHint')}</p>
              ) : null}
            </li>
          );
        })}
      </ul>

      {error ? (
        <p className="error" role="alert">
          {error}
        </p>
      ) : null}

      <footer className="duplicate-set-review-footer">
        <Button type="button" variant="secondary" disabled={busy} onClick={resetRoles}>
          {t('documents.duplicateSetReset')}
        </Button>
        <Button
          type="button"
          variant="primary"
          disabled={busy || decisionCount === 0}
          data-testid="duplicate-set-apply-decisions"
          onClick={onApplyClick}
        >
          {t('documents.duplicateSetApplyDecisions', { count: decisionCount })}
        </Button>
      </footer>

      <Dialog
        open={deleteConfirmOpen}
        busy={busy}
        onCancel={() => { setDeleteConfirmOpen(false); }}
        aria-labelledby="duplicate-set-delete-title"
        data-testid="duplicate-set-delete-dialog"
      >
        <DialogHeader
          title={t('documents.duplicateSetDeleteConfirmTitle')}
          titleId="duplicate-set-delete-title"
        />
        <DialogBody>
          <p>{t('documents.duplicateSetDeleteConfirmDescription', { count: deleteCount })}</p>
        </DialogBody>
        <DialogFooter>
          <Button type="button" variant="secondary" disabled={busy} onClick={() => { setDeleteConfirmOpen(false); }}>
            {t('common.cancel')}
          </Button>
          <Button type="button" variant="danger" disabled={busy} onClick={() => void applyDecisions()}>
            {t('documents.duplicateSetDeleteConfirmAction', { count: deleteCount })}
          </Button>
        </DialogFooter>
      </Dialog>
    </article>
  );
}
