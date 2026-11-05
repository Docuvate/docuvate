// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { type DocumentRegionDto, semanticFieldKey } from '@docuvate/contracts';

/**
 * Resolve a layout region for an extracted field, matching exact storage keys and
 * semantic aliases (e.g. catalog ``absender`` ↔ stored ``global:vendor``).
 */
export function findFieldRegion(
  fieldKey: string,
  fieldRegions: readonly DocumentRegionDto[]
): DocumentRegionDto | undefined {
  const needle = fieldKey.trim();
  if (!needle) {
    return undefined;
  }
  const exact = fieldRegions.find((region) => region.field?.fieldKey === needle);
  if (exact) {
    return exact;
  }
  const semantic = semanticFieldKey({ key: needle, value: '' });
  return fieldRegions.find((region) => {
    const key = region.field?.fieldKey;
    if (!key) {
      return false;
    }
    return semanticFieldKey({ key, value: '' }) === semantic;
  });
}
