// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
/**
 * Usage guidelines rendered by the catalog. Developer-facing documentation (English);
 * product copy stays in apps/web i18n.
 */

export interface DesignPrinciple {
  readonly title: string;
  readonly body: string;
}

export const DESIGN_PRINCIPLES: readonly DesignPrinciple[] = [
  {
    title: 'Calm surfaces, one accent',
    body: 'Warm stone neutrals carry the layout; vermilion (#d9480f) marks the single primary action, the active place and focus. Never use the accent for decoration.',
  },
  {
    title: 'Hierarchy through type and space, not boxes',
    body: 'One h1 per page, then section titles. Separate groups with the spacing scale before reaching for borders, cards or colour.',
  },
  {
    title: 'Stable layouts',
    body: 'Hover, focus, selected, loading and error states never change an element’s size or position. Reserve space for async content.',
  },
  {
    title: 'Accessible by default',
    body: 'WCAG AA contrast (enforced by token tests), a visible 2px focus ring on every control, 44px touch targets below 768px and full reduced-motion support.',
  },
  {
    title: 'Tokens are the API',
    body: 'Styles reference --dv-* tokens only. New values are added to packages/tokens with a reason, never inlined in a component.',
  },
];

export interface ComponentGuideline {
  readonly id: string;
  readonly name: string;
  readonly source: string;
  readonly whenToUse: string;
  readonly states: readonly string[];
  readonly dos: readonly string[];
  readonly donts: readonly string[];
}

