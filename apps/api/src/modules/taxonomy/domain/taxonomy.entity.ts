// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { CustomFieldType, MatchingAlgorithm } from '@docuvate/contracts';

export interface TagCustomFieldOnTag {
  id: string;
  tagId: string;
  key: string;
  label: string;
  fieldType: CustomFieldType;
  sortOrder: number;
}

export interface TagEntity {
  id: string;
  userId: string;
  name: string;
  color?: string | null;
  isInbox: boolean;
  matchingAlgorithm: MatchingAlgorithm;
  match: string;
  customFields?: TagCustomFieldOnTag[];
}

export interface CorrespondentEntity {
  id: string;
  userId: string;
  name: string;
  matchingAlgorithm: MatchingAlgorithm;
  match: string;
}

export type TagSuggestionSource = 'rule' | 'embedding' | 'embedding_density';

export type TagSuggestionDecisionTier = 'auto_apply' | 'confirm' | 'none';

export interface TagSuggestionEntity {
  tag: TagEntity;
  reason: string;
  confidence?: number;
  source?: TagSuggestionSource;
  decisionTier?: TagSuggestionDecisionTier;
}
