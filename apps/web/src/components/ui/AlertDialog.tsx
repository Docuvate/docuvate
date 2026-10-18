// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { useId, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from './Button';
import { Dialog, DialogBody, DialogFooter, DialogHeader } from './Dialog';

interface AlertDialogProps {
  open: boolean;
  title: string;
  description: string;
  okLabel?: string;
  onClose: () => void;
}

export function AlertDialog({ open, title, description, okLabel, onClose }: AlertDialogProps) {
  const { t } = useTranslation();
  const titleId = useId();
  const descId = useId();
  const okRef = useRef<HTMLButtonElement>(null);
  const resolvedOk = okLabel ?? t('common.confirm');

  return (
    <Dialog
      open={open}
      onCancel={onClose}
      aria-labelledby={titleId}
      aria-describedby={descId}
      initialFocusRef={okRef}
    >
      <DialogHeader title={title} titleId={titleId} />
      <DialogBody>
        <p id={descId}>{description}</p>
      </DialogBody>
      <DialogFooter>
        <Button type="button" ref={okRef} data-dialog-initial-focus="cancel" onClick={onClose}>
          {resolvedOk}
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
