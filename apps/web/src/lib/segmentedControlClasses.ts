/** Shared segmented styling for theme, locale, and library view (keep in sync). */
export const SEGMENTED_PREFERENCE_SHELL = 'segmented-control--shell segmented-control--preference';

export function segmentedPreferenceClass(...modifiers: string[]): string {
  return [SEGMENTED_PREFERENCE_SHELL, ...modifiers.filter(Boolean)].join(' ');
}
