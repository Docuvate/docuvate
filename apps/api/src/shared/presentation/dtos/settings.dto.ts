import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateIf,
} from 'class-validator';
import {
  THEME_PREFERENCES,
  UI_LOCALES,
} from '../../../modules/settings/domain/ui-preferences.js';
import type {
  DocumentChatProviderInfo,
  DocumentChatProvidersCatalogDto,
  DocumentChatUnavailableBackendInfo,
  ExtractionEngineInfo,
  UpdateUserSettingsRequest,
  UserSettingsDto,
} from '@docuvate/contracts';

export class UpdateUserSettingsRequestDto implements UpdateUserSettingsRequest {
  @IsOptional()
  @IsString()
  preferredExtractorEngine?: string;

  @IsOptional()
  @IsString()
  preferredChatProvider?: string | null;

  @IsOptional()
  @IsBoolean()
  useArenaWinnerAsDefault?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0.5)
  @Max(0.95)
  labelFieldConfidenceThreshold?: number;

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
  preferredChatProvider?: string | null;
  effectiveChatProvider?: string;
  customerChatProvider?: string;
  documentChatUiEnabled?: boolean;
  documentChatAvailable?: boolean;
  documentChatReadiness?: 'ready' | 'starting' | 'unavailable' | 'off';
  documentChatReadinessReason?: string | null;
  documentChatOllamaModel?: string | null;
  documentChatRunsOnCpu?: boolean;
  advancedFeaturesEnabled?: boolean;
  useArenaWinnerAsDefault!: boolean;
  arenaWinnerEngine?: string | null;
  labelFieldConfidenceThreshold?: number;
  fieldExtractionConfidenceGateEnabled?: boolean;
  fieldExtractionRequiredLabelIds?: string[];
  themePreference?: (typeof THEME_PREFERENCES)[number];
  locale?: (typeof UI_LOCALES)[number] | null;
}

export class ExtractionEngineListResponseDto {
  engines!: ExtractionEngineInfo[];
}

export class DocumentChatProvidersCatalogMetaDto {
  @ApiProperty({ type: String, nullable: true })
  ollamaModel!: string | null;

  @ApiProperty()
  ollamaConfigured!: boolean;

  @ApiProperty()
  runsOnCpu!: boolean;
}

export class DocumentChatProviderInfoDto implements DocumentChatProviderInfo {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  label!: string;

  @ApiProperty()
  description!: string;

  @ApiProperty()
  available!: boolean;
}

export class DocumentChatUnavailableBackendInfoDto implements DocumentChatUnavailableBackendInfo {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  label!: string;

  @ApiProperty()
  reason!: string;

  @ApiProperty()
  setupHint!: string;
}

export class DocumentChatProviderListResponseDto implements DocumentChatProvidersCatalogDto {
  @ApiProperty({ type: [DocumentChatProviderInfoDto] })
  selectable!: DocumentChatProviderInfoDto[];

  @ApiProperty({ type: [DocumentChatUnavailableBackendInfoDto] })
  unavailable!: DocumentChatUnavailableBackendInfoDto[];

  @ApiPropertyOptional({ type: [DocumentChatProviderInfoDto] })
  development?: DocumentChatProviderInfoDto[];

  @ApiProperty({ type: DocumentChatProvidersCatalogMetaDto })
  meta!: DocumentChatProvidersCatalogMetaDto;
}
