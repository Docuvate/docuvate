import { useEffect, useId, useRef, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useDialogFocusTrap } from '../../lib/useDialogFocusTrap';
import { Button } from './Button';

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
  const dialogRef = useRef<HTMLDialogElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const resolvedConfirm = confirmLabel ?? t('common.confirm');
  const resolvedCancel = cancelLabel ?? t('common.cancel');

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

  return (
    <dialog
      ref={dialogRef}
      className="confirm-dialog"
      aria-labelledby={titleId}
      aria-describedby={descId}
      aria-modal="true"
      onCancel={(e) => {
        e.preventDefault();
        if (!busy) onCancel();
      }}
    >
      <h2 id={titleId} className="confirm-dialog-title">
        {title}
      </h2>
      <div id={descId} className="muted confirm-dialog-desc">
        {description}
      </div>
      <div className="confirm-dialog-actions">
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
      </div>
    </dialog>
  );
}
