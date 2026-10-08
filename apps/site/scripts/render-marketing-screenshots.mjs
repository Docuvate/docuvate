#!/usr/bin/env node
/**
 * Re-render all committed marketing PNGs (app crops + labels + landing full pages).
 *
 * Prerequisites:
 *   docker compose up -d   # real Ollama + qwen2.5:3b for document chat PNGs
 *   Optional #71 labels web on :5173 (replace main web container during labels step).
 *
 * Usage (from repo root):
 *   node apps/site/scripts/render-marketing-screenshots.mjs
 *
 * Partial re-render (e.g. fields only after main UI merges):
 *   CAPTURE_PARTS=fields SKIP_LABELS_SCREENSHOTS=1 node apps/site/scripts/capture-app-screenshots.mjs
 */
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const siteScripts = dirname(fileURLToPath(import.meta.url));

function run(label, args, env = {}) {
  console.log(`\n== ${label} ==`);
  const result = spawnSync('node', args, {
    cwd: siteScripts,
    stdio: 'inherit',
    env: { ...process.env, ...env },
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

run('App screenshots (hero, library, fields, chat)', ['capture-app-screenshots.mjs'], {
  SKIP_LABELS_SCREENSHOTS: '1',
});

run('Labels screenshots (#71 web on WEB_URL)', ['capture-labels-screenshots.mjs']);

run('Folders / Ordnerbaum', ['capture-folders-screenshots.mjs']);

run('Landing/docs full pages', ['capture-screenshots.mjs']);

const chatFlag = join(siteScripts, '.screenshot-chat-marketing.json');
if (existsSync(chatFlag)) {
  const { marketingChatScreenshots } = JSON.parse(readFileSync(chatFlag, 'utf8'));
  console.log(`\nChat marketing PNGs: ${marketingChatScreenshots ? 'yes' : 'no (update content marketingScreenshot if needed)'}`);
}
