import { chromium } from 'playwright';
import { readFileSync, appendFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const siteRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const storeDir = process.env.LANDING_R5_STORE ?? '/cursor/stores/self/landing-r5';
const baseUrl = process.env.SITE_URL ?? 'http://127.0.0.1:8081';

const dashDe = execSync("rg -n '[\\u2013\\u2014\\u2012]|—|–' src/content/de.ts || true", {
  cwd: siteRoot,
  encoding: 'utf8',
});
const dashEn = execSync("rg -n '[\\u2013\\u2014\\u2012]|—|–' src/content/en.ts || true", {
  cwd: siteRoot,
  encoding: 'utf8',
});

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(`${baseUrl}/`, { waitUntil: 'networkidle' });
const titles = await page.locator('.landing-product-card-title').allTextContents();
const chatTitle = titles.find((t) => t.includes('Dokumenten') || t.includes('Chat'));
const badBreak = chatTitle && /Dokumenten-C[^h]|Dokumenten-\s+C/i.test(chatTitle);
await browser.close();

const lines = [
  '',
  '## Automated content verification',
  '',
  `### Em/en dash (de.ts): ${dashDe.trim() ? 'FAIL' : '0 matches'}`,
  dashDe.trim() || '- none',
  '',
  `### Em/en dash (en.ts): ${dashEn.trim() ? 'FAIL' : '0 matches'}`,
  dashEn.trim() || '- none',
  '',
  '### Product card chat title (1440 light)',
  `- Text: \`${chatTitle ?? 'missing'}\``,
  `- Mid-word break: ${badBreak ? 'FAIL' : 'OK'}`,
  '',
];
appendFileSync(join(storeDir, 'index.md'), lines.join('\n'));
console.log(lines.join('\n'));
