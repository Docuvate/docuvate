// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { LabelMatchAssignmentMode } from './labelAssignmentMode';

export type { LabelMatchAssignmentMode };

export function labelMatchPlaceholderKey(mode: LabelMatchAssignmentMode): string {
  switch (mode) {
    case 'any':
      return 'labels.matchPlaceholderAny';
    case 'all':
      return 'labels.matchPlaceholderAll';
    case 'exact':
      return 'labels.matchPlaceholderExact';
    case 'regex':
      return 'labels.matchPlaceholderRegex';
    default: {
      const _exhaustive: never = mode;
      return _exhaustive;
    }
  }
}

export function labelMatchHintKey(mode: LabelMatchAssignmentMode): string | null {
  switch (mode) {
    case 'any':
      return 'labels.matchHintAny';
    case 'all':
      return 'labels.matchHintAll';
    case 'exact':
      return 'labels.matchHintExact';
    case 'regex':
      return 'labels.matchHintRegex';
    default: {
      const _exhaustive: never = mode;
      return _exhaustive;
    }
  }
}
