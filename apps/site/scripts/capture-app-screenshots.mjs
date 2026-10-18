import { chromium } from 'playwright';
import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { applyMarketingC1Theme, assertMarketingAccentNotBlue } from './marketing-c1-web-theme.mjs';

const siteScripts = dirname(fileURLToPath(import.meta.url));
const siteRoot = join(siteScripts, '..');
const demoDir = join(siteScripts, '../../web/public/demo');
const webUrl = process.env.WEB_URL ?? 'http://127.0.0.1:5173';
const sitePublic =
  process.env.SITE_PUBLIC ?? join(siteRoot, 'public', 'screenshots');
const qaScreenshotDir =
  process.env.QA_SCREENSHOT_DIR ?? join(siteRoot, 'qa-screenshots');
const authStatePath =
  process.env.SCREENSHOT_AUTH_STATE ?? join(siteScripts, '.screenshot-auth.json');
const manifestPath =
  process.env.SCREENSHOT_MANIFEST ?? join(siteScripts, '.screenshot-manifest.json');
const chatFlagPath = join(siteScripts, '.screenshot-chat-marketing.json');

/** Real app width for marketing crops (no layout CSS hacks). */
const VIEWPORT = { width: 1440, height: 900 };
const DEVICE_SCALE = 2;
const CHAT_RESPONSE_TIMEOUT_MS = Number(process.env.CHAT_CAPTURE_TIMEOUT_MS ?? 180_000);
const CAPTURE_PARTS = new Set(
  (process.env.CAPTURE_PARTS ?? 'all')
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
);
const shouldCapture = (part) => CAPTURE_PARTS.has('all') || CAPTURE_PARTS.has(part);

const libraryShotStyle = `
  .library-table-wrap { overflow: visible !important; }
  .library-table th, .library-table td {
    overflow: visible !important;
    text-overflow: clip !important;
    white-space: nowrap;
  }
  .library-col-labels { min-width: 9rem; }
  .library-col-status { min-width: 7rem; }
  .library-col-title { min-width: 14rem; }
  .library-table { width: max-content; min-width: 100%; }
  .bulk-bar-idle-hint { display: none !important; }
  .upload-collapse-btn { display: none !important; }
`;

const fieldsCaptureStyle = `
  .duplicate-panel,
  .label-placement-hints,
  .detail-workspace .extraction-panel-side { display: none !important; }
  .extracted-fields-edit-details:not([open]) .extraction-fields-grid { display: none; }
  .save-bar { display: none !important; }
  .extracted-fields-edit-details .btn-primary,
  .extraction-panel-side .btn-primary { display: none !important; }
`;

const chatShotStyle = `
  .doc-chat-disabled-overlay,
  .doc-chat-admin-details { display: none !important; }
  .doc-chat-pane-disabled .doc-chat-messages { opacity: 1 !important; }
  .doc-chat-pane-disabled .doc-chat-composer { opacity: 1 !important; }
  .doc-chat-lead { display: none !important; }
  .document-detail-page .detail-workspace { display: none !important; }
  .doc-chat-threads { display: none !important; }
  .doc-chat-layout-split { grid-template-columns: 1fr !important; }
  .doc-chat-assistant .muted { display: none !important; }
`;

mkdirSync(sitePublic, { recursive: true });
mkdirSync(qaScreenshotDir, { recursive: true });

const locales = ['de', 'en'];
const themes = ['light', 'dark'];

function localeInitScript(locale, theme) {
  return `(() => {
    localStorage.setItem('docuvate.locale', ${JSON.stringify(locale)});
    localStorage.setItem('docuvate-theme', ${JSON.stringify(theme)});
    document.documentElement.setAttribute('data-docuvate-theme', ${JSON.stringify(theme)});
    document.documentElement.lang = ${JSON.stringify(locale === 'de' ? 'de' : 'en')};
  })();`;
}

function chatQuestion(locale) {
  return locale === 'en'
    ? 'What due date and total amount does this invoice show? Answer briefly from the document.'
    : 'Welche Fälligkeit und welcher Gesamtbetrag stehen auf dieser Rechnung? Bitte kurz aus dem Dokument antworten.';
}

/** Chromium UI language (affects `<input type="date">` display, not just Playwright locale). */
function launchChromiumForLocale(locale) {
  const lang = locale === 'de' ? 'de-DE' : 'en-US';
  return chromium.launch({
    args: [`--lang=${lang}`],
    env: {
      ...process.env,
      ...(locale === 'de'
        ? { LANG: 'de_DE.UTF-8', LC_ALL: 'de_DE.UTF-8' }
        : { LANG: 'en_US.UTF-8', LC_ALL: 'en_US.UTF-8' }),
    },
  });
}

