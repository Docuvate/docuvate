// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { UserPreferencesEntity } from '../../../shared/domain/ports.js';
import type { UserSettingsResponseDto } from '../../../shared/presentation/dtos/settings.dto.js';

export function toUserSettingsResponseDto(
  row: UserPreferencesEntity
): UserSettingsResponseDto {
  return {
    preferredExtractorEngine: row.preferredExtractorEngine,
    advancedFeaturesEnabled: row.advancedFeaturesEnabled,
    useArenaWinnerAsDefault: row.useArenaWinnerAsDefault,
    arenaWinnerEngine: row.arenaWinnerEngine,
    fieldExtractionConfidenceGateEnabled: row.fieldExtractionConfidenceGateEnabled,
    fieldExtractionRequiredLabelIds: row.fieldExtractionRequiredLabelIds,
    themePreference: row.themePreference,
    locale: row.locale,
  };
}
