import { describe, expect, it } from 'vitest';
import type { DocumentDto, LabelRecommendationDto } from '@docuvate/contracts';
import { enrichMergeRecommendations, prepareLabelQueue, sortLabelQueue } from './labelsQueue';

function rec(
  partial: Partial<LabelRecommendationDto> & Pick<LabelRecommendationDto, 'id' | 'kind' | 'score'>
): LabelRecommendationDto {
  return {
    reason: '',
    ...partial,
  };
}

function doc(id: string, tagIds: string[]): DocumentDto {
  return {
    id,
    filename: `${id}.pdf`,
    title: id,
    status: 'ready',
    mimeType: 'application/pdf',
    tags: tagIds.map((tagId) => ({
      id: tagId,
      name: tagId,
      isInbox: false,
    })),
    createdAt: '',
    updatedAt: '',
  };
}

describe('sortLabelQueue', () => {
  it('orders assign and new before merge and rename', () => {
    const items = [
      rec({ id: 'm', kind: 'merge', score: 99 }),
      rec({ id: 'a', kind: 'assign', score: 1 }),
      rec({ id: 'n', kind: 'new', score: 50 }),
      rec({ id: 'r', kind: 'rename', score: 80 }),
    ];
    expect(sortLabelQueue(items).map((i) => i.id)).toEqual(['a', 'n', 'm', 'r']);
  });

  it('sorts within the same kind by descending score', () => {
    const items = [
      rec({ id: 'a1', kind: 'assign', score: 10 }),
      rec({ id: 'a2', kind: 'assign', score: 40 }),
    ];
    expect(sortLabelQueue(items).map((i) => i.id)).toEqual(['a2', 'a1']);
  });
});

describe('enrichMergeRecommendations', () => {
  it('attaches sample documents from both merge tags', () => {
    const items = [
      rec({
        id: 'merge:1',
        kind: 'merge',
        score: 80,
        tagIds: ['tag-a', 'tag-b'],
      }),
    ];
    const documents = [
      doc('d1', ['tag-a']),
      doc('d2', ['tag-a']),
      doc('d3', ['tag-b']),
    ];
    const enriched = enrichMergeRecommendations(items, documents, 1);
    expect(enriched[0]?.sampleDocuments?.map((d) => d.id)).toEqual(['d1', 'd3']);
  });
});

describe('prepareLabelQueue', () => {
  it('combines enrichment and sorting', () => {
    const items = [
      rec({ id: 'm', kind: 'merge', score: 90, tagIds: ['a', 'b'] }),
      rec({ id: 'n', kind: 'new', score: 5 }),
    ];
    const prepared = prepareLabelQueue(items, [doc('x', ['a'])]);
    expect(prepared.map((i) => i.id)).toEqual(['n', 'm']);
    expect(prepared[1]?.sampleDocuments?.length).toBeGreaterThan(0);
  });
});
