// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
/** c1 vermilion accents for Scalar; backgrounds follow site tokens. */
export const SCALAR_ACCENT_LIGHT = '#cb3a00';
export const SCALAR_ACCENT_DARK = '#e96f49';

export function buildScalarCustomCss(extraCss = ''): string {
  return `
    .scalar-app {
      --scalar-font: var(--dv-font-family-sans);
      --scalar-font-code: var(--dv-font-family-mono);
      --scalar-radius: var(--dv-radius-md);
      --scalar-radius-lg: var(--dv-radius-lg);
      --scalar-radius-xl: var(--dv-radius-lg);
    }
    .scalar-app.light-mode {
      --scalar-background-1: var(--dv-color-bg-raised);
      --scalar-background-2: var(--dv-color-bg-overlay);
      --scalar-background-3: var(--dv-color-bg);
      --scalar-background-accent: color-mix(in srgb, ${SCALAR_ACCENT_LIGHT} 14%, transparent);
      --scalar-color-1: var(--dv-color-text);
      --scalar-color-2: var(--dv-color-text-muted);
      --scalar-color-3: var(--dv-color-text-subtle);
      --scalar-color-accent: ${SCALAR_ACCENT_LIGHT};
      --scalar-link-color: ${SCALAR_ACCENT_LIGHT};
      --scalar-link-color-hover: ${SCALAR_ACCENT_LIGHT};
      --scalar-border-color: var(--dv-color-border);
      --scalar-sidebar-color-active: ${SCALAR_ACCENT_LIGHT};
      --scalar-sidebar-item-hover-color: ${SCALAR_ACCENT_LIGHT};
      --scalar-sidebar-item-active-background: color-mix(in srgb, ${SCALAR_ACCENT_LIGHT} 10%, var(--dv-color-bg-raised));
      --scalar-color-blue: ${SCALAR_ACCENT_LIGHT};
    }
    .scalar-app.dark-mode {
      --scalar-background-1: var(--dv-color-bg);
      --scalar-background-2: var(--dv-color-bg-raised);
      --scalar-background-3: var(--dv-color-bg-overlay);
      --scalar-background-accent: color-mix(in srgb, ${SCALAR_ACCENT_DARK} 18%, transparent);
      --scalar-color-1: var(--dv-color-text);
      --scalar-color-2: var(--dv-color-text-muted);
      --scalar-color-3: var(--dv-color-text-subtle);
      --scalar-color-accent: ${SCALAR_ACCENT_DARK};
      --scalar-link-color: ${SCALAR_ACCENT_DARK};
      --scalar-link-color-hover: ${SCALAR_ACCENT_DARK};
      --scalar-border-color: var(--dv-color-border);
      --scalar-sidebar-color-active: ${SCALAR_ACCENT_DARK};
      --scalar-sidebar-item-hover-color: ${SCALAR_ACCENT_DARK};
      --scalar-sidebar-item-active-background: color-mix(in srgb, ${SCALAR_ACCENT_DARK} 12%, var(--dv-color-bg-raised));
      --scalar-color-blue: ${SCALAR_ACCENT_DARK};
    }
    .scalar-app .scalar-link,
    .scalar-app a.scalar-link,
    .scalar-app .download-button,
    .scalar-app .download-button a {
      color: var(--scalar-link-color, var(--scalar-color-accent)) !important;
    }
    .scalar-app a:not([class*='button']) {
      color: var(--scalar-link-color, var(--scalar-color-accent));
    }
    .scalar-app a:not([class*='button']):hover {
      color: var(--scalar-link-color-hover, var(--scalar-color-accent));
      filter: brightness(1.05);
    }
    ${extraCss}
  `;
}
