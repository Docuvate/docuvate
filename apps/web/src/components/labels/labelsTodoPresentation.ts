import type { TFunction } from 'i18next';
import type { LabelRecommendationDto } from '@docuvate/contracts';

export function todoWhyLine(
  item: LabelRecommendationDto,
  t: TFunction,
  documentCountByTagId: Record<string, number>
): string {
  if (item.kind === 'assign') {
    const taggedCount = item.tagId ? (documentCountByTagId[item.tagId] ?? 0) : 0;
    const count = taggedCount > 0 ? taggedCount : (item.sampleDocuments?.length ?? 1);
    return t('labels.todoWhyAssignSimilarContent', { count });
  }
  if (item.kind === 'new') {
    return item.source === 'text'
      ? t('labels.todoWhyNewText')
      : t('labels.todoWhyNewEmbedding');
  }
  if (item.kind === 'merge') {
    const idA = item.tagIds?.[0];
    const idB = item.tagIds?.[1];
    const countA = idA ? (documentCountByTagId[idA] ?? 0) : 0;
    const countB = idB ? (documentCountByTagId[idB] ?? 0) : 0;
    const count = Math.min(countA, countB) || countA || countB;
    return t('labels.todoWhyMergeNearName', { count });
  }
  if (item.kind === 'rename') {
    return item.reason?.trim() || t('labelRecommendations.typeRename');
  }
  return item.reason?.trim() ?? '';
}

export function todoBadgeLabel(item: LabelRecommendationDto, t: TFunction): string {
  switch (item.kind) {
    case 'assign':
      return t('labels.todoBadgeAssign');
    case 'new':
      return t('labels.todoBadgeNew');
    case 'merge':
      return t('labels.todoBadgeMerge');
    case 'rename':
      return t('labelRecommendations.badgeRename');
    default: {
      const _exhaustive: never = item.kind;
      void _exhaustive;
      return '';
    }
  }
}

export function recommendationLabelName(item: LabelRecommendationDto): string {
  if (item.kind === 'new') {
    return item.proposedName ?? item.id;
  }
  if (item.kind === 'assign') {
    return item.nearestTagName ?? item.tagNames?.[0] ?? item.id;
  }
  if (item.kind === 'rename') {
    return item.proposedName ?? item.currentName ?? item.id;
  }
  if (item.kind === 'merge' && item.tagNames?.length) {
    return item.tagNames.join(' / ');
  }
  return item.id;
}

export function todoAcceptActionKey(item: LabelRecommendationDto): string {
  switch (item.kind) {
    case 'assign':
      return 'labels.todoActionAssign';
    case 'new':
      return 'labels.todoActionNew';
    case 'merge':
      return 'labels.todoActionMerge';
    case 'rename':
      return 'labelRecommendations.renameAction';
    default: {
      const _exhaustive: never = item.kind;
      void _exhaustive;
      return 'labelRecommendations.acceptAction';
    }
  }
}

export function mergeLabelPairNames(item: LabelRecommendationDto): { keep: string; remove: string } | null {
  if (item.kind !== 'merge' || item.tagNames?.length !== 2) {
    return null;
  }
  return { keep: item.tagNames[0]!, remove: item.tagNames[1]! };
}

export function syncVisibleQueueIds(prev: string[], nextItems: LabelRecommendationDto[]): string[] {
  const nextIds = nextItems.map((i) => i.id);
  const nextIdSet = new Set(nextIds);
  const kept = prev.filter((id) => nextIdSet.has(id));
  const keptSet = new Set(kept);
  const added = nextIds.filter((id) => !keptSet.has(id));
  return [...kept, ...added];
}
