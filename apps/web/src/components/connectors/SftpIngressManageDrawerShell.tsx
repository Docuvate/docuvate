// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { useCallback, useEffect, useRef, type ReactNode, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useDialogFocusTrap } from '../../lib/useDialogFocusTrap';

interface SftpIngressManageDrawerShellProps {
  open: boolean;
  onClose: () => void;
  returnFocusRef?: RefObject<HTMLElement>;
  title: string;
  titleId?: string;
  children: ReactNode;
}

export function SftpIngressManageDrawerShell({
  open,
  onClose,
  returnFocusRef,
  title,
  titleId = 'sftp-manage-title',
  children,
}: SftpIngressManageDrawerShellProps) {
  const { t } = useTranslation();
  const drawerRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useDialogFocusTrap(drawerRef, open, closeRef);

  const closeAndRestoreFocus = useCallback(() => {
    onClose();
    requestAnimationFrame(() => returnFocusRef?.current?.focus());
  }, [onClose, returnFocusRef]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeAndRestoreFocus();
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, closeAndRestoreFocus]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div className="connector-sftp-manage-drawer-root">
      <button
        type="button"
        className="connector-sftp-manage-drawer-backdrop"
        aria-label={t('common.close')}
        onClick={closeAndRestoreFocus}
      />
      <div
        ref={drawerRef}
        className="connector-sftp-manage-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <div className="connector-sftp-manage-drawer-head">
          <h2 id={titleId} className="filter-heading">
            {title}
          </h2>
          <button
            ref={closeRef}
            type="button"
            className="connector-sftp-manage-drawer-close"
            aria-label={t('common.close')}
            onClick={closeAndRestoreFocus}
          >
            <X size={20} strokeWidth={2} aria-hidden />
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body
  );
}
