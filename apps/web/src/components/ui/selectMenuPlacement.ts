// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
export const SELECT_MENU_GAP_PX = 2;
export const SELECT_MENU_MAX_HEIGHT_PX = 240;
export const SELECT_MENU_MAX_OPTIONS_WITHOUT_SCROLL = 10;
/** Estimated row height including padding (matches `.custom-select-option`). */
export const SELECT_MENU_ITEM_ESTIMATE_PX = 38;
export const SELECT_MENU_CHROME_PX = 16;

export interface SelectMenuPlacementInput {
  triggerRect: DOMRect;
  measuredMenuHeight: number;
  optionCount: number;
  viewportHeight: number;
}

export interface SelectMenuPlacement {
  top: number;
  left: number;
  width: number;
  maxHeight: number | undefined;
  openUp: boolean;
  scrollable: boolean;
}

export function estimateSelectMenuContentHeight(optionCount: number): number {
  return SELECT_MENU_CHROME_PX + optionCount * SELECT_MENU_ITEM_ESTIMATE_PX;
}

export function computeSelectMenuPlacement(input: SelectMenuPlacementInput): SelectMenuPlacement {
  const { triggerRect, measuredMenuHeight, optionCount, viewportHeight } = input;
  const estimatedHeight = estimateSelectMenuContentHeight(optionCount);
  const contentHeight =
    optionCount <= SELECT_MENU_MAX_OPTIONS_WITHOUT_SCROLL
      ? estimatedHeight
      : Math.max(measuredMenuHeight, estimatedHeight);
  const spaceBelow = viewportHeight - triggerRect.bottom - SELECT_MENU_GAP_PX;
  const spaceAbove = triggerRect.top - SELECT_MENU_GAP_PX;
  const openUp = contentHeight > spaceBelow && spaceAbove > spaceBelow;
  const available = Math.max(0, openUp ? spaceAbove : spaceBelow);

  const shortList = optionCount <= SELECT_MENU_MAX_OPTIONS_WITHOUT_SCROLL;
  const fitsInViewport = contentHeight <= available;

  let maxHeight: number | undefined;
  let scrollable = false;

  if (shortList && fitsInViewport) {
    maxHeight = undefined;
    scrollable = false;
  } else if (contentHeight <= available) {
    maxHeight = contentHeight;
    scrollable = false;
  } else {
    maxHeight = Math.min(
      SELECT_MENU_MAX_HEIGHT_PX,
      Math.max(SELECT_MENU_ITEM_ESTIMATE_PX, available)
    );
    scrollable = contentHeight > maxHeight;
  }

  const layoutHeight = scrollable && maxHeight !== undefined ? maxHeight : contentHeight;

  let top = openUp
    ? triggerRect.top - SELECT_MENU_GAP_PX - layoutHeight
    : triggerRect.bottom + SELECT_MENU_GAP_PX;
  if (openUp && top < SELECT_MENU_GAP_PX) {
    top = SELECT_MENU_GAP_PX;
  }

  return {
    top,
    left: triggerRect.left,
    width: triggerRect.width,
    maxHeight,
    openUp,
    scrollable,
  };
}

/** Portal target: open dialog when trigger is inside one, else document body. */
export function resolveSelectMenuPortalRoot(trigger: HTMLElement): HTMLElement {
  const dialog = trigger.closest('dialog');
  if (dialog instanceof HTMLDialogElement && dialog.open) {
    return dialog;
  }
  return document.body;
}
