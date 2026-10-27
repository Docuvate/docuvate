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
/** Keep floating surfaces below the sticky app header (`--app-topbar-height` + slack). */
const HEADER_COLLISION_PADDING_PX = 64;

const COLLISION_PADDING = {
  top: HEADER_COLLISION_PADDING_PX,
  right: VIEWPORT_PADDING_PX,
  bottom: VIEWPORT_PADDING_PX,
  left: VIEWPORT_PADDING_PX,
};

export interface UseAnchoredOverlayOptions {
  open: boolean;
  placement?: Placement;
  /** When true, floating width matches the reference width. */
  matchReferenceWidth?: boolean;
  /** Cap list height (rem); viewport collision still applies via `size` middleware. */
  maxHeightPx?: number;
  /** When false, the overlay stays on the requested placement and shrinks instead of flipping. */
  flipEnabled?: boolean;
}

export function useAnchoredOverlay({
  open,
  placement = 'bottom-start',
  matchReferenceWidth = false,
  maxHeightPx,
  flipEnabled = true,
}: UseAnchoredOverlayOptions) {
  const middleware = useMemo(
    () => [
      offset(DEFAULT_OFFSET_PX),
      ...(flipEnabled ? [flip({ padding: COLLISION_PADDING })] : []),
      shift({ padding: COLLISION_PADDING }),
      size({
        padding: COLLISION_PADDING,
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
    [flipEnabled, matchReferenceWidth, maxHeightPx]
  );

  return useFloating({
    open,
    placement,
    whileElementsMounted: autoUpdate,
    middleware,
  });
}
