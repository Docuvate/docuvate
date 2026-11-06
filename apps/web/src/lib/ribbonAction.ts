// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

/**
 * One visual hierarchy for every control in the contextual ribbon:
 * - `primary`: the one thing this screen is for (filled accent). At most one per screen.
 * - `secondary`: an important alternative or next step (raised, bordered).
 * - `tertiary`: everything else, including menus such as export or saved views (quiet until hover).
 * Menus add `menu` (and only menus show a chevron); navigation uses `ribbon-link`, mutually exclusive
 * views use a segmented control.
 */
type RibbonTier = 'primary' | 'secondary' | 'tertiary';

const BUTTON_VARIANT: Record<RibbonTier, string> = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  tertiary: 'btn-ghost',
};

export function ribbonActionClass(
  tier: RibbonTier,
  options: { menu?: boolean; className?: string } = {}
): string {
  return [
    'btn',
    'btn-sm',
    BUTTON_VARIANT[tier],
    'ribbon-action',
    `ribbon-action--${tier}`,
    options.menu ? 'ribbon-action--menu' : '',
    options.className ?? '',
  ]
    .filter(Boolean)
    .join(' ');
}
