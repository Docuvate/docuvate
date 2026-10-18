#!/usr/bin/env node
/** Defaults panel chevron: right when closed, down when open; no transform clip; inside summary. */
import { chromium } from 'playwright';

const BASE = process.env.WEB_BASE ?? 'http://localhost:5173';
const EMAIL = process.env.SEED_EMAIL ?? 'labels-screenshots@docuvate.local';
const PASSWORD = process.env.SEED_PASSWORD ?? 'LabelsScreenshot1!';

async function login(page) {
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
  await page.locator('input[type="email"]').fill(EMAIL);
  await page.locator('input[type="password"]').fill(PASSWORD);
  await page.locator('button[type="submit"]').click();
  await page.waitForFunction(() => window.location.pathname.includes('/documents'), null, {
    timeout: 30_000,
  });
}

async function setPanelOpen(page, open) {
  await page.goto(`${BASE}/structure/recognized-fields`, { waitUntil: 'networkidle' });
  await page.locator('.recognized-fields-defaults-panel').evaluate((el, wantOpen) => {
    if (el instanceof HTMLDetailsElement) {
      el.open = wantOpen;
    }
  }, open);
  await page.waitForFunction(
    (wantOpen) => {
      const el = document.querySelector('.recognized-fields-defaults-panel');
      return el instanceof HTMLDetailsElement && el.open === wantOpen;
    },
    open,
    { timeout: 5000 }
  );
}

async function measureChevron(page, label) {
  const metrics = await page.evaluate(() => {
    const summary = document.querySelector('.recognized-fields-defaults-summary');
    const chevron = document.querySelector('.recognized-fields-defaults-chevron');
    const visibleSvg = chevron?.querySelector(
      '.recognized-fields-defaults-chevron-icon:not([style*="display: none"])'
    );
    const closedIcon = chevron?.querySelector('.recognized-fields-defaults-chevron-icon--closed');
    const openIcon = chevron?.querySelector('.recognized-fields-defaults-chevron-icon--open');
    const isOpen = document.querySelector('details.recognized-fields-defaults-panel')?.hasAttribute('open');
    const activeSvg =
      isOpen && openIcon && getComputedStyle(openIcon).display !== 'none'
        ? openIcon
        : closedIcon && getComputedStyle(closedIcon).display !== 'none'
          ? closedIcon
          : visibleSvg;
    if (!summary || !chevron || !activeSvg) {
      return null;
    }
    const summaryRect = summary.getBoundingClientRect();
    const chevronRect = chevron.getBoundingClientRect();
    const svgRect = activeSvg.getBoundingClientRect();
    const transform = getComputedStyle(activeSvg).transform;
    return {
      panelOpen: isOpen,
      transform,
      chevronInsideSummary:
        chevronRect.top >= summaryRect.top - 1 &&
        chevronRect.bottom <= summaryRect.bottom + 1 &&
        chevronRect.left >= summaryRect.left - 1 &&
        chevronRect.right <= summaryRect.right + 1,
      svgInsideChevron:
        svgRect.width > 0 &&
        svgRect.height > 0 &&
        svgRect.left >= chevronRect.left - 1 &&
        svgRect.right <= chevronRect.right + 1 &&
        svgRect.top >= chevronRect.top - 1 &&
        svgRect.bottom <= chevronRect.bottom + 1,
      closedVisible: closedIcon ? getComputedStyle(closedIcon).display !== 'none' : false,
      openVisible: openIcon ? getComputedStyle(openIcon).display !== 'none' : false,
      iconClass: activeSvg.getAttribute('class') ?? '',
    };
  });

  if (!metrics) {
    throw new Error(`Could not measure chevron (${label})`);
  }
  console.log(label, JSON.stringify(metrics));

  if (metrics.transform !== 'none') {
    throw new Error(`${label}: expected transform none, got ${metrics.transform}`);
  }
  if (!metrics.chevronInsideSummary || !metrics.svgInsideChevron) {
    throw new Error(`${label}: chevron or icon clipped outside summary/chevron box`);
  }

  return metrics;
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ locale: 'de-DE', viewport: { width: 1440, height: 900 } });
  await context.addInitScript(() => {
    localStorage.setItem('i18nextLng', 'de');
    document.documentElement.setAttribute('data-docuvate-theme', 'light');
  });
  const page = await context.newPage();
  await login(page);

  await setPanelOpen(page, false);
  const closed = await measureChevron(page, 'closed');
  if (closed.panelOpen || closed.openVisible || !closed.closedVisible) {
    throw new Error('closed: expected ChevronRight visible, panel closed');
  }
  if (!closed.iconClass.includes('--closed')) {
    throw new Error('closed: wrong icon visible');
  }

  await setPanelOpen(page, true);
  const open = await measureChevron(page, 'open');
  if (!open.panelOpen || !open.openVisible || open.closedVisible) {
    throw new Error('open: expected ChevronDown visible, panel open');
  }
  if (!open.iconClass.includes('--open')) {
    throw new Error('open: wrong icon visible');
  }

  await context.close();
  await browser.close();
  console.log('VERIFY OK');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
