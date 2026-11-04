// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
/** Inset shell + nav-matched active fill (see app.css `.segmented-control--shell`). */
const SEGMENTED_SHELL = 'segmented-control--shell';

/** Theme, locale, library view switcher. */
const SEGMENTED_PREFERENCE_SHELL = `${SEGMENTED_SHELL} segmented-control--preference`;

/** Document layout toolbar segments (viewer mode, zoom, compare). */
const SEGMENTED_TOOLBAR_SHELL = `${SEGMENTED_SHELL} segmented-control--toolbar`;

export function segmentedPreferenceClass(...modifiers: string[]): string {
  return [SEGMENTED_PREFERENCE_SHELL, ...modifiers.filter(Boolean)].join(' ');
}

export function segmentedToolbarClass(...modifiers: string[]): string {
  return [SEGMENTED_TOOLBAR_SHELL, ...modifiers.filter(Boolean)].join(' ');
}
