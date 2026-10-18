// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { type ReactNode, useId, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from './Button';
import { Dialog, DialogBody, DialogFooter, DialogHeader } from './Dialog';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: 'danger' | 'default';
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel,
  tone = 'default',
  busy = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const { t } = useTranslation();
  const titleId = useId();
  const descId = useId();
  const cancelRef = useRef<HTMLButtonElement>(null);
  const resolvedConfirm = confirmLabel ?? t('common.confirm');
  const resolvedCancel = cancelLabel ?? t('common.cancel');

  return (
    <Dialog
      open={open}
      busy={busy}
      onCancel={onCancel}
      aria-labelledby={titleId}
      aria-describedby={descId}
      initialFocusRef={cancelRef}
    >
      <DialogHeader title={title} titleId={titleId} />
      <DialogBody>
        <div id={descId}>{description}</div>
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
          {resolvedCancel}
        </Button>
        <Button
          type="button"
          variant={tone === 'danger' ? 'danger' : 'primary'}
          disabled={busy}
          onClick={onConfirm}
        >
          {resolvedConfirm}
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
