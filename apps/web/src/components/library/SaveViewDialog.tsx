// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { useEffect, useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { createSavedDocumentView } from '../../lib/api';
import { notifySavedViewsChanged } from '../../lib/savedViewsEvents';
import { buildSavedViewPayload } from '../../lib/savedViewState';
import { useInstallationRole } from '../../lib/useInstallationRole';
import type { useLibraryPageData } from '../../pages/library/useLibraryPageData';
import { useToastNotify } from '../save/ToastProvider';
import { Button } from '../ui/Button';
import { Dialog, DialogBody, DialogFieldSpan, DialogFooter, DialogFormGrid, DialogHeader } from '../ui/Dialog';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';

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
  const cancelRef = useRef<HTMLButtonElement>(null);
  const [name, setName] = useState('');
  const [visibility, setVisibility] = useState<'private' | 'shared'>('private');
  const [pinned, setPinned] = useState(false);
  const [busy, setBusy] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      nameInputRef.current?.focus();
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
    <Dialog
      open={open}
      busy={busy}
      onCancel={onClose}
      aria-labelledby={titleId}
      aria-describedby={descId}
      initialFocusRef={cancelRef}
    >
      <DialogHeader
        title={t('savedViews.saveDialogTitle')}
        titleId={titleId}
        description={t('savedViews.saveDialogLead')}
        descriptionId={descId}
      />
      <form onSubmit={(e) => void onSubmit(e)}>
        <DialogBody>
          <DialogFormGrid className="save-view-dialog-form">
            <DialogFieldSpan>
              <label className="field-label">
                {t('savedViews.nameLabel')}
                <Input
                  ref={nameInputRef}
                  value={name}
                  onChange={(e) => { setName(e.target.value); }}
                  required
                />
              </label>
            </DialogFieldSpan>
            {role === 'admin' ? (
              <DialogFieldSpan>
                <label className="field-label">
                  {t('savedViews.visibilityLabel')}
                  <Select
                    value={visibility}
                    onChange={(v) => { setVisibility(v === 'shared' ? 'shared' : 'private'); }}
                    options={[
                      { value: 'private', label: t('savedViews.visibilityPrivate') },
                      { value: 'shared', label: t('savedViews.visibilityShared') },
                    ]}
                    aria-label={t('savedViews.visibilityLabel')}
                  />
                </label>
              </DialogFieldSpan>
            ) : null}
            <DialogFieldSpan>
              <label className="checkbox-row">
                <input
                  type="checkbox"
                  name="pinnedSidebar"
                  checked={pinned}
                  onChange={(e) => { setPinned(e.target.checked); }}
                  aria-label={t('savedViews.pinSidebar')}
                />
                <span>{t('savedViews.pinSidebar')}</span>
              </label>
            </DialogFieldSpan>
          </DialogFormGrid>
        </DialogBody>
        <DialogFooter>
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
        </DialogFooter>
      </form>
    </Dialog>
  );
}
