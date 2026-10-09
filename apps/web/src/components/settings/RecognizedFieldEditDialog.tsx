// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { useEffect, useId, useRef, useState } from 'react';
import type { TagDto } from '@docuvate/contracts';
import { useTranslation } from 'react-i18next';
import { useDialogFocusTrap } from '../../lib/useDialogFocusTrap';
import type { RecognizedFieldDraft } from '../../lib/recognizedFieldDraft';
import { emptyRecognizedFieldDraft } from '../../lib/recognizedFieldDraft';
import { Button } from '../ui/Button';
import type { RecognizedFieldGateDraft } from './RecognizedFieldQualityGateEditor';
import { RecognizedFieldRowForm } from './RecognizedFieldRowForm';

export type RecognizedFieldEditDialogProps = {
  open: boolean;
  mode: 'create' | 'edit';
  initialRow: RecognizedFieldDraft | null;
  tags: TagDto[];
  gateDefaults: RecognizedFieldGateDraft;
  busy: boolean;
  onCancel: () => void;
  onSave: (row: RecognizedFieldDraft) => void;
};

export function RecognizedFieldEditDialog({
  open,
  mode,
  initialRow,
  tags,
  gateDefaults,
  busy,
  onCancel,
  onSave,
}: RecognizedFieldEditDialogProps) {
  const { t } = useTranslation();
  const titleId = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const [draft, setDraft] = useState<RecognizedFieldDraft>(
    () => initialRow ?? emptyRecognizedFieldDraft(gateDefaults)
  );
  const [keyManual, setKeyManual] = useState(false);

  useDialogFocusTrap(dialogRef, open, cancelRef);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }
    if (open) {
      if (!dialog.open) {
        dialog.showModal();
      }
      setDraft(initialRow ?? emptyRecognizedFieldDraft(gateDefaults));
      setKeyManual(false);
    } else if (dialog.open) {
      dialog.close();
    }
  }, [open, initialRow, gateDefaults]);

  const title =
    mode === 'create'
      ? t('recognizedFields.dialogCreateTitle')
      : t('recognizedFields.dialogEditTitle');

  return (
    <dialog
      ref={dialogRef}
      className="confirm-dialog recognized-field-edit-dialog"
      aria-labelledby={titleId}
      aria-modal="true"
      onCancel={(e) => {
        e.preventDefault();
        if (!busy) {
          onCancel();
        }
      }}
    >
      <h2 id={titleId} className="confirm-dialog-title">
        {title}
      </h2>
      <RecognizedFieldRowForm
        row={draft}
        tags={tags}
        gateDefaults={gateDefaults}
        keyManual={keyManual}
        onChange={setDraft}
        onKeyManual={() => setKeyManual(true)}
      />
      <div className="confirm-dialog-actions">
        <Button
          type="button"
          variant="secondary"
          disabled={busy}
          ref={cancelRef}
          data-dialog-initial-focus="cancel"
          onClick={onCancel}
        >
          {t('common.cancel')}
        </Button>
        <Button type="button" variant="primary" disabled={busy} onClick={() => onSave(draft)}>
          {busy ? t('save.saving') : t('save.save')}
        </Button>
      </div>
    </dialog>
  );
}
