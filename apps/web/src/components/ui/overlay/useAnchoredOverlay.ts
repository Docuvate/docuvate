// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import {
  autoUpdate,
  flip,
  offset,
  type Placement,
  shift,
  size,
  useFloating,
} from '@floating-ui/react';
import { useMemo } from 'react';

const VIEWPORT_PADDING_PX = 8;
const DEFAULT_OFFSET_PX = 4;

export interface UseAnchoredOverlayOptions {
  open: boolean;
  placement?: Placement;
  /** When true, floating width matches the reference width. */
  matchReferenceWidth?: boolean;
  /** Cap list height (rem); viewport collision still applies via `size` middleware. */
  maxHeightPx?: number;
}

export function useAnchoredOverlay({
  open,
  placement = 'bottom-start',
  matchReferenceWidth = false,
  maxHeightPx,
}: UseAnchoredOverlayOptions) {
  const middleware = useMemo(
    () => [
      offset(DEFAULT_OFFSET_PX),
      flip({ padding: VIEWPORT_PADDING_PX }),
      shift({ padding: VIEWPORT_PADDING_PX }),
      size({
        padding: VIEWPORT_PADDING_PX,
        apply({ availableHeight, rects, elements }) {
          const cap =
            maxHeightPx !== undefined
              ? Math.min(maxHeightPx, availableHeight)
              : availableHeight;
          const nextMax = Math.max(0, Math.floor(cap));
          Object.assign(elements.floating.style, {
            maxHeight: `${String(nextMax)}px`,
            overflowY: nextMax > 0 ? 'auto' : 'hidden',
            ...(matchReferenceWidth ? { width: `${String(Math.round(rects.reference.width))}px` } : {}),
          });
        },
      }),
    ],
    [matchReferenceWidth, maxHeightPx]
  );

  return useFloating({
    open,
    placement,
    whileElementsMounted: autoUpdate,
    middleware,
  });
}
