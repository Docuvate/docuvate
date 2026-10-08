import { useEffect, useId, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useDialogFocusTrap } from '../../lib/useDialogFocusTrap';
import { Button } from './Button';

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
  const dialogRef = useRef<HTMLDialogElement>(null);
  const okRef = useRef<HTMLButtonElement>(null);
  const resolvedOk = okLabel ?? t('common.confirm');

  useDialogFocusTrap(dialogRef, open, okRef);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open) {
      if (!dialog.open) dialog.showModal();
    } else if (dialog.open) {
      dialog.close();
    }
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      className="confirm-dialog alert-dialog"
      aria-labelledby={titleId}
      aria-describedby={descId}
      aria-modal="true"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
    >
      <h2 id={titleId} className="confirm-dialog-title">
        {title}
      </h2>
      <p id={descId} className="muted confirm-dialog-desc">
        {description}
      </p>
      <div className="confirm-dialog-actions">
        <Button type="button" ref={okRef} data-dialog-initial-focus="cancel" onClick={onClose}>
          {resolvedOk}
        </Button>
      </div>
    </dialog>
  );
}
