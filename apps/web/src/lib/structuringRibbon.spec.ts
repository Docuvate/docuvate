// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it } from 'vitest';

import {
  aspectForPrimary,
  commandForPrimary,
  contextToolsFor,
  primaryForAspect,
  STRUCTURING_PRIMARIES,
} from './structuringRibbon';

describe('structuring ribbon contract', () => {
  it('maps every aspect onto one primary and back', () => {
    expect(primaryForAspect('ocr')).toBe('text');
    expect(primaryForAspect('labels')).toBe('labels');
    expect(primaryForAspect('layout')).toBe('layout');
    expect(primaryForAspect('fields')).toBe('fields');
    for (const primary of STRUCTURING_PRIMARIES) {
      expect(primaryForAspect(aspectForPrimary(primary))).toBe(primary);
    }
  });

  it('opens text as a text stage with correction tools, not a scroll', () => {
    expect(commandForPrimary('text')).toEqual({
      primary: 'text',
      stage: 'text',
      context: 'text',
      layoutTab: null,
      inspector: null,
    });
  });

  it('opens layout as the page with region tools and the table tab, not a scroll', () => {
    expect(commandForPrimary('layout')).toEqual({
      primary: 'layout',
      stage: 'page',
      context: 'layout',
      layoutTab: 'tables',
      inspector: null,
    });
  });

  it('keeps labels and fields on the page and hides the third row', () => {
    expect(commandForPrimary('labels').context).toBeNull();
    expect(commandForPrimary('labels').inspector).toBe('labels');
    expect(commandForPrimary('fields').context).toBeNull();
    expect(commandForPrimary('fields').inspector).toBe('fields');
    expect(contextToolsFor('labels', { textDirty: true, hasOverlays: true })).toEqual([]);
    expect(contextToolsFor('fields', { textDirty: true, hasOverlays: true })).toEqual([]);
    expect(contextToolsFor(null, { textDirty: true, hasOverlays: true })).toEqual([]);
  });

  it('disables save when the text is clean and overlay when the page has no regions', () => {
    const text = contextToolsFor('text', { textDirty: false, hasOverlays: false });
    expect(text.find((tool) => tool.id === 'edit-text')).toEqual({
      id: 'edit-text',
      enabled: true,
      reason: null,
    });
    expect(text.find((tool) => tool.id === 'save-text')).toEqual({
      id: 'save-text',
      enabled: false,
      reason: 'clean',
    });
    const dirty = contextToolsFor('text', { textDirty: true, hasOverlays: false });
    expect(dirty.find((tool) => tool.id === 'save-text')?.enabled).toBe(true);

    const layout = contextToolsFor('layout', { textDirty: false, hasOverlays: false });
    expect(layout.map((tool) => tool.id)).toEqual(['pointer', 'text-select', 'region', 'overlay']);
    expect(layout.find((tool) => tool.id === 'overlay')).toEqual({
      id: 'overlay',
      enabled: false,
      reason: 'no-regions',
    });
    const withRegions = contextToolsFor('layout', { textDirty: false, hasOverlays: true });
    expect(withRegions.find((tool) => tool.id === 'overlay')?.enabled).toBe(true);
  });
});
