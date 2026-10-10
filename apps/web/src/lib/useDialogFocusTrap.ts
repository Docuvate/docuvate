// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { type RefObject,useEffect } from 'react';

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function useDialogFocusTrap(
  containerRef: RefObject<HTMLElement | null>,
  open: boolean,
  initialFocusRef?: RefObject<HTMLElement | null>
): void {
  useEffect(() => {
    if (!open) return;
    const container = containerRef.current;
    if (!container) return;

    const previouslyFocused =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const focusInitial = () => {
      if (initialFocusRef?.current) {
        initialFocusRef.current.focus();
        return;
      }
      const nodes = container.querySelectorAll<HTMLElement>(FOCUSABLE);
      const cancelLike = [...nodes].find((el) => el.dataset.dialogInitialFocus === 'cancel');
      (cancelLike ?? nodes[0]).focus();
    };

    const raf = requestAnimationFrame(focusInitial);

    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Tab' || !container) return;
      const nodes = container.querySelectorAll<HTMLElement>(FOCUSABLE);
      if (nodes.length === 0) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (event.shiftKey) {
        if (document.activeElement === first) {
          event.preventDefault();
          last.focus();
        }
      } else if (document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    container.addEventListener('keydown', onKeyDown);
    return () => {
      cancelAnimationFrame(raf);
      container.removeEventListener('keydown', onKeyDown);
      previouslyFocused?.focus();
    };
  }, [containerRef, open, initialFocusRef]);
}
