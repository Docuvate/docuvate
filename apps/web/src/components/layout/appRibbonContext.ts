// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { createContext, useContext } from 'react';

/** DOM node of the header's action slot; pages portal their ribbon groups into it. */
export const AppRibbonSlotContext = createContext<HTMLElement | null>(null);

/** Third ribbon row. Empty unless the current primary mode has tools. */
export const AppRibbonContextSlotContext = createContext<HTMLElement | null>(null);

export function useAppRibbonSlot(): HTMLElement | null {
  return useContext(AppRibbonSlotContext);
}

export function useAppRibbonContextSlot(): HTMLElement | null {
  return useContext(AppRibbonContextSlotContext);
}
