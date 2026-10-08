import type { TFunction } from 'i18next';
import type { TagDto } from '@docuvate/contracts';
import {
  labelAssignmentModeLabelKey,
  readLabelAssignmentMode,
} from '../../lib/labelAssignmentMode';

export function describeLabelAutoAssignment(tag: TagDto, t: TFunction): string {
  const mode = readLabelAssignmentMode(tag);
  return t(labelAssignmentModeLabelKey(mode));
}
