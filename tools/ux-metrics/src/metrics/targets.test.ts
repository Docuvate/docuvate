import { describe, expect, it } from 'vitest';
import { evaluateTargetSize } from './targets.js';

describe('evaluateTargetSize', () => {
  it('fails WCAG for tiny control', () => {
    const f = evaluateTargetSize({
      route: '/test',
      selectorHint: 'button',
      role: 'button',
      name: 'x',
      box: { x: 0, y: 0, width: 20, height: 20 },
      isPrimaryControl: false,
      hasIcon: false,
      iconBox: null,
      buttonGroupSiblingHeight: null,
    });
    expect(f.wcag258Pass).toBe(false);
  });

  it('requires 40px height for primary controls', () => {
    const f = evaluateTargetSize({
      route: '/test',
      selectorHint: 'button.primary',
      role: 'button',
      name: 'Save',
      box: { x: 0, y: 0, width: 80, height: 32 },
      isPrimaryControl: true,
      hasIcon: false,
      iconBox: null,
      buttonGroupSiblingHeight: null,
    });
    expect(f.primaryHeightPass).toBe(false);
  });
});
