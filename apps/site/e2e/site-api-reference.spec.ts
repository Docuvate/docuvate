import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test } from '@playwright/test';

const TAGS = ['dokumente', 'labels', 'korrespondenten'] as const;

type SiteOpenApiSpec = {
  info?: { description?: string };
  tags?: { name: string; description?: string }[];
  paths: Record<
    string,
    Record<
      string,
      {
        tags?: string[];
        summary?: string;
        description?: string;
        parameters?: { description?: string }[];
      }
    >
  >;
};

function loadDeOpenApiSpec(): SiteOpenApiSpec {
  const specPath = join(import.meta.dirname, '../src/generated/openapi.v1.json');
  return JSON.parse(readFileSync(specPath, 'utf8')) as SiteOpenApiSpec;
}

function loadEnOpenApiSpec(): SiteOpenApiSpec {
  const specPath = join(import.meta.dirname, '../src/generated/openapi.v1.en.json');
  return JSON.parse(readFileSync(specPath, 'utf8')) as SiteOpenApiSpec;
}

const EN_EM_DASH = /[\u2013\u2014]/;

function openApiCustomerStrings(spec: SiteOpenApiSpec): string[] {
  const strings: string[] = [];
  if (spec.info?.description) strings.push(spec.info.description);
  for (const tag of spec.tags ?? []) {
    if (tag.name) strings.push(tag.name);
    if (tag.description) strings.push(tag.description);
  }
  for (const pathItem of Object.values(spec.paths ?? {})) {
    for (const method of Object.values(pathItem)) {
      if (!method || typeof method !== 'object') continue;
      if (method.summary) strings.push(method.summary);
      if (method.description) strings.push(method.description);
      for (const param of method.parameters ?? []) {
        if (param.description) strings.push(param.description);
      }
    }
  }
  return strings;
}

function expectedDeTagSectionCount(): number {
  return loadDeOpenApiSpec().tags?.length ?? 0;
}

function adminUsersDeepLinkHash(): string {
  const spec = loadDeOpenApiSpec();
  const tag =
    spec.paths['/admin/users']?.get?.tags?.[0] ??
    spec.tags?.find((t) => /benutzerverwaltung/i.test(t.name))?.name ??
    'Benutzerverwaltung';
  const slug = tag.toLowerCase();
  return `#tag/${slug}/GET/admin/users`;
}

async function hashHeadingAligned(
  page: import('@playwright/test').Page,
  requestedHash: string
): Promise<boolean> {
  return page.evaluate((hash) => {
    if (location.hash !== hash) return false;
    const id = decodeURIComponent(hash.slice(1));
    const section = document.getElementById(id);
    if (!section) return false;
    const hb = document.querySelector('.site-header')?.getBoundingClientRect().bottom ?? 0;
    const heading =
      section.querySelector('h1, h2, h3, h4, .section-header, .section-header-label') ?? section;
    const top = heading.getBoundingClientRect().top;
    return top >= hb - 1 && top <= hb + 24;
  }, requestedHash);
}

async function waitForScalarDeepLinkSettled(
  page: import('@playwright/test').Page,
  requestedHash: string
) {
  await expect
    .poll(
      async () => {
        return page.evaluate((hash) => {
          const w = window as Window & { __dvScrollStable?: { y: number; since: number } };
          const store = w.__dvScrollStable ?? { y: window.scrollY, since: performance.now() };
          if (Math.abs(window.scrollY - store.y) > 0.5) {
            w.__dvScrollStable = { y: window.scrollY, since: performance.now() };
            return false;
          }
          if (performance.now() - store.since < 500) {
            w.__dvScrollStable = store;
            return false;
          }
          w.__dvScrollStable = store;
          if (location.hash !== hash) return false;
          const id = decodeURIComponent(hash.slice(1));
          const section = document.getElementById(id);
          if (!section) return false;
          const hb = document.querySelector('.site-header')?.getBoundingClientRect().bottom ?? 0;
          const heading =
            section.querySelector('h1, h2, h3, h4, .section-header, .section-header-label') ??
            section;
          const top = heading.getBoundingClientRect().top;
          return top >= hb - 1 && top <= hb + 24;
        }, requestedHash);
      },
      { timeout: 35_000 }
    )
    .toBe(true);
}

async function expectScalarHashTargetInViewport(
  page: import('@playwright/test').Page,
  requestedHash: string
) {
  await waitForScalarDeepLinkSettled(page, requestedHash);
  expect(await hashHeadingAligned(page, requestedHash)).toBe(true);
  await page.waitForTimeout(1000);
  expect(await page.evaluate(() => location.hash)).toBe(requestedHash);
  expect(await hashHeadingAligned(page, requestedHash)).toBe(true);
}

