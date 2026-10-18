// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { LabelRecommendationDto } from '@docuvate/contracts';
import i18next from 'i18next';
import { describe, expect, it } from 'vitest';

import de from '../../i18n/locales/de.json';
import en from '../../i18n/locales/en.json';
import { todoWhyLine } from './labelsTodoPresentation';

function rec(
  partial: Partial<LabelRecommendationDto> & Pick<LabelRecommendationDto, 'id' | 'kind' | 'score'>
): LabelRecommendationDto {
  return { reason: '', ...partial };
}

async function tFor(lng: 'de' | 'en') {
  const instance = i18next.createInstance();
  await instance.init({
    lng,
    resources: { de: { translation: de }, en: { translation: en } },
  });
  return instance.t.bind(instance);
}

describe('todoWhyLine', () => {
  it('uses plain assign copy without percentages (DE)', async () => {
    const t = await tFor('de');
    const line = todoWhyLine(
      rec({
        id: 'a',
        kind: 'assign',
        score: 1,
        tagId: 'tag-bilanz',
        nearestTagName: 'Bilanz',
        tagNames: ['Bilanz'],
      }),
      t,
      { 'tag-bilanz': 2 }
    );
    expect(line).toBe('Inhalt ähnelt 2 Dokumenten mit diesem Label.');
    expect(line).not.toMatch(/Labelraum|Zentren|100\s*%/);
  });

  it('uses plain merge copy without percentages (EN)', async () => {
    const t = await tFor('en');
    const line = todoWhyLine(
      rec({
        id: 'm',
        kind: 'merge',
        score: 1,
        tagIds: ['a', 'b'],
        tagNames: ['Invoice', 'Invoices'],
      }),
      t,
      { a: 3, b: 3 }
    );
    expect(line).toBe('Nearly the same name, both with 3 documents of similar content.');
    expect(line).not.toMatch(/100\s*%|centroid|embedding space/i);
  });
});
