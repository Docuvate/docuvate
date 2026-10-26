import { expect, test } from '@playwright/test';
import crypto, { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

import { setTheme } from '../../helpers/ce-ui-audit';
import { smokeFixtureStoragePath } from '../../helpers/smoke-fixture-auth';

const webOrigin = process.env['E2E_WEB_URL'] ?? 'http://localhost:5173';
const apiBase = process.env['E2E_API_URL'] ?? 'http://localhost:3001';

const artifactRoot =
  process.env['WORKSTREAM_B_ARTIFACT_DIR'] ?? '/opt/cursor/artifacts/workstream-b-label-picker';

const tagFilterViewports = [
  { label: '1440x900', width: 1440, height: 900, useDrawer: false },
  { label: '1440x780', width: 1440, height: 780, useDrawer: false },
  { label: '1024x640', width: 1024, height: 640, useDrawer: true },
  { label: '390x620', width: 390, height: 620, useDrawer: true },
] as const;

const searchViewports = [
  { label: '1440', width: 1440, height: 900 },
  { label: '390', width: 390, height: 844 },
] as const;

const rowChipEllipsisViewports = [
  { label: '390', width: 390, height: 844 },
  { label: '1440', width: 1440, height: 900 },
] as const;

const rowChipEllipsisRoutes = [
  { path: '/documents', slug: 'documents' },
  { path: '/filesystem', slug: 'filesystem' },
] as const;

/** German compound-style names (each ≥ 60 characters). */
const WS_B_LONG_GERMAN_LABEL_STEMS = [
  'Bundesfinanzministeriumsverwaltungsarchivierungsbestimmungsdokumentenregisterführung',
  'VerkehrsinfrastrukturfinanzierungsgesellschaftsjahresabrechnungsunterlagenOriginal',
  'LandwirtschaftlicheBetriebshaftungsvertragsnachweisdokumentationGesamtbestand',
  'Universitätsverwaltungsstudienabgabenbescheinigungsarchivierungssachbearbeitung',
  'EnergieversorgungsnetzwerkstrompreisregulierungsbehördlicheMeldungsdokumentation',
] as const;

const fixturePdf = path.join(process.cwd(), 'fixtures/synthetic-upload.pdf');

test.use({ storageState: smokeFixtureStoragePath() });

let ellipsisFixtureUploadName = '';

function md5File(filePath: string): string {
  return crypto.createHash('md5').update(fs.readFileSync(filePath)).digest('hex');
}

function assertLongGermanLabelStems(): void {
  for (const stem of WS_B_LONG_GERMAN_LABEL_STEMS) {
    expect(stem.length).toBeGreaterThanOrEqual(60);
  }
}

async function waitForDocumentReady(
  request: import('@playwright/test').APIRequestContext,
  documentId: string
): Promise<void> {
  await expect
    .poll(
      async () => {
        const res = await request.get(`${apiBase}/v1/documents/${documentId}`, {
          headers: { origin: webOrigin },
        });
        if (!res.ok()) {
          return 'pending';
        }
        const doc = (await res.json()) as { status: string };
        return doc.status;
      },
      { timeout: 280_000, intervals: [2000, 3000, 5000] }
    )
    .toBe('ready');
}

async function provisionLongLabelRowFixture(
  request: import('@playwright/test').APIRequestContext
): Promise<string> {
  assertLongGermanLabelStems();
  const tagIds: string[] = [];
  const runToken = randomUUID().slice(0, 8);
  for (let index = 0; index < WS_B_LONG_GERMAN_LABEL_STEMS.length; index += 1) {
    const name = `ws-b-lang-${runToken}-${String(index)}-${WS_B_LONG_GERMAN_LABEL_STEMS[index]}`;
    const response = await request.post(`${apiBase}/v1/tags`, {
      headers: { origin: webOrigin },
      data: { name, color: '#7c3aed', matchingAlgorithm: 'none', match: '' },
    });
    expect(response.ok()).toBeTruthy();
    const body = (await response.json()) as { id: string };
    tagIds.push(body.id);
  }

  const uploadName = `ws-b-ellipsis-fixture-${runToken}.pdf`;
  const pdf = Buffer.concat([
    fs.readFileSync(fixturePdf),
    Buffer.from(`\n%%WS_B_ELLIPSIS_FIXTURE=${runToken}\n`, 'utf8'),
  ]);
  const upload = await request.post(`${apiBase}/v1/documents`, {
    headers: { origin: webOrigin },
    multipart: {
      file: {
        name: uploadName,
        mimeType: 'application/pdf',
        buffer: pdf,
      },
    },
  });
  expect(upload.ok()).toBeTruthy();
  const created = (await upload.json()) as { id: string };

  for (const tagId of tagIds) {
    const assign = await request.post(`${apiBase}/v1/documents/${created.id}/tags/${tagId}`, {
      headers: { origin: webOrigin },
    });
    expect(assign.ok()).toBeTruthy();
  }

  await waitForDocumentReady(request, created.id);
  return uploadName;
}

async function assertRowLabelChipsNeverHardClip(
  page: import('@playwright/test').Page
): Promise<void> {
  const issues = await page.evaluate(() => {
    const violations: string[] = [];

    const hasEllipsis = (el: HTMLElement): boolean => {
      const style = getComputedStyle(el);
      const overflowHidden =
        style.overflow === 'hidden' ||
        style.overflowX === 'hidden' ||
        style.overflow === 'clip' ||
        style.overflowX === 'clip';
      return style.textOverflow === 'ellipsis' && overflowHidden;
    };

    const chipLabels = document.querySelectorAll(
      '.document-labels-cell-row .label-chip-row-visible .label-chip-row-chip .chip-label'
    );
    for (let i = 0; i < chipLabels.length; i += 1) {
      const labelEl = chipLabels.item(i);
      if (!(labelEl instanceof HTMLElement)) {
        continue;
      }
      const chip = labelEl.closest('.chip');
      if (!(chip instanceof HTMLElement)) {
        continue;
      }
      const overflowed =
        labelEl.scrollWidth > labelEl.clientWidth + 1 || chip.scrollWidth > chip.clientWidth + 1;
      if (!overflowed) {
        continue;
      }
      if (!hasEllipsis(labelEl)) {
        violations.push(
          `overflow-without-ellipsis:${labelEl.textContent?.trim().slice(0, 48) ?? '(empty)'}`
        );
      }
      const fullName = chip.getAttribute('aria-label') ?? chip.getAttribute('title');
      if (!fullName?.trim()) {
        violations.push(
          `missing-full-name-tooltip:${labelEl.textContent?.trim().slice(0, 48) ?? '(empty)'}`
        );
      }
    }
    return violations;
  });
  expect(issues).toEqual([]);
}

async function seedLabels(request: import('@playwright/test').APIRequestContext, count: number) {
  for (let index = 0; index < count; index += 1) {
    const name = `ws-b-seed-${String(index).padStart(4, '0')}`;
    const response = await request.post(`${apiBase}/v1/tags`, {
      headers: { origin: webOrigin },
      data: { name, color: '#7c3aed', matchingAlgorithm: 'none', match: '' },
    });
    if (response.status() === 409 || response.status() === 400 || response.status() === 422) {
      continue;
    }
    expect(response.ok()).toBeTruthy();
  }

  const search = await request.get(
    `${apiBase}/v1/tags/search?q=${encodeURIComponent('ws-b-seed')}&limit=50`,
    { headers: { origin: webOrigin } }
  );
  expect(search.ok()).toBeTruthy();
  const page = (await search.json()) as { items: unknown[] };
  expect(page.items.length).toBeGreaterThan(0);
}

async function assertFullyInViewport(
  page: import('@playwright/test').Page,
  selector: string
): Promise<void> {
  const box = await page.locator(selector).boundingBox();
  const viewport = page.viewportSize();
  expect(box).toBeTruthy();
  expect(viewport).toBeTruthy();
  if (!box || !viewport) {
    return;
  }
  expect(box.y).toBeGreaterThanOrEqual(0);
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.y + box.height).toBeLessThanOrEqual(viewport.height + 1);
  expect(box.x + box.width).toBeLessThanOrEqual(viewport.width + 1);
}

