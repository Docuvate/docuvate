/** c1 vermilion CSS variable overrides for @docuvate/web marketing captures. */

export const MARKETING_C1_WEB_VARS = {
  light: {
    '--dv-color-accent': 'oklch(56% 0.19 38deg)',
    '--dv-color-accent-hover': 'oklch(50% 0.19 38deg)',
    '--dv-color-accent-soft': 'oklch(96% 0.035 38deg)',
    '--dv-color-on-accent': 'oklch(99% 0.01 85deg)',
    '--dv-color-focus': 'oklch(52% 0.19 38deg)',
    '--dv-color-header-bg': 'oklch(97% 0.012 85deg)',
    '--dv-color-header-fg': 'oklch(17% 0.012 85deg)',
    '--dv-color-header-border': 'oklch(17% 0.012 85deg / 12%)',
    '--dv-color-header-muted': 'oklch(43% 0.014 85deg)',
    '--dv-color-header-surface': 'oklch(99.5% 0.01 85deg)',
    '--dv-color-header-surface-fg': 'oklch(17% 0.012 85deg)',
    '--dv-color-header-control-bg': 'oklch(99.5% 0.01 85deg)',
    '--dv-color-header-control-fg': 'oklch(17% 0.012 85deg)',
    '--dv-color-header-control-border': 'oklch(17% 0.012 85deg / 14%)',
    '--dv-color-header-control-hover-bg': 'oklch(94% 0.012 85deg)',
    '--dv-color-header-control-active-bg': 'oklch(96% 0.035 38deg)',
    '--dv-color-header-control-active-fg': 'oklch(52% 0.19 38deg)',
    '--dv-color-header-input-bg': 'oklch(99.5% 0.01 85deg)',
    '--dv-color-header-input-border': 'oklch(17% 0.012 85deg / 14%)',
    '--dv-color-header-input-fg': 'oklch(17% 0.012 85deg)',
    '--dv-color-ok': 'oklch(52% 0.11 65deg)',
    '--dv-color-ok-soft': 'oklch(96% 0.03 85deg)',
    '--dv-color-overlay-tint': 'oklch(56% 0.19 38deg / 6%)',
  },
  dark: {
    '--dv-color-accent': 'oklch(68% 0.16 38deg)',
    '--dv-color-accent-hover': 'oklch(72% 0.15 38deg)',
    '--dv-color-accent-soft': 'oklch(28% 0.04 38deg)',
    '--dv-color-on-accent': 'oklch(17% 0.012 85deg)',
    '--dv-color-focus': 'oklch(68% 0.16 38deg)',
    '--dv-color-header-bg': 'oklch(24% 0.014 75deg)',
    '--dv-color-header-fg': 'oklch(96% 0.01 85deg)',
    '--dv-color-header-border': 'oklch(96% 0.01 85deg / 12%)',
    '--dv-color-header-muted': 'oklch(78% 0.012 85deg)',
    '--dv-color-header-surface': 'oklch(96% 0.01 85deg)',
    '--dv-color-header-surface-fg': 'oklch(24% 0.014 75deg)',
    '--dv-color-header-control-bg': 'oklch(28% 0.016 75deg)',
    '--dv-color-header-control-fg': 'oklch(96% 0.01 85deg)',
    '--dv-color-header-control-border': 'oklch(96% 0.01 85deg / 18%)',
    '--dv-color-header-control-hover-bg': 'oklch(32% 0.016 75deg)',
    '--dv-color-header-control-active-bg': 'oklch(28% 0.04 38deg)',
    '--dv-color-header-control-active-fg': 'oklch(72% 0.15 38deg)',
    '--dv-color-header-input-bg': 'oklch(28% 0.016 75deg)',
    '--dv-color-header-input-border': 'oklch(96% 0.01 85deg / 18%)',
    '--dv-color-header-input-fg': 'oklch(96% 0.01 85deg)',
    '--dv-color-ok': 'oklch(72% 0.12 65deg)',
    '--dv-color-ok-soft': 'oklch(28% 0.03 75deg)',
    '--dv-color-overlay-tint': 'oklch(68% 0.16 38deg / 8%)',
    '--dv-color-bg': 'oklch(19% 0.014 75deg)',
    '--dv-color-bg-raised': 'oklch(22% 0.014 75deg)',
    '--dv-color-bg-overlay': 'oklch(25% 0.014 75deg)',
    '--dv-color-text': 'oklch(96% 0.01 85deg)',
    '--dv-color-text-muted': 'oklch(78% 0.012 85deg)',
    '--dv-color-text-subtle': 'oklch(68% 0.012 85deg)',
    '--dv-color-border': 'oklch(96% 0.01 85deg / 14%)',
  },
};