async function assertOperationRowsInsideTagCard(
  page: import('@playwright/test').Page,
  tagSlug: string
) {
  const offenders = await page.evaluate((slug) => {
    const card = [...document.querySelectorAll('.scalar-embed .scalar-card-sticky')].find(
      (el) =>
        el.querySelector(`a.endpoint[href*="#tag/${slug}/"]`) &&
        el.getBoundingClientRect().width > 0
    );
    if (!card) {
      return ['missing-operation-card'];
    }
    const cr = card.getBoundingClientRect();
    const bad: string[] = [];
    card.querySelectorAll('a.endpoint').forEach((endpoint) => {
      const r = endpoint.getBoundingClientRect();
      if (r.width < 1 || r.height < 1) return;
      const outside =
        r.bottom > cr.bottom + 2 ||
        r.top < cr.top - 2 ||
        r.right > cr.right + 2 ||
        r.left < cr.left - 2;
      if (outside) bad.push(`row-outside:${endpoint.getAttribute('href') ?? 'endpoint'}`);
    });
    document.querySelectorAll('.scalar-embed a.endpoint').forEach((endpoint) => {
      if (card.contains(endpoint)) return;
      if (
        endpoint.closest(
          'nav.sidebar-pages, aside.references-navigation, .references-navigation, .references-navigation-list'
        )
      ) {
        return;
      }
      const href = endpoint.getAttribute('href') ?? '';
      if (href.includes('#tag/system/')) return;
      if (href.includes(`#tag/${slug}/`)) return;
      const r = endpoint.getBoundingClientRect();
      if (r.width < 1 || r.height < 1) return;
      const intersects =
        r.bottom > cr.top + 4 &&
        r.top < cr.bottom - 4 &&
        r.right > cr.left + 4 &&
        r.left < cr.right - 4;
      if (intersects) bad.push(`foreign-intersect:${href}`);
    });
    return bad.slice(0, 10);
  }, tagSlug);
  expect(offenders).toEqual([]);
}

async function assertOperationPathsFit(page: import('@playwright/test').Page) {
  const offenders = await page.evaluate(() => {
    const paths = [
      ...document.querySelectorAll('.scalar-embed .scalar-card-sticky .endpoint-path'),
    ].filter((el) => {
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0;
    });
    return paths
      .filter((el) => el.scrollWidth > el.clientWidth + 1)
      .map((el) => el.textContent?.trim())
      .slice(0, 5);
  });
  expect(offenders).toEqual([]);
}

async function assertNoTopBlackBar(page: import('@playwright/test').Page) {
  await page.evaluate(() => window.scrollTo(0, 0));
  const offenders = await page.evaluate(() => {
    const bad: string[] = [];
    for (const el of document.querySelectorAll('*')) {
      if (!(el instanceof HTMLElement)) continue;
      const r = el.getBoundingClientRect();
      if (r.top < 0 || r.top > 40 || r.height < 4 || r.width < window.innerWidth * 0.85) continue;
      const bg = getComputedStyle(el).backgroundColor;
      const m = bg.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
      if (!m) continue;
      const r0 = Number(m[1]);
      const g = Number(m[2]);
      const b = Number(m[3]);
      const a = m[4] === undefined ? 1 : Number(m[4]);
      if (a < 0.35 || r0 > 45 || g > 45 || b > 45) continue;
      bad.push(`${el.tagName}.${String(el.className).slice(0, 60)}`);
    }
    return bad.slice(0, 5);
  });
  expect(offenders).toEqual([]);
}