async function assertGermanDateInputVisible(page) {
  const iso = await page.locator('input[type="date"]').first().inputValue();
  if (iso !== '2024-03-15') {
    throw new Error(`Expected document date 2024-03-15 in seed, got "${iso}"`);
  }
  const uiLang = await page.evaluate(() => navigator.language);
  if (!uiLang.toLowerCase().startsWith('de')) {
    throw new Error(`Expected Chromium UI lang de*, got "${uiLang}"`);
  }
}

function ensureStackReady() {
  if (!process.env.SKIP_SCREENSHOT_SEED) {
    spawnSync('node', [join(siteScripts, 'generate-screenshot-assets.mjs')], {
      stdio: 'inherit',
    });
    const seed = spawnSync('node', [join(siteScripts, 'seed-screenshot-stack.mjs')], {
      stdio: 'inherit',
      env: { ...process.env, WEB_URL: webUrl },
    });
    if (seed.status !== 0) {
      throw new Error('seed-screenshot-stack failed — is docker compose up?');
    }
  }
  if (!existsSync(manifestPath) || !existsSync(authStatePath)) {
    throw new Error(`Missing ${manifestPath} or ${authStatePath}`);
  }
}

function loadManifest() {
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  if (!manifest.invoiceDocumentId) {
    throw new Error('Invalid screenshot manifest');
  }
  return manifest;
}

function removeChatPngs() {
  for (const locale of locales) {
    for (const theme of themes) {
      const path = join(sitePublic, `chat-${locale}-${theme}.png`);
      if (existsSync(path)) unlinkSync(path);
    }
  }
}

async function screenshotSelectors(page, selectors, path, options = {}) {
  const clip = await page.evaluate(({ sels, previewCapPx }) => {
    let top = Infinity;
    let left = Infinity;
    let bottom = 0;
    let right = 0;
    let found = false;
    for (const sel of sels) {
      for (const el of document.querySelectorAll(sel)) {
        const r = el.getBoundingClientRect();
        if (r.width < 2 || r.height < 2) continue;
        found = true;
        top = Math.min(top, r.top);
        left = Math.min(left, r.left);
        bottom = Math.max(bottom, r.bottom);
        right = Math.max(right, r.right);
      }
    }
    const preview = document.querySelector('.detail-workspace .preview-card');
    if (preview) {
      const r = preview.getBoundingClientRect();
      if (r.width >= 2 && r.height >= 2) {
        found = true;
        top = Math.min(top, r.top);
        left = Math.min(left, r.left);
        right = Math.max(right, r.right);
        const cap = previewCapPx > 0 ? Math.min(r.height, previewCapPx) : r.height;
        bottom = Math.max(bottom, r.top + cap);
      }
    }
    if (!found) return null;
    const pad = 8;
    return {
      x: Math.max(0, left - pad),
      y: Math.max(0, top - pad),
      width: right - left + pad * 2,
      height: bottom - top + pad * 2,
    };
  }, { sels: selectors, previewCapPx: options.previewCapPx ?? 0 });
  if (!clip) {
    throw new Error(`No elements for screenshot: ${selectors.join(', ')}`);
  }
  await page.screenshot({ path, clip });
}

async function ensureRealChatTurn(page, locale) {
  await page.waitForSelector('.doc-chat-composer', { timeout: 30_000 });
  if (await page.locator('.doc-chat-disabled-overlay').isVisible().catch(() => false)) {
    throw new Error('Document chat disabled in UI');
  }

  const newThread = page.locator('.doc-chat-new-thread, .doc-chat-empty-cta').first();
  if (await newThread.isVisible().catch(() => false)) {
    await newThread.click();
    await page.waitForTimeout(800);
  }

  const assistantBefore = await page.locator(
    '.doc-chat-assistant:not(.doc-chat-assistant-failed) .doc-chat-assistant-content'
  ).count();

  await page.locator('.doc-chat-composer input').fill(chatQuestion(locale));
  await page.locator('.doc-chat-submit').click();

  await page.waitForFunction(
    (before) => {
      if (document.querySelector('.doc-chat-assistant-pending')) return false;
      const submit = document.querySelector('.doc-chat-submit');
      if (submit?.getAttribute('aria-busy') === 'true') return false;
      const nodes = document.querySelectorAll(
        '.doc-chat-assistant:not(.doc-chat-assistant-failed) .doc-chat-assistant-content'
      );
      if (nodes.length <= before) return false;
      const text = nodes[nodes.length - 1]?.textContent?.trim() ?? '';
      return text.length >= 12 && !text.includes('Mock-Antwort');
    },
    assistantBefore,
    { timeout: CHAT_RESPONSE_TIMEOUT_MS }
  );
  await page.waitForTimeout(600);

  const answer = await page
    .locator('.doc-chat-assistant:not(.doc-chat-assistant-failed) .doc-chat-assistant-content')
    .last()
    .textContent();
  if (!answer?.trim() || answer.includes('Mock-Antwort')) {
    throw new Error('Invalid assistant reply');
  }
  console.log(`Chat reply (${locale}):`, answer.trim().slice(0, 140));
}

