// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { existsSync, readdirSync,readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

const FORBIDDEN = [
  /extracted_fields/,
  /document_stack_members\.user_id/,
  /chat_thread_documents\.user_id/,
  /document_embeddings\.user_id/,
  /tag_embedding_centroids\.user_id/,
  /document_text_chunks\.user_id/,
  /tag_embedding_centroid_observations/,
  /INSERT INTO (?:document_embeddings|document_stack_members|chat_thread_documents|document_text_chunks|tag_embedding_centroids) \([^)]*\buser_id\b/,
];

function collectFiles(dir: string, acc: string[] = []): string[] {
  if (!existsSync(dir)) return acc;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
      collectFiles(full, acc);
    } else if (entry.name.endsWith('.py') || entry.name.endsWith('.mjs')) {
      acc.push(full);
    }
  }
  return acc;
}

describe('worker and seed schema wiring', () => {
  it('does not reference extracted_fields JSONB or dropped owner columns', () => {
    const root = join(process.cwd(), '..', '..');
    const workerSrc = join(root, 'apps', 'worker', 'src');
    const scriptsDir = join(root, 'scripts');
    const toolsDir = join(root, 'tools');
    const sources = [
      ...collectFiles(workerSrc),
      ...collectFiles(scriptsDir),
      ...collectFiles(toolsDir),
    ].map((path) => readFileSync(path, 'utf8'));
    for (const source of sources) {
      for (const pattern of FORBIDDEN) {
        expect(source).not.toMatch(pattern);
      }
    }
  });
});
