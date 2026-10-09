// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { useEffect, useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { useToastNotify } from '../save/ToastProvider';
import { useDialogFocusTrap } from '../../lib/useDialogFocusTrap';
import { createSavedDocumentView } from '../../lib/api';
import { buildSavedViewPayload } from '../../lib/savedViewState';
import { notifySavedViewsChanged } from '../../lib/savedViewsEvents';
import { useInstallationRole } from '../../lib/useInstallationRole';
import type { useLibraryPageData } from '../../pages/library/useLibraryPageData';

type LibraryData = ReturnType<typeof useLibraryPageData>;

interface SaveViewDialogProps {
  open: boolean;
  onClose: () => void;
  data: LibraryData;
  onSaved?: () => void;
}

export function SaveViewDialog({ open, onClose, data, onSaved }: SaveViewDialogProps) {
  const { t } = useTranslation();
  const { pushSuccess, pushError } = useToastNotify();
  const role = useInstallationRole();
  const titleId = useId();
  const descId = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const [name, setName] = useState('');
  const [visibility, setVisibility] = useState<'private' | 'shared'>('private');
  const [pinned, setPinned] = useState(false);
  const [busy, setBusy] = useState(false);

  useDialogFocusTrap(dialogRef, open, cancelRef);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open) {
      if (!dialog.open) dialog.showModal();
    } else if (dialog.open) {
      dialog.close();
    }
  }, [open]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    const form = e.currentTarget;
    const pinFromForm = form.elements.namedItem('pinnedSidebar');
    const pinnedSidebar = pinFromForm instanceof HTMLInputElement ? pinFromForm.checked : pinned;
    setBusy(true);
    try {
      const created = await createSavedDocumentView(
        buildSavedViewPayload(trimmed, {
          filters: data.filters,
          query: data.query,
          tags: data.tags,
          viewMode: data.viewMode,
          filterMode: data.filterMode,
          visibility,
          pinnedSidebar,
        })
      );
      pushSuccess(t('common.saved'));
      notifySavedViewsChanged(created);
      onSaved?.();
      onClose();
      setName('');
    } catch (err) {
      pushError(err instanceof Error ? err.message : t('errors.generic'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <dialog
      ref={dialogRef}
      className="confirm-dialog save-view-dialog"
      aria-labelledby={titleId}
      aria-describedby={descId}
      aria-modal="true"
      onCancel={(e) => {
        e.preventDefault();
        if (!busy) onClose();
      }}
    >
      <h2 id={titleId} className="confirm-dialog-title">
        {t('savedViews.saveDialogTitle')}
      </h2>
      <p id={descId} className="muted confirm-dialog-desc">
        {t('savedViews.saveDialogLead')}
      </p>
      <form className="stack-form save-view-dialog-form" onSubmit={(e) => void onSubmit(e)}>
        <label className="field-label">
          {t('savedViews.nameLabel')}
          <Input value={name} onChange={(e) => setName(e.target.value)} autoFocus required />
        </label>
        {role === 'admin' ? (
          <label className="field-label">
            {t('savedViews.visibilityLabel')}
            <Select
              value={visibility}
              onChange={(v) => setVisibility(v as 'private' | 'shared')}
              options={[
                { value: 'private', label: t('savedViews.visibilityPrivate') },
                { value: 'shared', label: t('savedViews.visibilityShared') },
              ]}
              aria-label={t('savedViews.visibilityLabel')}
            />
          </label>
        ) : null}
        <label className="checkbox-row">
          <input
            type="checkbox"
            name="pinnedSidebar"
            checked={pinned}
            onChange={(e) => setPinned(e.target.checked)}
            aria-label={t('savedViews.pinSidebar')}
          />
          <span>{t('savedViews.pinSidebar')}</span>
        </label>
        <div className="confirm-dialog-actions">
          <Button
            type="button"
            variant="secondary"
            ref={cancelRef}
            disabled={busy}
            onClick={onClose}
          >
            {t('common.cancel')}
          </Button>
          <Button type="submit" disabled={busy || !name.trim()}>
            {t('savedViews.saveConfirm')}
          </Button>
        </div>
      </form>
    </dialog>
  );
}
