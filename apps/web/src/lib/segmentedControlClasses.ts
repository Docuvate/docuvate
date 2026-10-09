// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
/** Shared segmented styling for theme, locale, and library view (keep in sync). */
export const SEGMENTED_PREFERENCE_SHELL = 'segmented-control--shell segmented-control--preference';

export function segmentedPreferenceClass(...modifiers: string[]): string {
  return [SEGMENTED_PREFERENCE_SHELL, ...modifiers.filter(Boolean)].join(' ');
}
