// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { TagDto } from '@docuvate/contracts';
import { useEffect, useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { RecognizedFieldDraft } from '../../lib/recognizedFieldDraft';
import { emptyRecognizedFieldDraft } from '../../lib/recognizedFieldDraft';
import { Button } from '../ui/Button';
import { Dialog, DialogBody, DialogFooter, DialogHeader } from '../ui/Dialog';
import type { RecognizedFieldGateDraft } from './RecognizedFieldQualityGateEditor';
import { RecognizedFieldRowForm } from './RecognizedFieldRowForm';

export interface RecognizedFieldEditDialogProps {
  open: boolean;
  mode: 'create' | 'edit';
  initialRow: RecognizedFieldDraft | null;
  tags: TagDto[];
  gateDefaults: RecognizedFieldGateDraft;
  busy: boolean;
  onCancel: () => void;
  onSave: (row: RecognizedFieldDraft) => void;
}

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
  const cancelRef = useRef<HTMLButtonElement>(null);
  const [draft, setDraft] = useState<RecognizedFieldDraft>(
    () => initialRow ?? emptyRecognizedFieldDraft(gateDefaults)
  );
  const [keyManual, setKeyManual] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }
    setDraft(initialRow ?? emptyRecognizedFieldDraft(gateDefaults));
    setKeyManual(false);
  }, [open, initialRow, gateDefaults]);

  const title =
    mode === 'create'
      ? t('recognizedFields.dialogCreateTitle')
      : t('recognizedFields.dialogEditTitle');

  return (
    <Dialog
      open={open}
      busy={busy}
      onCancel={onCancel}
      aria-labelledby={titleId}
      initialFocusRef={cancelRef}
    >
      <DialogHeader title={title} titleId={titleId} />
      <DialogBody>
        <RecognizedFieldRowForm
          row={draft}
          tags={tags}
          gateDefaults={gateDefaults}
          keyManual={keyManual}
          onChange={setDraft}
          onKeyManual={() => { setKeyManual(true); }}
        />
      </DialogBody>
      <DialogFooter>
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
        <Button type="button" variant="primary" disabled={busy} onClick={() => { onSave(draft); }}>
          {busy ? t('save.saving') : t('save.save')}
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
