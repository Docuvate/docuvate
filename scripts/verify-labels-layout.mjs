#!/usr/bin/env node
/**
 * Playwright layout assertions for Labels page (Compose web @ localhost:5173).
 * Prints measured px values for review report.
 */
import { chromium } from 'playwright';

const BASE = process.env.WEB_BASE ?? 'http://localhost:5173';
const EMAIL = process.env.SEED_EMAIL ?? 'labels-screenshots@docuvate.local';
const PASSWORD = process.env.SEED_PASSWORD ?? 'LabelsScreenshot1!';
const EXPECT_SHA = process.env.EXPECT_GIT_SHA ?? '';

async function login(page) {
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
  await page.locator('input[type="email"]').fill(EMAIL);
  await page.locator('input[type="password"]').fill(PASSWORD);
  await page.locator('button[type="submit"]').click();
  await page.waitForFunction(() => window.location.pathname.includes('/documents'), null, {
    timeout: 30_000,
  });
  await page.getByRole('button', { name: 'Deutsch' }).click({ timeout: 5000 }).catch(() => undefined);
}

function px(n) {
  return `${Math.round(n)}px`;
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await login(page);
  await page.goto(`${BASE}/structure/labels`, { waitUntil: 'networkidle' });
  await page.waitForSelector('.labels-coverage-block', { timeout: 20_000 });

  const bundle = await page.evaluate(() => {
    const script = document.querySelector('script[type="module"][src*="assets/index"]');
    const sha = window.__DOCUVATE_BUILD_SHA__ ?? 'unknown';
    return { src: script?.getAttribute('src') ?? 'unknown', sha };
  });
  console.log('web_bundle:', bundle.src);
  console.log('web_build_sha:', bundle.sha);
  if (EXPECT_SHA && bundle.sha !== EXPECT_SHA) {
    console.error(`BUILD SHA mismatch: expected ${EXPECT_SHA} got ${bundle.sha}`);
    process.exit(1);
  }

  const metrics = await page.evaluate(() => {
    const coverageLine = document.querySelector('.labels-coverage-line');
    const progress = document.querySelector('.labels-coverage-progress');
    const todoPanel = document.querySelector('.labels-todo-panel');
    const rows = [...document.querySelectorAll('.labels-todo-row')];
    const actionsTh = document.querySelector('th.labels-vocabulary-col-actions');

    const lineStyle = coverageLine ? getComputedStyle(coverageLine) : null;
    const gapLine = lineStyle ? parseFloat(lineStyle.columnGap) : NaN;

    let progressToCard = NaN;
    if (progress && todoPanel) {
      progressToCard = todoPanel.getBoundingClientRect().top - progress.getBoundingClientRect().bottom;
    }

    let rowGap = NaN;
    const list = document.querySelector('ul.labels-todo-list');
    if (list) {
      rowGap = parseFloat(getComputedStyle(list).gap);
    }

    let rowSpacing = NaN;
    if (rows.length >= 2) {
      rowSpacing =
        rows[1].getBoundingClientRect().top - rows[0].getBoundingClientRect().bottom;
    }

    let thAlign = actionsTh ? getComputedStyle(actionsTh).textAlign : 'missing';

    return {
      coverageLineColumnGap: gapLine,
      progressBottomToTodoTop: progressToCard,
      todoListGap: rowGap,
      todoRowSpacing: rowSpacing,
      actionsHeaderTextAlign: thAlign,
    };
  });

  console.log('coverage_line_column_gap:', px(metrics.coverageLineColumnGap));
  console.log('progress_to_todo_card:', px(metrics.progressBottomToTodoTop));
  console.log('todo_list_computed_gap:', px(metrics.todoListGap));
  console.log('todo_row_bounding_gap:', px(metrics.todoRowSpacing));
  console.log('actions_th_text_align:', metrics.actionsHeaderTextAlign);

  const overflowBtn = page.locator('.labels-todo-row .labels-overflow-btn').first();
  await overflowBtn.click();
  await page.locator('.context-menu-root').waitFor({ state: 'visible' });

  const menuAlign = await page.evaluate(() => {
    const btn = document.querySelector('.labels-todo-row .labels-overflow-btn');
    const menu = document.querySelector('.context-menu-root');
    if (!btn || !menu) return null;
    const b = btn.getBoundingClientRect();
    const m = menu.getBoundingClientRect();
    return {
      anchorRight: b.right,
      menuRight: m.right,
      deltaRight: Math.abs(b.right - m.right),
      menuLeft: m.left,
      viewportWidth: window.innerWidth,
    };
  });
  console.log('menu_anchor_right:', px(menuAlign.anchorRight));
  console.log('menu_right:', px(menuAlign.menuRight));
  console.log('menu_right_delta:', px(menuAlign.deltaRight));
  console.log('menu_left:', px(menuAlign.menuLeft));

  const failures = [];
  if (Math.abs(metrics.coverageLineColumnGap - 16) > 2) {
    failures.push(`coverage line gap expected ~16px got ${metrics.coverageLineColumnGap}`);
  }
  if (Math.abs(metrics.progressBottomToTodoTop - 16) > 3) {
    failures.push(`progress→todo expected ~16px got ${metrics.progressBottomToTodoTop}`);
  }
  if (Math.abs(metrics.todoRowSpacing - 12) > 3 && Math.abs(metrics.todoListGap - 12) > 3) {
    failures.push(`todo gap expected ~12px row=${metrics.todoRowSpacing} list=${metrics.todoListGap}`);
  }
  if (metrics.actionsHeaderTextAlign !== 'right') {
    failures.push(`AKTIONEN header align expected right got ${metrics.actionsHeaderTextAlign}`);
  }
  if (menuAlign.deltaRight > 2) {
    failures.push(`menu not right-aligned to anchor (delta ${menuAlign.deltaRight}px)`);
  }

  await browser.close();

  if (failures.length) {
    console.error('VERIFY FAILED:');
    for (const f of failures) console.error(' -', f);
    process.exit(1);
  }
  console.log('VERIFY OK');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
