// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const STYLESHEETS = [
  '../styles/foundations.css',
  '../styles/app.css',
  '../components/ui/components.css',
  '../components/ui/ds.css',
];

/** Classes that sit on a `<dialog>` element itself (not on its children). */
const DIALOG_ELEMENT_CLASS = /\.(dv-dialog|confirm-dialog)(?![\w-])/;

interface CssRule {
  selectors: string[];
  body: string;
}

function readRules(relativePath: string): CssRule[] {
  const css = readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), 'utf8').replace(
    /\/\*[\s\S]*?\*\//g,
    ''
  );
  const rules: CssRule[] = [];
  for (const match of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    rules.push({ selectors: match[1].split(',').map((s) => s.trim()), body: match[2] });
  }
  return rules;
}

function lastCompound(selector: string): string {
  const parts = selector.split(/\s+|>|\+|~/).filter(Boolean);
  return parts[parts.length - 1] ?? '';
}

describe('dialog display rules', () => {
  it('only open dialogs set display, so closed dialogs never leak into the page', () => {
    const offenders: string[] = [];
    for (const sheet of STYLESHEETS) {
      for (const rule of readRules(sheet)) {
        if (!/(^|;)\s*display\s*:/.test(rule.body)) continue;
        for (const selector of rule.selectors) {
          const target = lastCompound(selector);
          if (!DIALOG_ELEMENT_CLASS.test(target) || target.includes('::')) continue;
          if (!target.includes('[open]')) offenders.push(`${sheet}: ${selector}`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  it('keeps the global guard that hides closed dialogs', () => {
    const guard = readRules('../styles/foundations.css').find((rule) =>
      rule.selectors.includes('dialog:not([open])')
    );
    expect(guard?.body).toMatch(/display\s*:\s*none/);
  });
});
