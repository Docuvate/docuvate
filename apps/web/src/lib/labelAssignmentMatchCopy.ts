// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { LabelAssignmentMode } from './labelAssignmentMode';

export function labelMatchPlaceholderKey(mode: LabelAssignmentMode): string {
  switch (mode) {
    case 'any':
      return 'labels.matchPlaceholderAny';
    case 'all':
      return 'labels.matchPlaceholderAll';
    case 'exact':
      return 'labels.matchPlaceholderExact';
    case 'regex':
      return 'labels.matchPlaceholderRegex';
    default:
      return 'labels.matchPlaceholderAny';
  }
}

export function labelMatchHintKey(mode: LabelAssignmentMode): string | null {
  switch (mode) {
    case 'any':
      return 'labels.matchHintAny';
    case 'all':
      return 'labels.matchHintAll';
    case 'exact':
      return 'labels.matchHintExact';
    case 'regex':
      return 'labels.matchHintRegex';
    default:
      return null;
  }
}
