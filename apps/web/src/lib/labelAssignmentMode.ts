// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { CreateTagRequest, MatchingAlgorithm, TagDto } from '@docuvate/contracts';

/** UI-only assignment modes mapped to inbox + matchingAlgorithm. */
export type LabelAssignmentMode =
  'never' | 'recommend' | 'inbox' | 'any' | 'all' | 'exact' | 'regex';

export const LABEL_ASSIGNMENT_MODES: LabelAssignmentMode[] = [
  'never',
  'recommend',
  'inbox',
  'any',
  'all',
  'exact',
  'regex',
];

export function labelAssignmentModeLabelKey(mode: LabelAssignmentMode): string {
  switch (mode) {
    case 'never':
      return 'labels.assignNever';
    case 'recommend':
      return 'labels.assignRecommend';
    case 'inbox':
      return 'labels.assignInbox';
    case 'any':
      return 'labels.matchAny';
    case 'all':
      return 'labels.matchAll';
    case 'exact':
      return 'labels.matchExact';
    case 'regex':
      return 'labels.matchRegex';
    default: {
      const _exhaustive: never = mode;
      return _exhaustive;
    }
  }
}

export function labelAssignmentModeNeedsMatchText(mode: LabelAssignmentMode): boolean {
  return mode === 'any' || mode === 'all' || mode === 'exact' || mode === 'regex';
}

export function readLabelAssignmentMode(
  tag: Pick<TagDto, 'isInbox' | 'matchingAlgorithm'>
): LabelAssignmentMode {
  if (tag.isInbox) {
    return 'inbox';
  }
  const algo = tag.matchingAlgorithm ?? 'none';
  if (algo === 'none') {
    return 'recommend';
  }
  return algo;
}

export function readLabelAssignmentModeFromForm(
  form: Pick<CreateTagRequest, 'isInbox' | 'matchingAlgorithm'>
): LabelAssignmentMode {
  return readLabelAssignmentMode({
    isInbox: Boolean(form.isInbox),
    matchingAlgorithm: form.matchingAlgorithm ?? 'none',
  });
}

export function applyLabelAssignmentMode(
  mode: LabelAssignmentMode,
  current: CreateTagRequest
): CreateTagRequest {
  switch (mode) {
    case 'never':
    case 'recommend':
      return { ...current, isInbox: false, matchingAlgorithm: 'none' };
    case 'inbox':
      return { ...current, isInbox: true, matchingAlgorithm: 'none', match: '' };
    case 'any':
    case 'all':
    case 'exact':
    case 'regex':
      return { ...current, isInbox: false, matchingAlgorithm: mode };
    default: {
      const _exhaustive: never = mode;
      return _exhaustive;
    }
  }
}

export function matchingAlgorithmFromMode(mode: LabelAssignmentMode): MatchingAlgorithm {
  if (mode === 'never' || mode === 'recommend' || mode === 'inbox') {
    return 'none';
  }
  return mode;
}
