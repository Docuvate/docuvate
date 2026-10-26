// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { FloatingPortal } from '@floating-ui/react';
import {
  type CSSProperties,
  type ReactNode,
  type RefObject,
  useEffect,
  useId,
  useLayoutEffect,
} from 'react';

import { getOverlayPortalRoot, type OverlayPortalLayer } from './overlayPortal';
import { useAnchoredOverlay,type UseAnchoredOverlayOptions } from './useAnchoredOverlay';

export interface PopoverProps extends UseAnchoredOverlayOptions {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  referenceRef: RefObject<HTMLElement | null>;
  returnFocusRef?: RefObject<HTMLElement | null>;
  portalLayer?: OverlayPortalLayer;
  className?: string;
  style?: CSSProperties;
  role?: string;
  id?: string;
  'aria-label'?: string;
  children: ReactNode;
  onEscape?: () => void;
}

export function Popover({
  open,
  onOpenChange,
  referenceRef,
  returnFocusRef,
  portalLayer = 'popover',
  className,
  style,
  role,
  id,
  'aria-label': ariaLabel,
  children,
  onEscape,
  placement,
  matchReferenceWidth,
  maxHeightPx,
}: PopoverProps) {
  const generatedId = useId();
  const panelId = id ?? generatedId;
  const { refs, floatingStyles, placement: resolvedPlacement } = useAnchoredOverlay({
    open,
    placement,
    matchReferenceWidth,
    maxHeightPx,
  });

  useLayoutEffect(() => {
    if (!open) {
      return;
    }
    const reference = referenceRef.current;
    if (reference) {
      refs.setReference(reference);
    }
  }, [open, referenceRef, refs]);

  useEffect(() => {
    if (!open) {
      return;
    }
    function onPointerDown(event: MouseEvent) {
      const target = event.target;
      if (!(target instanceof Node)) {
        return;
      }
      const reference = referenceRef.current;
      const floating = refs.floating.current;
      if (reference?.contains(target) || floating?.contains(target)) {
        return;
      }
      onOpenChange(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        onEscape?.();
        onOpenChange(false);
        const focusTarget = returnFocusRef?.current ?? referenceRef.current;
        focusTarget?.focus();
      }
    }
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown, true);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown, true);
    };
  }, [open, onEscape, onOpenChange, referenceRef, refs.floating, returnFocusRef]);

  if (!open) {
    return null;
  }

  const mergedStyle: CSSProperties = {
    ...floatingStyles,
    ...style,
  };

  return (
    <FloatingPortal root={getOverlayPortalRoot(portalLayer)}>
      <div
        ref={(node) => { refs.setFloating(node); }}
        id={panelId}
        className={className}
        style={mergedStyle}
        role={role}
        aria-label={ariaLabel}
        data-floating-placement={resolvedPlacement}
      >
        {children}
      </div>
    </FloatingPortal>
  );
}
