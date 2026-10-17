// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { LabelRecommendationDto } from '@docuvate/contracts';
import type { TFunction } from 'i18next';

import { todoAcceptActionKey } from './labelsTodoPresentation';

export function clusterAcceptButtonLabel(
  item: LabelRecommendationDto,
  selectedCount: number,
  totalCount: number,
  t: TFunction
): string {
  if (item.kind === 'new' && totalCount > 1) {
    return t('labelRecommendations.acceptSubset', {
      selected: selectedCount,
      total: totalCount,
    });
  }
  return t(todoAcceptActionKey(item));
}

export function clusterAcceptDisabled(
  item: LabelRecommendationDto,
  selectedCount: number,
  totalCount: number
): boolean {
  return item.kind === 'new' && totalCount > 1 && selectedCount === 0;
}
