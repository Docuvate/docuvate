#!/usr/bin/env node
// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
/**
 * Patch layout IR after fixture uploads (brutto widget suggestion only).
 */
import { createRequire } from 'node:module';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '../../..');
const require = createRequire(path.join(REPO_ROOT, 'apps/api/package.json'));
const pg = require('pg');
const DATABASE_URL =
  process.env.DATABASE_URL ?? 'postgresql://docuvate:docuvate@127.0.0.1:5433/docuvate';
const DOC_MAP = process.env.LAYOUT_DOC_MAP ?? path.join(__dirname, 'doc-ids.json');

const pool = new pg.Pool({ connectionString: DATABASE_URL });

async function loadDocIds() {
  const raw = await readFile(DOC_MAP, 'utf8');
  return JSON.parse(raw);
}

async function injectBruttoWidget(documentId) {
  const { rows } = await pool.query(`SELECT ir FROM document_layout_ir WHERE document_id = $1`, [
    documentId,
  ]);
  if (!rows[0]?.ir) return;
  const ir = rows[0].ir;
  const page = ir.pages?.[0];
  if (!page) return;
  page.widgets = page.widgets ?? [];
  const hasBrutto = page.widgets.some((w) => w.fieldName === 'brutto');
  if (!hasBrutto) {
    page.widgets.push({
      kind: 'text',
      page: 1,
      x: 0.34,
      y: 0.19,
      width: 0.22,
      height: 0.025,
      fieldName: 'brutto',
      value: '12.500,00',
    });
  }
  await pool.query(`UPDATE document_layout_ir SET ir = $2::jsonb WHERE document_id = $1`, [
    documentId,
    ir,
  ]);
}

async function main() {
  const ids = await loadDocIds();
  if (!ids.brutto) throw new Error('doc-ids.json missing brutto');
  await injectBruttoWidget(ids.brutto);
  await pool.end();
  console.log('Patched brutto widget on', ids.brutto);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
