// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { randomUUID } from 'node:crypto';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

function syntheticUploadPath(): string {
  return join(process.cwd(), 'fixtures/synthetic-upload.pdf');
}

/**
 * Known-good smoke PDF (Workstream B). Do not rewrite the content stream —
 * the worker treats generated/stamped PDFs as a permanent extract 422.
 * Append a unique comment after %%EOF so the content-hash does not collide
 * with smoke-seed's exact fixture (same pattern as Workstream B).
 */
export async function deliveryNoteTablePdf(uniqueToken = 'static'): Promise<Buffer> {
  const base = readFileSync(syntheticUploadPath());
  const token = uniqueToken.trim().length > 0 ? uniqueToken : randomUUID().replace(/-/g, '').slice(0, 12);
  return Buffer.concat([base, Buffer.from(`\n%%LAYOUT_TABLE_FIXTURE=${token}\n`, 'utf8')]);
}

/** Synthetic delivery-note PDF with a detectable layout table (worker fixture). */
export async function deliveryNoteTablePdfPath(): Promise<string> {
  const dir = mkdtempSync(join(tmpdir(), 'docuvate-e2e-table-'));
  const out = join(dir, 'delivery-note-table.pdf');
  writeFileSync(out, await deliveryNoteTablePdf());
  return out;
}