export const COMPONENT_GUIDELINES: readonly ComponentGuideline[] = [
  {
    id: 'button',
    name: 'Button',
    source: 'components/ui/Button.tsx',
    whenToUse:
      'Actions that change data or open a flow. Primary for the one main action per view, secondary for alternatives, ghost for low-emphasis toolbar actions, danger only for destructive confirmations.',
    states: [
      'default',
      'hover',
      'focus-visible',
      'disabled (opacity token, same size)',
      'loading (spinner, aria-busy)',
    ],
    dos: [
      'Use one primary button per page region.',
      'Use verbs: “Speichern”, “Label anlegen”.',
      'Use size="sm" only in dense desktop tables and toolbars.',
    ],
    donts: [
      'Do not style links as primary buttons for navigation inside text.',
      'Do not change button width when it starts loading.',
    ],
  },
  {
    id: 'input',
    name: 'Input, Select, SearchField',
    source: 'components/ui/Input.tsx · Select.tsx · SearchField.tsx',
    whenToUse:
      'Single-value entry. Always pair with a visible label (FormField) unless it is a search field with an accessible name.',
    states: [
      'default',
      'hover (strong border)',
      'focus-visible (focus ring)',
      'invalid (danger border + hint)',
      'disabled',
    ],
    dos: [
      'Put help text below the control (FormField help).',
      'Keep the default control height for all inputs in one row.',
    ],
    donts: [
      'Do not use placeholder text as the label.',
      'Do not mix control heights in one toolbar.',
    ],
  },
  {
    id: 'page-header',
    name: 'PageHeader',
    source: 'components/ui/PageHeader.tsx',
    whenToUse: 'Top of every routed page: title (h1), one-sentence lead and page-level actions.',
    states: [
      'title only',
      'title + lead',
      'title + lead + actions (wrap under the title on narrow screens)',
    ],
    dos: ['Keep the lead to one sentence.', 'Put the primary action last in the actions slot.'],
    donts: [
      'Do not add a second h1 or nest PageHeader inside cards.',
      'Do not place filters in the header; use a Toolbar below it.',
    ],
  },
  {
    id: 'card',
    name: 'Card & CardHeader',
    source: 'components/ui/Card.tsx',
    whenToUse:
      'Group related content that belongs together and can be scanned independently (settings section, dashboard widget).',
    states: ['raised (default, elevation 1)', 'outlined (flat)', 'muted (inset section)'],
    dos: [
      'Use CardHeader for title, lead and trailing actions.',
      'Pick padding from the scale (sm / md / lg).',
    ],
    donts: [
      'Do not nest raised cards inside raised cards.',
      'Do not use cards for single lines of text; use InlineStatus or plain text.',
    ],
  },
  {
    id: 'toolbar',
    name: 'Toolbar & ToolGroup',
    source: 'components/ui/Toolbar.tsx',
    whenToUse:
      'A row of controls acting on the content below: search, filters, view switchers, bulk actions.',
    states: [
      'wrapping (default)',
      'nowrap with horizontal scroll',
      'attached groups (segmented look)',
    ],
    dos: [
      'Group related controls; groups are separated by --dv-space-md.',
      'Give standalone toolbars an aria-label.',
    ],
    donts: [
      'Do not mix button sizes inside a group.',
      'Do not hide the only way to an action behind an overflow menu on desktop.',
    ],
  },
  {
    id: 'tabs',
    name: 'Tabs',
    source: 'components/ui/Tab.tsx',
    whenToUse:
      'Switch between sibling views of the same object (document details, settings sections).',
    states: ['default', 'hover', 'active (accent underline)', 'focus-visible (inset ring)'],
    dos: ['Keep labels short nouns.', 'Use links (settings tabs) when each tab is a route.'],
    donts: ['Do not use tabs for sequential steps; use the review wizard pattern.'],
  },
  {
    id: 'badge',
    name: 'Badge, ToneBadge & Chip',
    source: 'components/ui/Badge.tsx · ToneBadge.tsx · Chip.tsx',
    whenToUse:
      'Badge = document processing status. ToneBadge = other system states and counts. Chip = user-defined labels with their own colour.',
    states: ['neutral', 'accent', 'success', 'warn', 'danger', 'info'],
    dos: ['Keep badge text to one or two words.', 'Let Chip compute its foreground for contrast.'],
    donts: ['Do not use pill radii.', 'Do not use status colours for user labels.'],
  },
  {
    id: 'feedback',
    name: 'Feedback: InlineStatus, Banner, EmptyState, Toast',
    source: 'components/ui/InlineStatus.tsx · Banner.tsx · EmptyState.tsx · save/ToastProvider.tsx',
    whenToUse:
      'InlineStatus for a section’s loading / empty / error line; Banner for page-level notices with one action; EmptyState for a whole empty view; Toast for confirmation after an action.',
    states: [
      'loading (spinner, aria-busy)',
      'neutral / empty',
      'success',
      'warn',
      'error (role="alert")',
    ],
    dos: ['Say what happened and what to do next.', 'Offer a retry action for recoverable errors.'],
    donts: [
      'Do not stack several banners; merge them.',
      'Do not use toasts for errors that need action.',
    ],
  },
  {
    id: 'table',
    name: 'Tables & lists',
    source: 'library/LibraryDocumentTable.tsx · labels/LabelsVocabularyTable.tsx',
    whenToUse:
      'Scannable collections with comparable attributes. Lists of cards only when items are heterogeneous.',
    states: ['row hover', 'row selected (accent-soft)', 'loading skeleton rows', 'empty state'],
    dos: [
      'Left-align text, right-align numbers.',
      'Keep row height constant; truncate with a tooltip.',
    ],
    donts: ['Do not put more than two actions inline per row; use the overflow menu.'],
  },
  {
    id: 'dialog',
    name: 'Dialog & ConfirmDialog',
    source: 'components/ui/Dialog.tsx · ConfirmDialog.tsx · AlertDialog.tsx',
    whenToUse:
      'Short, focused tasks that block the page (rename, confirm delete). Drawers / sheets for longer side tasks on mobile.',
    states: [
      'open (focus trapped, Escape closes)',
      'busy (primary button loading)',
      'error inside the dialog',
    ],
    dos: ['All dialogs share --dv-layout-dialog-width.', 'Put the primary action on the right.'],
    donts: ['Do not open a dialog from a dialog.', 'Do not use dialogs for success messages.'],
  },
];

export const GOVERNANCE_RULES: readonly string[] = [
  'Source of truth: packages/tokens/tokens/*.json. dist/ is generated (CSS, TS, Dart) and never edited by hand.',
  'The colour palette is frozen in packages/tokens/governance/color-freeze.json; a colour change needs a deliberate update of that file and design sign-off in the same PR.',
  'Primitive scales (space, radius, font.size, shadow, duration, z) must not contain duplicate values. Share a value with an alias such as {space.md}.',
  'Semantic tokens (type.*, elevation.*, radius.control, control.*, layout.*) reference primitives; components use semantic tokens first.',
  'apps/web runs check-design-tokens: undefined var(--…) fails, and raw font sizes, radii, shadows, timings and rgb() colours can only decrease (ratchet baseline).',
  'Contrast pairs are verified by packages/tokens contrast tests (WCAG AA, 4.5:1 text, 3:1 UI).',
  'New components live in apps/web/src/components/ui, are listed here with when-to-use, states and do/don’t, and get a Vitest spec.',
];
