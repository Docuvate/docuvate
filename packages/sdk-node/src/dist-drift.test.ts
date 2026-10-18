// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: MIT
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const pkgRoot = join(dirname(fileURLToPath(import.meta.url)), '..');

function exportedOperationsFromGen(relativePath: string): string[] {
  const text = readFileSync(join(pkgRoot, relativePath), 'utf8');
  const names: string[] = [];
  const re = /^export const (\w+) = /gm;
  let match = re.exec(text);
  while (match) {
    names.push(match[1]);
    match = re.exec(text);
  }
  return names.sort();
}

describe('committed dist matches generated SDK', () => {
  it('dist bundle includes every generated operation (incl. globalSearch)', () => {
    const fromSrc = exportedOperationsFromGen('src/generated/sdk.gen.ts');
    const distBundle = readFileSync(join(pkgRoot, 'dist/index.cjs'), 'utf8');
    for (const name of fromSrc) {
      expect(distBundle, `missing operation ${name}`).toMatch(new RegExp(`\\b${name}\\b`));
    }
    expect(fromSrc).toContain('globalSearch');
    expect(fromSrc.length).toBeGreaterThanOrEqual(83);
  });
});
