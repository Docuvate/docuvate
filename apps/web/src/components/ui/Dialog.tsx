// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { X } from 'lucide-react';
import {
  type ReactNode,
  type RefObject,
  useEffect,
  useRef,
} from 'react';
import { useTranslation } from 'react-i18next';

import { useDialogFocusTrap } from '../../lib/useDialogFocusTrap';
import { IconButton } from './IconButton';

export interface DialogProps {
  open: boolean;
  children: ReactNode;
  className?: string;
  busy?: boolean;
  onCancel?: () => void;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  'data-testid'?: string;
  initialFocusRef?: RefObject<HTMLElement | null>;
}

export function Dialog({
  open,
  children,
  className = '',
  busy = false,
  onCancel,
  'aria-labelledby': ariaLabelledBy,
  'aria-describedby': ariaDescribedBy,
  'data-testid': dataTestId,
  initialFocusRef,
}: DialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useDialogFocusTrap(dialogRef, open, initialFocusRef);

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
      className={`dv-dialog${className ? ` ${className}` : ''}`}
      aria-labelledby={ariaLabelledBy}
      aria-describedby={ariaDescribedBy}
      aria-modal="true"
      data-testid={dataTestId}
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onCancel?.();
      }}
    >
      {children}
    </dialog>
  );
}

export interface DialogHeaderProps {
  title: ReactNode;
  titleId: string;
  description?: ReactNode;
  descriptionId?: string;
  onClose?: () => void;
  closeDisabled?: boolean;
  showClose?: boolean;
}

export function DialogHeader({
  title,
  titleId,
  description,
  descriptionId,
  onClose,
  closeDisabled = false,
  showClose = false,
}: DialogHeaderProps) {
  const { t } = useTranslation();

  return (
    <header className="dv-dialog-header">
      <div className="dv-dialog-header-text">
        <h2 id={titleId} className="dv-dialog-title">
          {title}
        </h2>
        {description ? (
          <div id={descriptionId} className="dv-dialog-description muted">
            {description}
          </div>
        ) : null}
      </div>
      {showClose && onClose ? (
        <IconButton
          type="button"
          size="sm"
          className="icon-btn-ghost"
          icon={X}
          label={t('common.close')}
          disabled={closeDisabled}
          onClick={onClose}
        />
      ) : null}
    </header>
  );
}

export function DialogBody({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`dv-dialog-body${className ? ` ${className}` : ''}`}>{children}</div>;
}

export function DialogFooter({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <footer className={`dv-dialog-footer${className ? ` ${className}` : ''}`}>{children}</footer>;
}

export function DialogFormGrid({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`dv-dialog-form-grid${className ? ` ${className}` : ''}`}>{children}</div>;
}

/** Full-width row inside {@link DialogFormGrid}. */
export function DialogFieldSpan({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`dv-dialog-field-span${className ? ` ${className}` : ''}`}>{children}</div>;
}
