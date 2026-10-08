import { useCallback, useEffect, useRef, type ReactNode, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useDialogFocusTrap } from '../../lib/useDialogFocusTrap';

interface LibraryFilterDrawerProps {
  open: boolean;
  onClose: () => void;
  returnFocusRef?: RefObject<HTMLElement>;
  children: ReactNode;
}

export function LibraryFilterDrawer({
  open,
  onClose,
  returnFocusRef,
  children,
}: LibraryFilterDrawerProps) {
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
    <div className="library-filter-drawer-root">
      <button
        type="button"
        className="library-filter-drawer-backdrop"
        aria-label={t('common.close')}
        onClick={closeAndRestoreFocus}
      />
      <div
        ref={drawerRef}
        className="library-filter-drawer"
        role="dialog"
        aria-modal="true"
        aria-label={t('library.filter.panelAria')}
      >
        <div className="library-filter-drawer-head">
          <h2 className="filter-heading">{t('library.filter.title')}</h2>
          <button
            ref={closeRef}
            type="button"
            className="library-filter-drawer-close"
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
