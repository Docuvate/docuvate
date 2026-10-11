import { spawnSync } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

let cachedPdfPath: string | null = null;

/** Synthetic delivery-note PDF with a detectable layout table (worker fixture). */
export function deliveryNoteTablePdfPath(): string {
  if (cachedPdfPath) {
    return cachedPdfPath;
  }
  const dir = mkdtempSync(join(tmpdir(), 'docuvate-e2e-table-'));
  const out = join(dir, 'delivery-note-table.pdf');
  const workerTests = join(process.cwd(), '..', 'apps/worker/tests');
  const script = `
import sys
from pathlib import Path
sys.path.insert(0, ${JSON.stringify(workerTests)})
from synthetic_layout_pdfs import delivery_note_table_pdf
Path(${JSON.stringify(out)}).write_bytes(delivery_note_table_pdf())
`;
  const result = spawnSync('python3', ['-c', script], { encoding: 'utf8' });
  if (result.status !== 0) {
    throw new Error(result.stderr || 'failed to build delivery note table PDF');
  }
  cachedPdfPath = out;
  return out;
}
