// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type {
  ExtractionEngineInfo,
  UpdateUserSettingsRequest,
  UserSettingsDto,
} from '@docuvate/contracts';
import { IsArray, IsBoolean, IsIn, IsOptional, IsString, ValidateIf } from 'class-validator';

import { THEME_PREFERENCES, UI_LOCALES } from '../../../modules/settings/domain/ui-preferences.js';

export class UpdateUserSettingsRequestDto implements UpdateUserSettingsRequest {
  @IsOptional()
  @IsString()
  preferredExtractorEngine?: string;

  @IsOptional()
  @IsBoolean()
  useArenaWinnerAsDefault?: boolean;

  @IsOptional()
  @IsBoolean()
  fieldExtractionConfidenceGateEnabled?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  fieldExtractionRequiredLabelIds?: string[];

  @IsOptional()
  @IsBoolean()
  advancedFeaturesEnabled?: boolean;

  @IsOptional()
  @IsIn(THEME_PREFERENCES)
  themePreference?: (typeof THEME_PREFERENCES)[number];

  @IsOptional()
  @ValidateIf((_obj, value) => value !== null)
  @IsIn(UI_LOCALES)
  locale?: (typeof UI_LOCALES)[number] | null;
}

export class UserSettingsResponseDto implements UserSettingsDto {
  preferredExtractorEngine!: string;
  advancedFeaturesEnabled?: boolean;
  useArenaWinnerAsDefault!: boolean;
  arenaWinnerEngine?: string | null;
  fieldExtractionConfidenceGateEnabled?: boolean;
  fieldExtractionRequiredLabelIds?: string[];
  themePreference?: (typeof THEME_PREFERENCES)[number];
  locale?: (typeof UI_LOCALES)[number] | null;
}

export class ExtractionEngineListResponseDto {
  engines!: ExtractionEngineInfo[];
}
