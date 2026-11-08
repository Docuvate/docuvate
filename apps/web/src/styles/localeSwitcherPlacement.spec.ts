// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

describe('signed-in language switcher', () => {
  it('is not removed from the desktop account menu', () => {
    const cssPath = join(dirname(fileURLToPath(import.meta.url)), 'app.css');
    const css = readFileSync(cssPath, 'utf8');
    const desktopMenuHidden =
      /@media\s*\(\s*min-width:\s*769px\s*\)\s*\{[^}]*\.locale-switcher-wrap--menu[^}]*display:\s*none/s.test(
        css
      );
    expect(desktopMenuHidden).toBe(false);
  });
});
