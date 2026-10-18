// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it } from 'vitest';

import { importRefMatchesSourceScope } from './connector-source-scope.util.js';

describe('importRefMatchesSourceScope', () => {
  it('allows all refs in all mode', () => {
    expect(importRefMatchesSourceScope({ mode: 'all', paths: [] }, 'inbox/a.pdf')).toBe(true);
  });

  it('matches selected prefix and nested paths', () => {
    const scope = { mode: 'selected' as const, paths: ['inbox/'] };
    expect(importRefMatchesSourceScope(scope, 'inbox/a.pdf')).toBe(true);
    expect(importRefMatchesSourceScope(scope, 'archive/a.pdf')).toBe(false);
  });
});