const BLUE_HEX_PATTERN = /^(#2f3e8c|#253274|#3a4a96|#0f1628|rgb\(47,\s*62,\s*140)/i;

export const MARKETING_C1_STYLE_PATCH = `
  .app-topbar, header.app-topbar, .topbar {
    background: var(--dv-color-header-bg) !important;
    border-color: var(--dv-color-header-border) !important;
    color: var(--dv-color-header-fg) !important;
  }
  .app-topbar .brand-link,
  .app-topbar a.brand-link,
  .topbar .brand-link {
    color: var(--dv-color-header-fg) !important;
  }
  .btn-primary,
  .doc-chat-submit,
  button[type="submit"].btn-primary,
  .upload-section .btn-primary,
  .dateisystem-content-header .btn-primary {
    background: var(--dv-color-accent) !important;
    border-color: var(--dv-color-accent) !important;
    color: var(--dv-color-on-accent) !important;
  }
  .sidebar-link.active {
    background: var(--dv-color-accent-soft) !important;
    color: var(--dv-color-accent) !important;
  }
  .app-topbar .locale-switcher-btn.active {
    background: var(--dv-color-header-control-active-bg) !important;
    color: var(--dv-color-header-control-active-fg) !important;
  }
  a:not(.btn):not(.sidebar-link):not(.brand-link) {
    color: var(--dv-color-accent) !important;
  }
  .doc-chat-thread-item.active {
    background: var(--dv-color-accent-soft) !important;
    border-color: color-mix(in srgb, var(--dv-color-accent) 30%, var(--dv-color-border)) !important;
  }
  .doc-chat-empty-icon {
    color: var(--dv-color-accent) !important;
  }
  .user-account-menu-avatar {
    background: var(--dv-color-accent-soft) !important;
    color: var(--dv-color-accent) !important;
  }
  .topbar-search .btn-secondary {
    background: var(--dv-color-header-control-bg) !important;
    border-color: var(--dv-color-header-control-border) !important;
    color: var(--dv-color-header-control-fg) !important;
  }
  html[data-docuvate-theme='dark'] body,
  html[data-docuvate-theme='dark'] .page,
  html[data-docuvate-theme='dark'] .library-layout,
  html[data-docuvate-theme='dark'] .dateisystem-shell,
  html[data-docuvate-theme='dark'] .app-main {
    background: var(--dv-color-bg) !important;
    color: var(--dv-color-text) !important;
  }
  html[data-docuvate-theme='dark'] .card,
  html[data-docuvate-theme='dark'] .library-main .card {
    background: var(--dv-color-bg-raised) !important;
    border-color: var(--dv-color-border) !important;
  }
`;

export async function forceMarketingPrimaryButtons(page) {
  await page.evaluate(() => {
    for (const btn of document.querySelectorAll('.btn-primary, .doc-chat-submit')) {
      btn.style.setProperty('background', 'var(--dv-color-accent)', 'important');
      btn.style.setProperty('border-color', 'var(--dv-color-accent)', 'important');
      btn.style.setProperty('color', 'var(--dv-color-on-accent)', 'important');
    }
  });
}

export async function applyMarketingC1Theme(page, theme) {
  const vars = MARKETING_C1_WEB_VARS[theme === 'dark' ? 'dark' : 'light'];
  await page.evaluate(
    ({ v, patch }) => {
      for (const [key, value] of Object.entries(v)) {
        document.documentElement.style.setProperty(key, value);
      }
      let el = document.getElementById('marketing-c1-patch');
      if (!el) {
        el = document.createElement('style');
        el.id = 'marketing-c1-patch';
        document.head.appendChild(el);
      }
      el.textContent = patch;
    },
    { v: vars, patch: MARKETING_C1_STYLE_PATCH }
  );
  await forceMarketingPrimaryButtons(page);
}

export async function assertMarketingAccentNotBlue(page, label) {
  const samples = await page.evaluate(() => {
    const root = getComputedStyle(document.documentElement);
    const accent = root.getPropertyValue('--dv-color-accent').trim();
    const header = document.querySelector('.app-topbar, header.app-topbar, .topbar');
    const btn = document.querySelector('.btn-primary, .doc-chat-submit, button[type="submit"]');
    const headerBg = header ? getComputedStyle(header).backgroundColor : '';
    const btnBg = btn ? getComputedStyle(btn).backgroundColor : '';
    return { accent, headerBg, btnBg };
  });
  for (const [key, value] of Object.entries(samples)) {
    if (!value) continue;
    if (BLUE_HEX_PATTERN.test(value)) {
      throw new Error(`${label}: ${key} still blue (${value})`);
    }
  }
  if (samples.accent.includes('175deg') || samples.accent.includes('178deg')) {
    throw new Error(`${label}: accent hue looks teal (${samples.accent})`);
  }
  if (
    samples.headerBg.includes('47, 62, 140') ||
    samples.headerBg.includes('15, 22, 40') ||
    samples.headerBg.includes('15, 23, 42')
  ) {
    throw new Error(`${label}: topbar still old indigo (${samples.headerBg})`);
  }
}