test.describe('API reference operations', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('docuvate-site-theme', 'light');
      localStorage.setItem('docuvate-site-locale', 'de');
      document.documentElement.setAttribute('data-docuvate-theme', 'light');
    });
  });

  test('tag sections list operations for Labels and Dokumente', async ({ page }) => {
    test.setTimeout(90_000);
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/docs/api#tag/labels');
    const tagOperationLinks = page.locator(
      '.scalar-embed .scalar-card-sticky a.endpoint[href*="#tag/labels/"]'
    );
    await expect(tagOperationLinks.first()).toBeVisible({ timeout: 60_000 });
    expect(await tagOperationLinks.count()).toBeGreaterThan(2);

    await page.locator('.scalar-embed a[href*="#tag/dokumente"]').first().click();
    await page.waitForURL(/#tag\/dokumente/, { timeout: 30_000 });
    const docLinks = page.locator(
      '.scalar-embed .scalar-card-sticky a.endpoint[href*="#tag/dokumente/"]'
    );
    await expect(docLinks.first()).toBeVisible({ timeout: 60_000 });
    expect(await docLinks.count()).toBeGreaterThan(2);
  });

  test('German Scalar embed has no known English chrome labels', async ({ page }) => {
    test.setTimeout(90_000);
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/docs/api#tag/labels/PUT/tags/{tagId}/custom-fields');
    await page.waitForSelector('.scalar-embed-locale-de', { state: 'attached', timeout: 60_000 });
    const offenders = await expect
      .poll(
        async () =>
          page.evaluate(() => {
            const scope = document.querySelector('.scalar-embed-locale-de .scalar-app');
            if (!scope) return ['missing-embed'];
            const forbidden = [
              ['Show More', /\bShow More\b/],
              ['Show Child Attributes', /\bShow Child Attributes\b/],
              ['Hide Child Attributes', /\bHide Child Attributes\b/],
              ['Test Request', /\bTest Request\b/],
              ['required', /\brequired\b/],
              ['Auth Type', /\bAuth Type\b/],
              ['No authentication selected', /\bNo authentication selected\b/],
              ['Copy', /\bCopy\b/],
              ['Copied', /\bCopied\b/],
              ['Responses', /\bResponses\b/],
              ['Operations', /\bOperations\b/],
              ['Show Schema', /\bShow Schema\b/],
              ['Body', /\bBody\b/],
            ] as const;
            const chunks: string[] = [];
            scope
              .querySelectorAll('button, label, summary, th, td, h1, h2, h3, h4, p, span')
              .forEach((el) => {
                if (el.closest('pre, code, .hljs')) return;
                const t = el.textContent?.trim();
                if (t) chunks.push(t);
              });
            const text = chunks.join('\n');
            return forbidden.filter(([, pattern]) => pattern.test(text)).map(([label]) => label);
          }),
        { timeout: 30_000 }
      )
      .toEqual([]);
  });

  test('visible Scalar headings do not expose permalink or collapsed chrome', async ({ page }) => {
    test.setTimeout(90_000);
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/docs/api#tag/labels/PUT/tags/{tagId}/custom-fields');
    await page.waitForSelector('.scalar-embed-locale-de', { state: 'attached', timeout: 60_000 });
    await page.waitForTimeout(2000);
    const bad = await page.evaluate(() => {
      const root = document.querySelector('.scalar-embed-locale-de');
      if (!root) return ['missing-embed'];
      const offenders: string[] = [];
      root.querySelectorAll('h1, h2, h3, h4').forEach((heading) => {
        const rect = heading.getBoundingClientRect();
        if (rect.width < 1 || rect.height < 1) return;
        const clone = heading.cloneNode(true) as HTMLElement;
        clone.querySelectorAll('.sr-only').forEach((el) => el.remove());
        const visible = clone.textContent?.trim() ?? '';
        if (
          visible.includes('Link kopieren') ||
          visible.includes('Copy link') ||
          visible.includes('(Collapsed)') ||
          visible.includes('(Eingeklappt)')
        ) {
          offenders.push(visible.slice(0, 80));
        }
      });
      return offenders.slice(0, 5);
    });
    expect(bad).toEqual([]);
  });

  test('German chrome has no English Show More label', async ({ page }) => {
    test.setTimeout(90_000);
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/docs/api#tag/labels');
    await page.waitForSelector('.scalar-embed button.show-more', {
      state: 'attached',
      timeout: 60_000,
    });
    await expect(page.getByText('Show More', { exact: true })).toHaveCount(0);
    await expect(page.locator('.scalar-embed button.show-more').first()).toHaveText(
      'Mehr anzeigen'
    );
  });

  test('labels Operationen rows stay inside the card at 1280', async ({ page }) => {
    test.setTimeout(90_000);
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/docs/api#tag/labels');
    await page.waitForSelector('.scalar-embed .endpoint-path', {
      state: 'attached',
      timeout: 60_000,
    });
    await assertOperationRowsInsideTagCard(page, 'labels');
  });

  test('open operation has no foreign endpoint bar above it at 1280', async ({ page }) => {
    test.setTimeout(90_000);
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/docs/api#tag/labels/PUT/tags/{tagId}/custom-fields');
    await page.waitForSelector('.scalar-embed', { state: 'attached', timeout: 60_000 });
    const requestedHash = '#tag/labels/PUT/tags/{tagId}/custom-fields';
    await expectScalarHashTargetInViewport(page, requestedHash);
    const foreign = await page.evaluate((hash) => {
      const main =
        document.querySelector('.scalar-embed .references-rendered') ??
        document.querySelector('.scalar-embed .scalar-app main');
      if (!main) return ['missing-main'];
      const id = decodeURIComponent(hash.slice(1));
      const section = document.getElementById(id);
      if (!section) return ['missing-section'];
      const targetRow = section.querySelector(`a.endpoint[href="${hash}"]`);
      const headingTop =
        targetRow?.getBoundingClientRect().top ??
        section.querySelector('h1, h2, h3')?.getBoundingClientRect().top ??
        0;
      const bad: string[] = [];
      main.querySelectorAll('a.endpoint').forEach((link) => {
        if (link.closest('nav.sidebar-pages, aside.references-navigation, .references-navigation'))
          return;
        const r = link.getBoundingClientRect();
        if (r.width < 1 || r.height < 1) return;
        if (r.bottom < 0 || r.top > window.innerHeight) return;
        const href = link.getAttribute('href') ?? '';
        if (href === hash) return;
        if (r.bottom <= headingTop + 24) {
          bad.push(href || 'endpoint');
        }
      });
      return bad.slice(0, 5);
    }, requestedHash);
    expect(foreign).toEqual([]);
  });

  test('labels Operationen card does not overlap Dokumente card', async ({ page }) => {
    test.setTimeout(90_000);
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/docs/api#tag/labels');
    await page.waitForSelector('.scalar-embed .endpoint-path', {
      state: 'attached',
      timeout: 60_000,
    });
    const overlaps = await page.evaluate(() => {
      const labelsCard = [...document.querySelectorAll('.scalar-card-sticky')].find((card) => {
        const r = card.getBoundingClientRect();
        return r.width > 0 && card.querySelector('a.endpoint[href*="#tag/labels/"]');
      });
      if (!labelsCard) return ['no-labels-card'];
      const lr = labelsCard.getBoundingClientRect();
      const bad: string[] = [];
      document.querySelectorAll('.scalar-card-sticky').forEach((card) => {
        if (card === labelsCard) return;
        if (!card.querySelector('a.endpoint[href*="#tag/dokumente/"]')) return;
        const r = card.getBoundingClientRect();
        if (r.width < 1 || r.height < 1) return;
        const intersects =
          r.bottom > lr.top + 4 &&
          r.top < lr.bottom - 4 &&
          r.right > lr.left + 4 &&
          r.left < lr.right - 4;
        if (intersects) bad.push('dokumente-overlap');
      });
      return bad;
    });
    expect(overlaps).toEqual([]);
  });

  test('operation path lines do not break inside URL segments', async ({ page }) => {
    test.setTimeout(90_000);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/docs/api#tag/dokumente');
    await page.waitForFunction(
      () =>
        [...document.querySelectorAll('.scalar-embed .endpoint-path')].some(
          (el) => el.getBoundingClientRect().width > 0
        ),
      undefined,
      { timeout: 60_000 }
    );
    const broken = await page.evaluate(() => {
      const offenders: string[] = [];
      const paths = [...document.querySelectorAll('.scalar-embed .endpoint-path')].filter(
        (el) => el.getBoundingClientRect().width > 0
      );
      for (const el of paths) {
        const full = el.textContent ?? '';
        const range = document.createRange();
        range.selectNodeContents(el);
        const rects = [...range.getClientRects()];
        const lineTexts = rects.map((rect) => {
          const sub = range.cloneRange();
          // approximate: use full text if single line
          return full;
        });
        if (rects.length <= 1) continue;
        const lines: string[] = [];
        let lastTop = -1;
        let current = '';
        for (const rect of rects) {
          if (lastTop >= 0 && Math.abs(rect.top - lastTop) > 2) {
            lines.push(current);
            current = '';
          }
          lastTop = rect.top;
        }
        if (current) lines.push(current);
        if (lines.length <= 1) {
          const segments = full.split('/').filter((s) => s.length > 0);
          for (const seg of segments) {
            if (seg.includes('{') && !seg.includes('}')) offenders.push(full);
            if (seg.includes('}') && !seg.includes('{')) offenders.push(full);
          }
          continue;
        }
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          if (trimmed.endsWith('-') || trimmed.startsWith('-')) offenders.push(full);
          if (/\{[^}]*$/.test(trimmed) || /^[^{]*\}/.test(trimmed)) offenders.push(full);
        }
      }
      return offenders.slice(0, 5);
    });
    expect(broken).toEqual([]);
  });

  test('operation paths fit and no top black bar at 1280', async ({ page }) => {
    test.setTimeout(90_000);
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/docs/api#tag/labels');
    await page.waitForSelector('.scalar-embed .endpoint-path', {
      state: 'attached',
      timeout: 60_000,
    });
    await assertNoTopBlackBar(page);
    await assertOperationPathsFit(page);
    await assertOperationRowsInsideTagCard(page, 'labels');
  });

  for (const width of [390, 1280] as const) {
    test(`every tag Operationen card has operations at ${width}px`, async ({ browser }) => {
      test.setTimeout(180_000);
      for (const tag of TAGS) {
        const context = await browser.newContext({
          viewport: { width, height: width === 390 ? 844 : 900 },
        });
        const page = await context.newPage();
        await page.addInitScript(() => {
          localStorage.setItem('docuvate-site-theme', 'light');
          localStorage.setItem('docuvate-site-locale', 'de');
          document.documentElement.setAttribute('data-docuvate-theme', 'light');
        });
        await page.goto(`/docs/api#tag/${tag}`, { waitUntil: 'networkidle', timeout: 90_000 });
        await page.waitForFunction(
          (tagSlug) =>
            [
              ...document.querySelectorAll(`.scalar-embed a.endpoint[href*="#tag/${tagSlug}/"]`),
            ].some((a) => {
              const r = a.getBoundingClientRect();
              return r.width > 0 && r.height > 0;
            }),
          tag,
          { timeout: 60_000 }
        );
        const visibleRows = await page.evaluate((tagSlug) => {
          return [
            ...document.querySelectorAll(`.scalar-embed a.endpoint[href*="#tag/${tagSlug}/"]`),
          ].filter((a) => {
            const r = a.getBoundingClientRect();
            return r.width > 0 && r.height > 0;
          }).length;
        }, tag);
        expect(visibleRows).toBeGreaterThanOrEqual(1);
        if (width === 1280) {
          await assertOperationPathsFit(page);
          await assertOperationRowsInsideTagCard(page, tag);
        }
        await context.close();
      }
    });
  }

  test('Scalar sidebar search clears site header after scroll', async ({ page }) => {
    test.setTimeout(90_000);
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/docs/api#tag/labels');
    await page.waitForSelector('.scalar-embed .sidebar-search', {
      state: 'attached',
      timeout: 60_000,
    });
    await page.evaluate(() => window.scrollTo(0, 1500));
    await page.waitForTimeout(200);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(200);
    const layout = await page.evaluate(() => {
      const header = document.querySelector('.site-header');
      const search = document.querySelector('.scalar-embed .sidebar-search');
      if (!header || !search) return { ok: false };
      const hb = header.getBoundingClientRect().bottom;
      const st = search.getBoundingClientRect().top;
      return { ok: st >= hb - 1, hb, st };
    });
    expect(layout.ok).toBe(true);
  });

  test('sidebar accordion keeps a single expanded group', async ({ page }) => {
    test.setTimeout(90_000);
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/docs/api');
    await page.waitForSelector('.scalar-embed nav.sidebar-pages', {
      state: 'attached',
      timeout: 60_000,
    });
    await page
      .locator('.scalar-embed nav.sidebar-pages li.sidebar-group-item')
      .filter({ hasText: 'Dokumente' })
      .locator('button[aria-expanded]')
      .first()
      .click();
    await page.waitForTimeout(350);
    await page
      .locator('.scalar-embed nav.sidebar-pages li.sidebar-group-item')
      .filter({ hasText: 'Labels' })
      .locator('button[aria-expanded]')
      .first()
      .click();
    await page.waitForTimeout(500);
    const expanded = await page
      .locator('.scalar-embed nav.sidebar-pages button[aria-expanded="true"]')
      .count();
    expect(expanded).toBe(1);
    await expect(
      page.locator('.scalar-embed nav.sidebar-pages button[aria-expanded="true"]')
    ).toContainText(/Labels/i);
  });

  for (const height of [800, 720] as const) {
    test(`Labels sidebar reaches Label löschen within two viewports at 1280×${height}`, async ({
      page,
    }) => {
      test.setTimeout(120_000);
      await page.setViewportSize({ width: 1280, height });
      await page.goto('/docs/api#tag/labels');
      await page.waitForSelector('.scalar-embed nav.sidebar-pages', {
        state: 'attached',
        timeout: 60_000,
      });
      await waitForScalarDeepLinkSettled(page, '#tag/labels');
      await page
        .locator('.scalar-embed nav.sidebar-pages li.sidebar-group-item')
        .filter({ hasText: 'Dokumente' })
        .locator('button[aria-expanded]')
        .first()
        .click();
      await page.waitForTimeout(250);
      await page
        .locator('.scalar-embed nav.sidebar-pages li.sidebar-group-item')
        .filter({ hasText: 'Labels' })
        .locator('button[aria-expanded]')
        .first()
        .click();
      await page.waitForTimeout(400);
      const startY = await page.evaluate(() => window.scrollY);
      const maxDelta = height * 2;
      let layout = { inViewport: false, overlapsFooter: true, scrollDelta: startY };
      for (let step = 0; step < 24; step += 1) {
        layout = await page.evaluate(() => {
          const header = document.querySelector('.site-header');
          const footer = document.querySelector('.site-footer');
          const link = [...document.querySelectorAll('.scalar-embed nav.sidebar-pages a')].find(
            (a) => {
              const href = a.getAttribute('href') ?? '';
              const text = a.textContent?.trim() ?? '';
              return href.includes('DELETE/tags/{id}') || text.includes('Label löschen');
            }
          );
          if (!header || !footer || !link)
            return { inViewport: false, overlapsFooter: true, scrollDelta: window.scrollY };
          const hb = header.getBoundingClientRect().bottom;
          const lr = link.getBoundingClientRect();
          const fr = footer.getBoundingClientRect();
          const inViewport = lr.top >= hb - 1 && lr.bottom <= window.innerHeight + 1;
          const footerVisible = fr.top < window.innerHeight;
          const overlapsFooter = footerVisible && lr.bottom > fr.top + 2 && lr.top < fr.bottom;
          return { inViewport, overlapsFooter, scrollDelta: window.scrollY };
        });
        if (layout.inViewport && !layout.overlapsFooter) break;
        await page.mouse.wheel(0, 500);
        await page.waitForTimeout(120);
      }
      const scrollDelta = Math.abs(layout.scrollDelta - startY);
      expect(scrollDelta, JSON.stringify({ scrollDelta, maxDelta, startY })).toBeLessThanOrEqual(
        maxDelta + 120
      );
      expect(layout.inViewport, JSON.stringify(layout)).toBe(true);
      expect(layout.overlapsFooter, JSON.stringify(layout)).toBe(false);
    });
  }

  test('German Scalar aria snapshot has no forbidden English chrome', async ({ page }) => {
    test.setTimeout(90_000);
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/docs/api');
    await page.waitForSelector('.scalar-embed-locale-de', { state: 'attached', timeout: 60_000 });
    await page.waitForTimeout(2500);
    const appRoot = page.locator('.scalar-embed-locale-de .scalar-app').first();
    await expect
      .poll(
        async () => {
          const snap = await appRoot.ariaSnapshot();
          const forbidden = [
            /\bExpand\b/,
            /\bCollapse\b/,
            /\bShow all\b/i,
            /\bExample Responses\b/,
            /\bDownload OpenAPI Document\b/,
            /\bOpen API Documentation\b/,
            /\bShow sidebar\b/,
            /\bShow search\b/i,
            /\bClose Group\b/,
            /\bHTTP Method\b/,
            /\bSidebar for\b/,
            /\bType:\b/,
            /\bNo Body\b/,
            /\bBody\b/,
            /\bShow Schema\b/,
            /\bbinary data\b/i,
            /\bendpoints\b/im,
          ];
          return forbidden.filter((re) => re.test(snap)).map((re) => String(re));
        },
        { timeout: 30_000 }
      )
      .toEqual([]);
  });

  test('Scalar sidebar has no nested scroll region', async ({ page }) => {
    test.setTimeout(90_000);
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/docs/api');
    await page.waitForSelector('.scalar-embed nav.sidebar-pages', {
      state: 'attached',
      timeout: 60_000,
    });
    await page.evaluate(() => window.scrollTo(0, 800));
    await page.waitForTimeout(300);
    const nested = await page.evaluate(() => {
      const scrollRoots = [
        ...document.querySelectorAll(
          '.scalar-embed .references-navigation-list, .scalar-embed aside.references-navigation, .scalar-embed nav.sidebar-pages'
        ),
      ];
      for (const el of scrollRoots) {
        const style = getComputedStyle(el);
        const scrollable = el.scrollHeight > el.clientHeight + 2;
        const overflowScroll =
          style.overflowY === 'auto' ||
          style.overflowY === 'scroll' ||
          style.overflow === 'auto' ||
          style.overflow === 'scroll';
        if (scrollable && overflowScroll) return true;
      }
      return false;
    });
    expect(nested).toBe(false);
  });

  test('Scalar chips are not pill-shaped', async ({ page }) => {
    test.setTimeout(90_000);
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/docs/api#tag/labels/PUT/tags/{tagId}/custom-fields');
    await page.waitForSelector('.scalar-embed-locale-de', { state: 'attached', timeout: 60_000 });
    await page.waitForTimeout(2500);
    const offenders = await page.evaluate(() => {
      const scope = document.querySelector('.scalar-embed-locale-de .scalar-app');
      if (!scope) return ['missing-embed'];
      const bad: string[] = [];
      scope.querySelectorAll('*').forEach((el) => {
        if (!(el instanceof HTMLElement)) return;
        const cls = el.className?.toString() ?? '';
        const chipLike =
          /badge|pill|schema-properties|content-type|show-more|rounded-full|cm-pill/i.test(cls) ||
          (el.tagName === 'LABEL' && cls.includes('content-type'));
        if (!chipLike) return;
        const r = el.getBoundingClientRect();
        if (r.width < 8 || r.height < 8) return;
        if (r.bottom < 0 || r.top > window.innerHeight) return;
        const bg = getComputedStyle(el).backgroundColor;
        if (bg === 'rgba(0, 0, 0, 0)' || bg === 'transparent') return;
        const br = getComputedStyle(el).borderTopLeftRadius;
        const radius = parseFloat(br);
        if (!Number.isFinite(radius) || radius <= 0) return;
        if (radius >= r.height / 2 - 1) {
          bad.push(`${el.tagName}.${String(el.className).slice(0, 40)} r=${radius} h=${r.height}`);
        }
      });
      return bad.slice(0, 8);
    });
    expect(offenders).toEqual([]);
  });

  test('site header stays at viewport top on API landing and operation deep link', async ({
    page,
  }) => {
    test.setTimeout(90_000);
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/docs/api');
    await page.waitForSelector('.scalar-embed', { state: 'attached', timeout: 60_000 });
    await page.waitForTimeout(800);
    expect(
      await page.evaluate(() => document.querySelector('.site-header')?.getBoundingClientRect().top)
    ).toBe(0);

    await page.goto('/docs/api#tag/labels/PUT/tags/{tagId}/custom-fields');
    await page.waitForSelector('.scalar-embed', { state: 'attached', timeout: 60_000 });
    await page.waitForTimeout(1500);
    expect(
      await page.evaluate(() => document.querySelector('.site-header')?.getBoundingClientRect().top)
    ).toBe(0);

    await page.goto('/docs/api#tag/labels', { waitUntil: 'networkidle', timeout: 90_000 });
    await page.waitForSelector('.scalar-embed', { state: 'attached', timeout: 60_000 });
    await page.waitForTimeout(1200);
    expect(
      await page.evaluate(() => document.querySelector('.site-header')?.getBoundingClientRect().top)
    ).toBe(0);
    await page.evaluate(() => window.scrollBy(0, 240));
    await page.waitForTimeout(200);
    expect(
      await page.evaluate(() => document.querySelector('.site-header')?.getBoundingClientRect().top)
    ).toBe(0);
  });

  test('expanded sidebar group headings are not letter-stacked at 1280', async ({ page }) => {
    test.setTimeout(90_000);
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/docs/api');
    await page.waitForSelector('.scalar-embed nav.sidebar-pages', {
      state: 'attached',
      timeout: 60_000,
    });
    for (const name of [/Dokumente/, /Labels/]) {
      await page.locator('.scalar-embed button').filter({ hasText: name }).first().click();
      await page.waitForTimeout(300);
    }
    const bad = await page.evaluate(() => {
      const offenders: string[] = [];
      document.querySelectorAll('.scalar-embed .sidebar-heading').forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.width < 1 || r.height < 1) return;
        if (r.width < 200 || r.height > 56) {
          offenders.push(`heading:${r.width}x${r.height}`);
        }
      });
      return offenders.slice(0, 5);
    });
    expect(bad).toEqual([]);
  });

  test('DE API renders all tag sections after scrolling', async ({ page }) => {
    test.setTimeout(120_000);
    const expectedTags = expectedDeTagSectionCount();
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/docs/api');
    await page.waitForSelector('.scalar-embed-locale-de', { state: 'attached', timeout: 60_000 });
    for (let i = 0; i < 30; i += 1) {
      await page.keyboard.press('End');
      await page.waitForTimeout(80);
    }
    await expect
      .poll(async () => page.locator('.scalar-embed .tag-section-container').count(), {
        timeout: 30_000,
      })
      .toBeGreaterThanOrEqual(expectedTags);
  });

  test('generated DE and EN OpenAPI have no en or em dashes in customer copy', () => {
    for (const spec of [loadDeOpenApiSpec(), loadEnOpenApiSpec()]) {
      const offenders = openApiCustomerStrings(spec).filter((s) => EN_EM_DASH.test(s));
      expect(offenders).toEqual([]);
    }
  });

  test('DE admin users deep link has German summary and aligned heading', async ({ page }) => {
    test.setTimeout(90_000);
    const hash = adminUsersDeepLinkHash();
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(`/docs/api${hash}`, { waitUntil: 'networkidle', timeout: 90_000 });
    await page.waitForSelector('.scalar-embed-locale-de', { state: 'attached', timeout: 60_000 });
    await expectScalarHashTargetInViewport(page, hash);
    await expect(page.locator('.scalar-embed-locale-de')).not.toContainText(/List instance users/i);
    await expect(page.locator('.scalar-embed-locale-de')).toContainText(
      /Instanz-Benutzer auflisten/i
    );
  });

  for (const hash of [
    '#tag/korrespondenten',
    '#tag/labels',
    '#tag/dokumente',
    '#tag/dokumente/POST/documents',
    '#tag/labels/DELETE/tags/{id}',
    '#tag/labels/PUT/tags/{tagId}/custom-fields',
  ] as const) {
    test(`DE deep link ${hash} heading under header`, async ({ page }) => {
      test.setTimeout(90_000);
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.goto(`/docs/api${hash}`, { waitUntil: 'networkidle', timeout: 90_000 });
      await page.waitForSelector('.scalar-embed-locale-de', { state: 'attached', timeout: 60_000 });
      await expectScalarHashTargetInViewport(page, hash);
    });
  }

  for (const hash of ['#tag/dokumente', '#tag/labels/PUT/tags/{tagId}/custom-fields'] as const) {
    test(`DE deep link ${hash} layout is bounded`, async ({ page }) => {
      test.setTimeout(90_000);
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.goto(`/docs/api${hash}`, { waitUntil: 'networkidle', timeout: 90_000 });
      await page.waitForSelector('.scalar-embed-locale-de', { state: 'attached', timeout: 60_000 });
      await expectScalarHashTargetInViewport(page, hash);
      const layout = await page.evaluate((requestedHash) => {
        const header = document.querySelector('.site-header');
        const footer = document.querySelector('.site-footer');
        const app = document.querySelector('.scalar-embed .scalar-app');
        const main = document.querySelector('.scalar-embed main.references-rendered');
        if (!header || !footer || !app || !main) return { ok: false, reason: 'missing' };
        const hb = header.getBoundingClientRect().bottom;
        const id = decodeURIComponent(requestedHash.slice(1));
        const section = document.getElementById(id);
        const heading =
          section?.querySelector('h1, h2, h3, h4, .section-header, .section-header-label') ??
          section;
        const targetTop = heading?.getBoundingClientRect().top ?? hb;
        const operation = /^tag\/([^/]+)\/(GET|PUT|POST|PATCH|DELETE)(\/.*)$/i.exec(id);
        const ft = footer.getBoundingClientRect().top;
        const appEl = app as HTMLElement;
        const overflow = appEl.scrollHeight > appEl.clientHeight + 2;
        let mainPastFooter = false;
        main.querySelectorAll('*').forEach((el) => {
          const r = el.getBoundingClientRect();
          if (r.width < 1 || r.height < 1) return;
          if (r.bottom > ft + 2) mainPastFooter = true;
        });
        const isOperation = Boolean(operation);
        const okLayout = isOperation
          ? targetTop >= hb - 8 &&
            targetTop < window.innerHeight - 48 &&
            !overflow &&
            !mainPastFooter
          : targetTop <= hb + 120 && !overflow && !mainPastFooter;
        return {
          ok: okLayout,
          targetTop,
          hb,
          overflow,
          mainPastFooter,
          isOperation,
        };
      }, hash);
      expect(layout.ok, JSON.stringify(layout)).toBe(true);
    });
  }

  test('DE schema Unterattribute toggle expands without Vue errors', async ({ page }) => {
    test.setTimeout(90_000);
    await page.setViewportSize({ width: 1280, height: 900 });
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(`pageerror:${err.message}`));
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(`console:${msg.text()}`);
    });
    await page.goto('/docs/api#tag/labels/PUT/tags/{tagId}/custom-fields');
    await page.waitForSelector('.scalar-embed-locale-de', { state: 'attached', timeout: 60_000 });
    await expectScalarHashTargetInViewport(page, '#tag/labels/PUT/tags/{tagId}/custom-fields');
    errors.length = 0;
    const sectionId = 'tag/labels/PUT/tags/{tagId}/custom-fields';
    const toggle = page
      .locator(`[id="${sectionId}"] button.schema-card-title`)
      .filter({ hasText: 'Unterattribute anzeigen' });
    await toggle.click();
    await page.waitForTimeout(400);
    await expect(
      page
        .locator(`[id="${sectionId}"] button.schema-card-title`)
        .filter({ hasText: 'Unterattribute ausblenden' })
    ).toBeVisible({ timeout: 10_000 });
    await expect(
      page.locator(`[id="${sectionId}"] button.schema-card-title[aria-expanded="true"]`)
    ).toBeVisible({ timeout: 10_000 });
    expect(errors, errors.join('\n')).toEqual([]);
  });

  test('POST documents deep link has no English binary data copy', async ({ page }) => {
    test.setTimeout(90_000);
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/docs/api#tag/dokumente/POST/documents');
    await page.waitForSelector('.scalar-embed-locale-de', { state: 'attached', timeout: 60_000 });
    await expectScalarHashTargetInViewport(page, '#tag/dokumente/POST/documents');
    await expect(page.locator('.scalar-embed-locale-de')).not.toContainText(/binary data/i);
  });

  test('Scalar touch targets meet 40px on operation view', async ({ page }) => {
    test.setTimeout(90_000);
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/docs/api#tag/labels/PUT/tags/{tagId}/custom-fields');
    await page.waitForSelector('.scalar-embed-locale-de', { state: 'attached', timeout: 60_000 });
    await page.waitForTimeout(2000);
    const offenders = await page.evaluate(() => {
      const selectors = [
        '.scalar-embed button.tab',
        '.scalar-embed button.schema-card-title',
        '.scalar-embed button.toggle-nested-icon',
        '.scalar-embed p.sidebar-heading-chevron',
        '.scalar-embed .introduction-card-item button',
        '.scalar-embed .introduction-card-item .scalar-button',
        '.scalar-embed .introduction-card-item .scalar-row',
        '.scalar-embed .copy-button',
        '.scalar-embed label.content-type-select',
        '.footer-locale-links a',
      ];
      const bad: string[] = [];
      for (const sel of selectors) {
        const nodes = [...document.querySelectorAll(sel)].filter((el) => {
          const r = el.getBoundingClientRect();
          return r.width > 1 && r.height > 1;
        });
        if (nodes.length === 0) {
          bad.push(`${sel}:missing`);
          continue;
        }
        nodes.forEach((el) => {
          const r = el.getBoundingClientRect();
          if (r.height < 40 || r.width < 40) {
            bad.push(`${sel}:${Math.round(r.width)}x${Math.round(r.height)}`);
          }
        });
      }
      return bad.slice(0, 8);
    });
    expect(offenders).toEqual([]);
  });

  test('opening an operation shows details', async ({ page }) => {
    test.setTimeout(90_000);
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/docs/api#tag/labels/GET/labels/map');
    await page.waitForSelector('.scalar-embed', { state: 'attached', timeout: 60_000 });
    await expect(page.locator('.scalar-embed')).toContainText('Antworten', { timeout: 30_000 });
    await expect(page.locator('.scalar-embed')).toContainText('/labels/map', { timeout: 15_000 });
  });
});
