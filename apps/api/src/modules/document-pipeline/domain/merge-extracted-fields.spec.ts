import { describe, expect, it } from 'vitest';
import type { ExtractedField } from '@docuvate/contracts';
import {
  dedupeExtractedFields,
  isPlausibleExtractedDateValue,
} from '@docuvate/contracts';
import { mergeExtractedFields } from './merge-extracted-fields.js';

describe('isPlausibleExtractedDateValue', () => {
  it('accepts common DE and ISO date strings', () => {
    expect(isPlausibleExtractedDateValue('16.06.2024')).toBe(true);
    expect(isPlausibleExtractedDateValue(' 16.06.2024 ')).toBe(true);
    expect(isPlausibleExtractedDateValue('2024-06-16')).toBe(true);
    expect(isPlausibleExtractedDateValue('16/06/2024')).toBe(true);
  });

  it('rejects label bleed-through and empty values', () => {
    expect(isPlausibleExtractedDateValue('Ist-Technologie:')).toBe(false);
    expect(isPlausibleExtractedDateValue('')).toBe(false);
    expect(isPlausibleExtractedDateValue('   ')).toBe(false);
  });
});

describe('dedupeExtractedFields', () => {
  it('drops implausible datum rows and keeps the valid date', () => {
    const fields: ExtractedField[] = [
      { key: 'global:datum', value: 'Ist-Technologie:', confidence: 0.95 },
      { key: 'date', value: '16.06.2024', confidence: 0.4 },
    ];
    const deduped = dedupeExtractedFields(fields);
    expect(deduped).toHaveLength(1);
    expect(deduped[0]?.value).toBe('16.06.2024');
  });

  it('collapses plain date and global datum to one global field', () => {
    const fields: ExtractedField[] = [
      { key: 'date', value: '16.04.2025', confidence: 0.55 },
      { key: 'global:datum', value: '16.04.2025', confidence: 0.78 },
      { key: 'vendor', value: 'Firma', confidence: 0.5 },
    ];
    const deduped = dedupeExtractedFields(fields);
    expect(deduped).toHaveLength(2);
    expect(deduped.map((f) => f.key).sort()).toEqual(['global:datum', 'vendor']);
  });

  it('prefers label-scoped field over global for the same semantic key', () => {
    const fields: ExtractedField[] = [
      { key: 'global:datum', value: '01.01.2025', confidence: 0.9 },
      {
        key: 'label:11111111-1111-4111-8111-111111111111:datum',
        value: '16.04.2025',
        confidence: 0.8,
        tagId: '11111111-1111-4111-8111-111111111111',
      },
    ];
    const deduped = dedupeExtractedFields(fields);
    expect(deduped).toHaveLength(1);
    expect(deduped[0]?.key).toMatch(/^label:/);
  });
});

describe('mergeExtractedFields', () => {
  it('dedupes after merging patches', () => {
    const existing: ExtractedField[] = [{ key: 'date', value: '16.04.2025' }];
    const patches: ExtractedField[] = [
      { key: 'global:datum', value: '16.04.2025', confidence: 0.75 },
    ];
    const merged = mergeExtractedFields(existing, patches);
    expect(merged).toHaveLength(1);
    expect(merged[0]?.key).toBe('global:datum');
  });
});
