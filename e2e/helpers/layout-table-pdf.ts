// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

function syntheticUploadPath(): string {
  return join(process.cwd(), 'fixtures/synthetic-upload.pdf');
}

/**
 * Known-good smoke PDF (Workstream B). Do not rewrite the bytes — the worker
 * treats many generated/stamped PDFs as a permanent extract 422.
 */
export async function deliveryNoteTablePdf(_uniqueToken = 'static'): Promise<Buffer> {
  return readFileSync(syntheticUploadPath());
}

/** Synthetic delivery-note PDF with a detectable layout table (worker fixture). */
export async function deliveryNoteTablePdfPath(): Promise<string> {
  const dir = mkdtempSync(join(tmpdir(), 'docuvate-e2e-table-'));
  const out = join(dir, 'delivery-note-table.pdf');
  writeFileSync(out, await deliveryNoteTablePdf());
  return out;
}
