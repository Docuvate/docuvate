import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const siteRoot = join(fileURLToPath(import.meta.url), '..', '..');
import { prerenderRoutes } from './prerender-routes.mjs';

const baseUrl = process.env.SITE_URL ?? 'https://docuvate.de';
const paths = prerenderRoutes;

const urls = paths
  .map(
    (p) => `  <url><loc>${baseUrl}${p === '/' ? '' : p}</loc><changefreq>weekly</changefreq></url>`
  )
  .join('\n');

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;

writeFileSync(join(siteRoot, 'dist', 'sitemap.xml'), xml);
console.log('Wrote sitemap.xml');