async function openLibraryFilters(
  page: import('@playwright/test').Page,
  useDrawer: boolean
): Promise<void> {
  const filterToggle = page.getByRole('button', {
    name: /show filters|filter anzeigen|hide filters|filter ausblenden/i,
  });
  if (useDrawer) {
    await filterToggle.click();
    await expect(page.locator('.library-filter-drawer')).toBeVisible({ timeout: 30_000 });
    return;
  }
  const panel = page.getByTestId('library-filter-panel');
  if (!(await panel.isVisible())) {
    await filterToggle.click();
  }
  await expect(panel).toBeVisible({ timeout: 30_000 });
}

async function scrollTagFilterNearBottom(page: import('@playwright/test').Page): Promise<void> {
  const combobox = page.getByTestId('library-filter-tag-combobox');
  await combobox.scrollIntoViewIfNeeded();
  await page.evaluate(() => {
    const scrollHost =
      document.querySelector('.library-filter-drawer-body') ??
      document.querySelector('.filter-panel-body');
    if (scrollHost instanceof HTMLElement) {
      scrollHost.scrollTop = scrollHost.scrollHeight;
    }
  });
  await combobox.scrollIntoViewIfNeeded();
}

async function openTagFilterPortaledList(page: import('@playwright/test').Page): Promise<void> {
  const combobox = page.getByTestId('library-filter-tag-combobox');
  const input = combobox.getByRole('combobox');
  await input.click();
  await input.fill('ws-b-seed');
  const popover = page.getByTestId('library-filter-tag-combobox-popover');
  await expect(popover).toBeVisible({ timeout: 30_000 });
  await expect(popover).toHaveAttribute('data-floating-placement', /.+/);
}

