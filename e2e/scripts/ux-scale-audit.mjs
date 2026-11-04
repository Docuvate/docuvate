#!/usr/bin/env node
// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
/**
 * UX scale audit probe for the synthetic fixture from tools/ux-metrics/seed-scale.mjs.
 * Visits every page at four viewports, writes screenshots and a JSON metrics report.
 * Usage: node e2e/scripts/ux-scale-audit.mjs [outDir]
 */
import fs from 'node:fs/promises';
import path from 'node:path';

import { chromium } from '@playwright/test';

const WEB = process.env.E2E_WEB_URL ?? 'http://localhost:5173';
const API = process.env.E2E_API_URL ?? 'http://localhost:3001';
const EMAIL = process.env.UX_FIXTURE_EMAIL ?? 'ux.scale@fixture.docuvate.test';
const PASSWORD = process.env.UX_FIXTURE_PASSWORD ?? 'UxScaleFixture1!';
const OUT = path.resolve(process.argv[2] ?? 'ux-audit-out');
const VIEWPORTS = [
  { w: 1280, h: 720 },
  { w: 1366, h: 768 },
  { w: 1024, h: 640 },
  { w: 390, h: 844 },
];

/** Runs in the page: layout metrics that point at scale and small-screen problems. */
function collectMetrics() {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const doc = document.documentElement;
  const visible = (el) => {
    const r = el.getBoundingClientRect();
    const s = getComputedStyle(el);
    return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none';
  };
  const inScrollX = (el) => {
    for (let p = el.parentElement; p; p = p.parentElement) {
      const ox = getComputedStyle(p).overflowX;
      if (ox === 'auto' || ox === 'scroll' || ox === 'hidden' || ox === 'clip') return true;
    }
    return false;
  };
  const overflowing = [];
  for (const el of document.body.querySelectorAll('*')) {
    if (!visible(el)) continue;
    const r = el.getBoundingClientRect();
    if ((r.right > vw + 1 || r.left < -1) && !inScrollX(el)) {
      overflowing.push(
        `${el.tagName.toLowerCase()}.${String(el.className).split(' ').slice(0, 2).join('.')}`
      );
    }
  }
  const clippedButtons = [];
  for (const el of document.querySelectorAll(
    'button, a[href], [role="button"], input, select, textarea'
  )) {
    if (!visible(el)) continue;
    const r = el.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    if (cx < 0 || cx > vw || cy < 0) continue;
    if (cy > vh) continue;
    const hit = document.elementFromPoint(cx, cy);
    if (hit && !el.contains(hit) && !hit.contains(el)) {
      const name = (el.getAttribute('aria-label') ?? el.textContent ?? '').trim().slice(0, 40);
      clippedButtons.push(`${el.tagName.toLowerCase()}:${name}`);
    }
  }
  const smallTargets = [
    ...document.querySelectorAll('button, a[href], [role="button"], input[type="checkbox"]'),
  ]
    .filter(visible)
    .filter((el) => {
      const r = el.getBoundingClientRect();
      return r.width < 24 || r.height < 24;
    }).length;
  const unnamed = [...document.querySelectorAll('button, [role="button"]')]
    .filter(visible)
    .filter(
      (el) => !(el.getAttribute('aria-label') || el.textContent?.trim() || el.getAttribute('title'))
    ).length;
  return {
    docScrollWidth: doc.scrollWidth,
    vw,
    pageHeight: doc.scrollHeight,
    domNodes: document.getElementsByTagName('*').length,
    listItems: document.querySelectorAll('li, [role="option"], [role="row"], tr').length,
    checkboxes: document.querySelectorAll('input[type="checkbox"]').length,
    searchInputs: document.querySelectorAll(
      'input[type="search"], [role="combobox"], input[placeholder*="uch"]'
    ).length,
    overflowing: [...new Set(overflowing)].slice(0, 12),
    overflowCount: overflowing.length,
    occludedControls: [...new Set(clippedButtons)].slice(0, 12),
    smallTargets,
    unnamedButtons: unnamed,
    h1: document.querySelector('h1')?.textContent?.trim().slice(0, 60) ?? null,
    hasErrorText: /fehler|error|something went wrong/i.test(
      document.querySelector('main')?.textContent ?? ''
    ),
  };
}

async function main() {
  await fs.mkdir(OUT, { recursive: true });
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ locale: 'de-DE' });
  const login = await ctx.request.post(`${API}/api/auth/sign-in/email`, {
    headers: { origin: WEB },
    data: { email: EMAIL, password: PASSWORD },
  });
  if (!login.ok()) throw new Error(`login failed ${String(login.status())}`);
  const docs = await ctx.request.get(`${API}/v1/documents?limit=200`, { headers: { origin: WEB } });
  const body = await docs.json();
  const items = Array.isArray(body) ? body : (body.items ?? body.data ?? []);
  const real = items.find(
    (d) =>
      !String(d.storageKey ?? d.storage_key ?? '').startsWith('ux-fixture/') && d.status === 'ready'
  );
  const realId = real?.id ?? items[0]?.id;
  const manyLabels =
    items.find((d) => (d.tags?.length ?? d.labels?.length ?? 0) >= 8)?.id ?? items[1]?.id;
  const routes = [
    ['/', 'start'],
    ['/documents', 'documents'],
    ['/inbox', 'inbox'],
    ['/review', 'review'],
    ['/documents/duplicates', 'duplicates'],
    ['/documents/views', 'saved-views'],
    ['/filesystem', 'filesystem'],
    ['/structure/labels', 'labels'],
    ['/structure/recognized-fields', 'recognized-fields'],
    ['/settings', 'settings'],
    ['/settings/blocked-labels', 'blocked-labels'],
    ['/settings/connectors', 'connectors'],
    [`/documents/${String(realId)}`, 'document-ocr'],
    [`/documents/${String(manyLabels)}`, 'document-many-labels'],
  ];
  const report = [];
  for (const vp of VIEWPORTS) {
    const page = await ctx.newPage();
    await page.setViewportSize({ width: vp.w, height: vp.h });
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message.slice(0, 120)));
    page.on('response', (r) => {
      if (r.status() >= 500) errors.push(`${String(r.status())} ${new URL(r.url()).pathname}`);
    });
    for (const [route, slug] of routes) {
      errors.length = 0;
      const t0 = Date.now();
      await page.goto(`${WEB}${route}`);
      await page.waitForLoadState('networkidle', { timeout: 30_000 }).catch(() => undefined);
      await page.waitForTimeout(500);
      const loadMs = Date.now() - t0;
      const m = await page.evaluate(collectMetrics);
      const file = `${slug}-${String(vp.w)}x${String(vp.h)}.png`;
      await page.screenshot({ path: path.join(OUT, file) });
      report.push({
        slug,
        vp: `${String(vp.w)}x${String(vp.h)}`,
        loadMs,
        errors: [...errors],
        ...m,
      });
      console.log(
        slug,
        vp.w,
        `load=${String(loadMs)}`,
        `dom=${String(m.domNodes)}`,
        `rows=${String(m.listItems)}`,
        `cb=${String(m.checkboxes)}`,
        `ovf=${String(m.overflowCount)}`,
        `docW=${String(m.docScrollWidth)}`,
        `occl=${String(m.occludedControls.length)}`,
        `err=${String(errors.length)}`
      );
    }
    await page.close();
  }
  await fs.writeFile(path.join(OUT, 'report.json'), JSON.stringify(report, null, 2));
  await browser.close();
}

await main();
