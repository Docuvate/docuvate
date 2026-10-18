// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { DashboardWidgetType } from '@docuvate/contracts';

import { ValidationError } from '../../../shared/domain/errors.js';

const WIDGET_TYPES: DashboardWidgetType[] = [
  'saved_view',
  'upload',
  'statistics',
  'recent_documents',
  'attention',
];

export interface ParsedDashboardWidgetFields {
  savedViewId: string | null;
  itemLimit: number | null;
}

export function parseDashboardWidgetFields(
  type: DashboardWidgetType,
  input: { savedViewId?: string | null; itemLimit?: number | null }
): ParsedDashboardWidgetFields {
  const savedViewId = input.savedViewId ?? null;
  const itemLimit = input.itemLimit ?? null;

  if (type === 'saved_view') {
    if (!savedViewId || typeof savedViewId !== 'string') {
      throw new ValidationError('savedViewId is required for saved_view widgets');
    }
    if (itemLimit != null && (typeof itemLimit !== 'number' || itemLimit < 1 || itemLimit > 50)) {
      throw new ValidationError('itemLimit must be between 1 and 50');
    }
    return { savedViewId, itemLimit };
  }

  if (savedViewId != null) {
    throw new ValidationError('savedViewId is only allowed for saved_view widgets');
  }

  if (type === 'recent_documents' || type === 'attention') {
    if (itemLimit != null && (typeof itemLimit !== 'number' || itemLimit < 1 || itemLimit > 50)) {
      throw new ValidationError('itemLimit must be between 1 and 50');
    }
    return { savedViewId: null, itemLimit };
  }

  if (itemLimit != null) {
    throw new ValidationError('This widget type does not accept itemLimit');
  }

  return { savedViewId: null, itemLimit: null };
}

export function assertDashboardWidgetType(value: string): DashboardWidgetType {
  for (const widgetType of WIDGET_TYPES) {
    if (widgetType === value) {
      return widgetType;
    }
  }
  throw new ValidationError('Unknown widget type');
}