test.describe('Workstream B label picker', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeAll(async ({ request }) => {
    fs.mkdirSync(artifactRoot, { recursive: true });
    const health = await request.get(`${apiBase}/health`);
    test.skip(!health.ok(), 'API not running');
    await seedLabels(request, 500);
    ellipsisFixtureUploadName = await provisionLongLabelRowFixture(request);
  });

  for (const viewport of tagFilterViewports) {
    test(`tag filter portaled popover in viewport (${viewport.label})`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto(`${webOrigin}/documents`);
      await page.waitForLoadState('networkidle');
      await setTheme(page, 'light');

      await openLibraryFilters(page, viewport.useDrawer);
      await scrollTagFilterNearBottom(page);
      await openTagFilterPortaledList(page);

      const popover = page.getByTestId('library-filter-tag-combobox-popover');
      const placement = await popover.getAttribute('data-floating-placement');
      expect(placement?.startsWith('top')).toBe(true);

      await assertFullyInViewport(page, '[data-testid="library-filter-tag-combobox-popover"]');

      const listHost = popover.locator('.label-picker-combobox-list-host');
      await expect(listHost).toBeVisible();
      const optionCount = await listHost.locator('.label-picker-item').count();
      expect(optionCount).toBeGreaterThan(0);
      expect(optionCount).toBeLessThan(80);

      const shot = path.join(artifactRoot, `tag-filter-popover-${viewport.label}.png`);
      await page.screenshot({ path: shot });
      expect(md5File(shot).length).toBe(32);
    });
  }

  for (const viewport of searchViewports) {
    test(`label picker search and virtualization (${viewport.label})`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto(`${webOrigin}/documents`);
      await page.waitForLoadState('networkidle');
      await setTheme(page, 'dark');

      await openLibraryFilters(page, viewport.width < 1024);
      await openTagFilterPortaledList(page);

      const shot = path.join(artifactRoot, `label-picker-${viewport.label}.png`);
      await page.screenshot({ path: shot });
      expect(md5File(shot).length).toBe(32);
    });
  }

  for (const route of rowChipEllipsisRoutes) {
    for (const viewport of rowChipEllipsisViewports) {
      test(`document row label chips ellipsis (${route.slug} ${viewport.label})`, async ({
        page,
      }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await page.goto(`${webOrigin}${route.path}`);
        await page.waitForLoadState('networkidle');
        await setTheme(page, 'light');

        const scrollHost = page.getByTestId('library-doc-virtual-scroll');
        await expect(scrollHost).toBeVisible({ timeout: 60_000 });

        const fixtureRow = page
          .locator('.library-doc-stack-item, .library-table tbody tr')
          .filter({ hasText: ellipsisFixtureUploadName })
          .first();
        await fixtureRow.scrollIntoViewIfNeeded({ timeout: 120_000 });
        await expect(fixtureRow).toBeVisible();

        await assertRowLabelChipsNeverHardClip(page);

        const shot = path.join(
          artifactRoot,
          `row-chip-ellipsis-${route.slug}-${viewport.label}.png`
        );
        await page.screenshot({ path: shot });
        expect(md5File(shot).length).toBe(32);
      });
    }
  }

  test('upload queue +N popover stays in viewport (1440)', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${webOrigin}/documents`);
    await page.waitForLoadState('networkidle');
    await setTheme(page, 'light');

    const compactBar = page.locator('.upload-compact-bar');
    if (await compactBar.isVisible().catch(() => false)) {
      await compactBar.getByRole('button', { name: /^upload$|^hochladen$/i }).click();
    }
    const uploadSection = page.locator('.library-page .upload-section').first();
    await expect(uploadSection).toBeVisible({ timeout: 90_000 });
    const fileInput = uploadSection.locator('input[type="file"]');
    await expect(fileInput).toBeAttached({ timeout: 30_000 });

    const queueFiles = Array.from({ length: 13 }, (_, index) => ({
      name: `ws-b-queue-${String(index).padStart(2, '0')}.pdf`,
      mimeType: 'application/pdf',
      buffer: Buffer.concat([
        fs.readFileSync(fixturePdf),
        Buffer.from(`\n%%WS_B_QUEUE=${randomUUID()}-${String(index)}\n`, 'utf8'),
      ]),
    }));
    await fileInput.setInputFiles(queueFiles, { timeout: 180_000 });

    const overflowBtn = page.locator('.upload-queue-overflow-btn');
    await expect(overflowBtn).toBeVisible({ timeout: 180_000 });
    await expect(overflowBtn).toHaveText('+1');
    await overflowBtn.click();
    const popover = page.locator('.upload-queue-overflow-popover');
    await expect(popover).toBeVisible();
    await assertFullyInViewport(page, '.upload-queue-overflow-popover');

    const shot = path.join(artifactRoot, 'upload-queue-overflow-1440.png');
    await page.screenshot({ path: shot });
    expect(md5File(shot).length).toBe(32);
  });

  test('chip contrast and +N popover stay in viewport (1440)', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${webOrigin}/documents`);
    await page.waitForLoadState('networkidle');
    await setTheme(page, 'light');

    const ratios = await page.evaluate(() => {
      const chips = Array.from(document.querySelectorAll('.document-labels-cell .chip'));
      return chips.map((chip) => {
        const style = getComputedStyle(chip);
        const fg = style.color;
        const bg = style.backgroundColor;
        return { fg, bg };
      });
    });
    for (const sample of ratios) {
      expect(sample.fg).toBeTruthy();
      expect(sample.bg).toBeTruthy();
    }

    const overflowBtn = page.locator('.label-chip-row-overflow-btn').first();
    if (await overflowBtn.count()) {
      await overflowBtn.click();
      const popover = page.locator('.label-chip-row-overflow-popover');
      await expect(popover).toBeVisible();
      await assertFullyInViewport(page, '.label-chip-row-overflow-popover');
      const shot = path.join(artifactRoot, 'label-overflow-popover-1440.png');
      await page.screenshot({ path: shot });
      expect(md5File(shot).length).toBe(32);
    }
  });
});