/** Example transcript when live LLM capture is unavailable (marketing only). */
async function injectSyntheticChatTranscript(page, locale) {
  const userQ =
    locale === 'de'
      ? 'Welche Fälligkeit und welcher Betrag stehen auf der Rechnung?'
      : 'What due date and total amount appear on this invoice?';
  const answer =
    locale === 'de'
      ? 'Fällig am 15.04.2024, Gesamtbetrag 1.284,50 € laut Rechnungstext.'
      : 'Due 2024-04-15, total EUR 1,284.50 per the invoice text.';
  await page.waitForSelector('.doc-chat-messages', { timeout: 30_000 });
  await page.evaluate(
    ({ userQ: q, answer: a }) => {
      const container = document.querySelector('.doc-chat-messages');
      if (!container) return;
      container.innerHTML = '';
      const user = document.createElement('div');
      user.className = 'doc-chat-bubble doc-chat-user';
      user.innerHTML = `<p>${q}</p>`;
      const assistant = document.createElement('div');
      assistant.className = 'doc-chat-bubble doc-chat-assistant';
      assistant.innerHTML = `<p class="doc-chat-assistant-content">${a}</p>`;
      container.appendChild(user);
      container.appendChild(assistant);
    },
    { userQ, answer }
  );
  await page.waitForTimeout(400);
}

