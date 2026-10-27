// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { X } from 'lucide-react';
import {
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  type RefObject,
  useCallback,
  useEffect,
  useId,
  useRef,
} from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';

import { useDialogFocusTrap } from '../../../lib/useDialogFocusTrap';
import { getOverlayPortalRoot } from './overlayPortal';

const SWIPE_CLOSE_PX = 72;

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  className?: string;
  id?: string;
  testId?: string;
  returnFocusRef?: RefObject<HTMLElement | null>;
  children: ReactNode;
}

export function BottomSheet({
  open,
  onClose,
  title,
  className,
  id,
  testId,
  returnFocusRef,
  children,
}: BottomSheetProps) {
  const { t } = useTranslation();
  const generatedId = useId();
  const titleId = `${id ?? generatedId}-title`;
  const sheetRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const dragStartY = useRef<number | null>(null);

  useDialogFocusTrap(sheetRef, open, closeRef);

  const closeAndRestoreFocus = useCallback(() => {
    onClose();
    requestAnimationFrame(() => {
      returnFocusRef?.current?.focus();
    });
  }, [onClose, returnFocusRef]);

  useEffect(() => {
    if (!open) {
      return;
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        closeAndRestoreFocus();
      }
    }
    document.addEventListener('keydown', onKeyDown, true);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown, true);
      document.body.style.overflow = prev;
    };
  }, [open, closeAndRestoreFocus]);

  const onHandlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    dragStartY.current = event.clientY;
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onHandlePointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    const start = dragStartY.current;
    dragStartY.current = null;
    if (start == null) {
      return;
    }
    if (event.clientY - start >= SWIPE_CLOSE_PX) {
      closeAndRestoreFocus();
    }
  };

  if (!open) {
    return null;
  }

  const panelClass = className
    ? `bottom-sheet-panel ${className}`
    : 'bottom-sheet-panel';

  return createPortal(
    <div className="bottom-sheet-root">
      <button
        type="button"
        className="bottom-sheet-backdrop"
        aria-label={t('common.close')}
        onClick={closeAndRestoreFocus}
      />
      <div
        ref={sheetRef}
        id={id}
        className={panelClass}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        data-testid={testId}
      >
        <div
          className="bottom-sheet-handle"
          aria-hidden="true"
          onPointerDown={onHandlePointerDown}
          onPointerUp={onHandlePointerUp}
        />
        <div className="bottom-sheet-head">
          <h2 id={titleId} className="bottom-sheet-title">
            {title}
          </h2>
          <button
            ref={closeRef}
            type="button"
            className="bottom-sheet-close"
            aria-label={t('common.close')}
            onClick={closeAndRestoreFocus}
          >
            <X size={20} strokeWidth={2} aria-hidden />
          </button>
        </div>
        <div className="bottom-sheet-body">{children}</div>
      </div>
    </div>,
    getOverlayPortalRoot('drawer')
  );
}
