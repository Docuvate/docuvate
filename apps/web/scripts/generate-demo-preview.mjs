import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const outDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'demo');
mkdirSync(outDir, { recursive: true });

const invoiceHtml = `<!doctype html><html><head><meta charset="utf-8"/><style>
body{margin:0;font-family:system-ui,sans-serif;background:#f4f6f9;color:#1a1a1a}
.sheet{width:960px;height:1200px;background:#fff;box-shadow:0 8px 32px rgba(0,0,0,.08);padding:48px}
h1{font-size:28px;margin:0 0 24px}
.meta{color:#444;line-height:1.7;font-size:18px}
.bar{height:4px;width:120px;background:#3d7dd6;margin:24px 0}
</style></head><body><div class="sheet"><h1>Rechnung 2024-001</h1><div class="bar"></div><div class="meta">
<p><strong>Nordbeispiel Beratung GmbH</strong></p>
<p>Betrag: 1.240,00 EUR</p>
<p>Fälligkeit: 15.03.2024</p>
<p>Leistungszeitraum: Q4 2023</p>
</div></div></body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 960, height: 1200 } });
await page.setContent(invoiceHtml);
await page.screenshot({ path: join(outDir, 'invoice-preview.png') });
await page.pdf({
  path: join(outDir, 'rechnung-beispiel-2024-001.pdf'),
  width: '960px',
  height: '1200px',
  printBackground: true,
});
await browser.close();
console.log('Wrote demo invoice PNG and PDF');