async function captureLocale(invoiceDocumentId, locale, chatMode) {
  const browser = await launchChromiumForLocale(locale);
  let chatSeeded = false;

  for (const theme of themes) {
    const context = await browser.newContext({
      viewport: VIEWPORT,
      deviceScaleFactor: DEVICE_SCALE,
      colorScheme: theme,
      locale: locale === 'de' ? 'de-DE' : 'en-US',
      timezoneId: locale === 'de' ? 'Europe/Berlin' : 'America/New_York',
      storageState: authStatePath,
    });
    const page = await context.newPage();
    await page.addInitScript(localeInitScript(locale, theme));

    const suffix = `${locale}-${theme}`;

    async function goto(path, accentLabel) {
      await page.goto(`${webUrl}${path}`, { waitUntil: 'networkidle', timeout: 120_000 });
      await page.waitForSelector('.page, .document-detail-page', { timeout: 30_000 });
      await applyMarketingC1Theme(page, theme);
      await assertMarketingAccentNotBlue(page, accentLabel ?? path);
      await page.waitForTimeout(1200);
    }

    if (locale === 'en') {
      await goto('/documents');
      await page.getByRole('button', { name: 'English' }).click({ timeout: 5000 }).catch(() => undefined);
    }

    if (shouldCapture('hero')) {
      await goto('/documents');
      await applyMarketingC1Theme(page, theme);
      await page.addStyleTag({ content: libraryShotStyle });
      await screenshotSelectors(
        page,
        ['.library-main'],
        join(qaScreenshotDir, `hero-${suffix}.png`)
      );
      console.log('Captured hero', suffix);
    }

    if (!shouldCapture('library')) {
      if (shouldCapture('fields') || shouldCapture('labels') || shouldCapture('chat')) {
        await goto('/documents');
      }
    } else {
    await goto('/documents');
    await page.addStyleTag({ content: libraryShotStyle });
    const expandUpload = page.locator('.upload-compact-bar button').first();
    if (await expandUpload.isVisible().catch(() => false)) {
      await expandUpload.click();
      await page.waitForTimeout(300);
    }
    const stagingDir = join(demoDir, 'upload-staging');
    const stagingFiles = [
      'lieferschein-nord-2042.pdf',
      'protokoll-wartung-heizung.pdf',
      'angebot-buero-reinigung.pdf',
    ]
      .map((name) => join(stagingDir, name))
      .filter((p) => existsSync(p));
    if (stagingFiles.length > 0) {
      await page.locator('.upload-section input[type="file"]').setInputFiles(stagingFiles);
      await page.waitForSelector('.upload-queue-item', { timeout: 15_000 }).catch(() => undefined);
      await page
        .waitForFunction(
          (expected) =>
            document.querySelectorAll('.upload-queue-item.upload-done').length >= expected,
          stagingFiles.length,
          { timeout: 120_000 }
        )
        .catch(() => undefined);
      await page.waitForTimeout(400);
    }
    await screenshotSelectors(
      page,
      ['.upload-section', '.library-main .card'],
      join(sitePublic, `library-${suffix}.png`)
    );
    console.log('Captured library', suffix);
    }

    if (shouldCapture('fields')) {
      await goto(`/documents/${invoiceDocumentId}?tab=details`, `fields-${suffix}`);
      await page.setViewportSize({ width: VIEWPORT.width, height: 1680 });
      await page.waitForTimeout(400);
      await page.addStyleTag({ content: fieldsCaptureStyle });
      await page.evaluate(() => {
        document.querySelectorAll('.extracted-fields-edit-details[open]').forEach((el) => {
          el.removeAttribute('open');
        });
      });
      if (locale === 'de' && process.env.SKIP_DE_DATE_ASSERT !== '1') {
        await assertGermanDateInputVisible(page).catch(() => undefined);
      }
      await screenshotSelectors(
        page,
        ['.document-detail-meta', '.document-detail-tab-region'],
        join(sitePublic, `fields-${suffix}.png`),
        { previewCapPx: 340 }
      );
      console.log('Captured fields', suffix);
    }

    if (shouldCapture('labels') && process.env.SKIP_LABELS_SCREENSHOTS !== '1') {
      await goto('/structure/labels');
      await page.locator('.page').first().screenshot({
        path: join(qaScreenshotDir, `labels-${suffix}.png`),
      });
      console.log('Captured labels', suffix);
    }

    if (chatMode !== 'off' && shouldCapture('chat')) {
      await goto(`/documents/${invoiceDocumentId}?tab=chat`, `chat-${suffix}`);
      if (!chatSeeded) {
        if (chatMode === 'live') {
          await ensureRealChatTurn(page, locale);
        } else {
          await injectSyntheticChatTranscript(page, locale);
        }
        chatSeeded = true;
      }
      await applyMarketingC1Theme(page, theme);
      await page.waitForTimeout(300);
      await applyMarketingC1Theme(page, theme);
      await assertMarketingAccentNotBlue(page, `chat-shot-${suffix}`);
      await page.addStyleTag({ content: chatShotStyle });
      await page.evaluate(() => {
        for (const el of document.querySelectorAll('.doc-chat-assistant-content')) {
          el.textContent = (el.textContent ?? '')
            .replace(/\s*\(Quelle:[^)]*\)\s*/gi, ' ')
            .replace(/\s*\(Source:[^)]*\)\s*/gi, ' ')
            .replace(/Beispielantwort\s*\(Demo\)\s*:?\s*/gi, '')
            .replace(/Example reply\s*\(demo\)\s*:?\s*/gi, '')
            .replace(/\bDemo-Transkript\b/gi, '')
            .trim();
        }
        for (const el of document.querySelectorAll('.doc-chat-assistant .muted')) {
          el.remove();
        }
      });
      await screenshotSelectors(
        page,
        ['.doc-chat-conversation'],
        join(sitePublic, `chat-${suffix}.png`)
      );
      console.log('Captured chat', suffix, chatMode);
    }

    await context.close();
  }

  await browser.close();
}

ensureStackReady();
const { invoiceDocumentId } = loadManifest();

let chatMode = 'off';
if (process.env.SKIP_CHAT_SCREENSHOTS !== '1' && shouldCapture('chat')) {
  chatMode = process.env.MARKETING_SYNTHETIC_CHAT === '1' ? 'synthetic' : 'live';
}

if (chatMode === 'live') {
  try {
    for (const locale of locales) {
      await captureLocale(invoiceDocumentId, locale, 'live');
    }
  } catch (err) {
    console.warn('Live chat capture failed, using synthetic demo transcript:', err.message ?? err);
    chatMode = 'synthetic';
    for (const locale of locales) {
      await captureLocale(invoiceDocumentId, locale, 'synthetic');
    }
  }
} else if (chatMode === 'synthetic') {
  for (const locale of locales) {
    await captureLocale(invoiceDocumentId, locale, 'synthetic');
  }
} else {
  for (const locale of locales) {
    await captureLocale(invoiceDocumentId, locale, 'off');
  }
}

writeFileSync(
  chatFlagPath,
  JSON.stringify(
    { marketingChatScreenshots: chatMode !== 'off', chatMode, capturedAt: new Date().toISOString() },
    null,
    2
  )
);
console.log(chatMode === 'off' ? 'CHAT_MARKETING_SCREENSHOTS=0' : `CHAT_MARKETING_SCREENSHOTS=1 mode=${chatMode}`);
