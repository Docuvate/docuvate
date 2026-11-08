// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { documentDisplayDateParts } from './libraryDocumentUtils';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../../..');

describe('documentDisplayDateParts', () => {
  it('formats ISO timestamps with locale instead of raw strings', () => {
    const parts = documentDisplayDateParts(
      {
        documentDate: null,
        createdAt: '2026-03-15T14:30:00.000Z',
        updatedAt: '2026-03-16T08:00:00.000Z',
      },
      'en-US'
    );
    expect(parts.text).not.toContain('T');
    expect(parts.text).not.toMatch(/2026-03-15T/);
  });

  it('uses date-only text for table style (time belongs in tooltip)', () => {
    const full = documentDisplayDateParts(
      {
        documentDate: null,
        createdAt: '2026-03-15T14:30:00.000Z',
        updatedAt: '2026-03-16T08:00:00.000Z',
      },
      'en-US',
      'full'
    );
    const table = documentDisplayDateParts(
      {
        documentDate: null,
        createdAt: '2026-03-15T14:30:00.000Z',
        updatedAt: '2026-03-16T08:00:00.000Z',
      },
      'en-US',
      'table'
    );
    expect(table.text).not.toContain(':');
    expect(full.text.length).toBeGreaterThan(table.text.length);
  });

  it('formats German locale dates', () => {
    const parts = documentDisplayDateParts(
      {
        documentDate: '2026-03-15',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-02T00:00:00.000Z',
      },
      'de-DE'
    );
    expect(parts.text).toMatch(/15/);
    expect(parts.text).not.toContain('2026-03-15T');
  });

  it('keeps a YYYY-MM-DD document date on that calendar day west of UTC', () => {
    const script = `
      import { documentDisplayDateParts } from './apps/web/src/components/library/libraryDocumentUtils.ts';
      const parts = documentDisplayDateParts({
        documentDate: '2026-10-22',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-02T00:00:00.000Z',
      }, 'en-US');
      if (parts.text !== 'Oct 22, 2026') {
        console.error(parts.text);
        process.exit(1);
      }
    `;
    const tsxBin = path.join(repoRoot, 'node_modules', '.bin', 'tsx');
    let stdout = '';
    try {
      stdout = execFileSync(tsxBin, ['--eval', script], {
        cwd: repoRoot,
        env: { ...process.env, TZ: 'America/Los_Angeles' },
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
      });
    } catch (error) {
      const stderr = error instanceof Error && 'stderr' in error ? String(error.stderr).trim() : '';
      throw new Error(stderr.length > 0 ? stderr : 'document date shifted west of UTC', {
        cause: error,
      });
    }
    expect(stdout).not.toContain('Oct 21');
  });
});
