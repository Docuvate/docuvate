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

export interface TagSuggestionEntity {
  tag: TagEntity;
  reason: string;
  confidence?: number;
  source?: 'rule' | 'embedding';
}
