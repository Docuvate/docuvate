// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import {
  DUPLICATE_DETECTION_MODES,
  type DuplicateDetectionMode,
  FIELD_ACCEPTANCE_PRESETS,
  type FieldAcceptancePreset,
  LABEL_AUTO_ASSIGN_PRESETS,
  LABEL_SUGGESTION_PRESETS,
  type LabelAutoAssignPreset,
  type LabelSuggestionPreset,
  type UpdateWorkspaceMlSettingsRequest,
  type WorkspaceMlSettingsDto,
} from '@docuvate/contracts';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';

export class UpdateWorkspaceMlSettingsRequestDto implements UpdateWorkspaceMlSettingsRequest {
  @ApiPropertyOptional({ enum: LABEL_AUTO_ASSIGN_PRESETS })
  @IsOptional()
  @IsIn(LABEL_AUTO_ASSIGN_PRESETS)
  labelAutoAssign?: LabelAutoAssignPreset;

  @ApiPropertyOptional({ enum: LABEL_SUGGESTION_PRESETS })
  @IsOptional()
  @IsIn(LABEL_SUGGESTION_PRESETS)
  labelSuggestions?: LabelSuggestionPreset;

  @ApiPropertyOptional({ enum: DUPLICATE_DETECTION_MODES })
  @IsOptional()
  @IsIn(DUPLICATE_DETECTION_MODES)
  duplicateDetection?: DuplicateDetectionMode;

  @ApiPropertyOptional({ enum: FIELD_ACCEPTANCE_PRESETS })
  @IsOptional()
  @IsIn(FIELD_ACCEPTANCE_PRESETS)
  fieldAcceptance?: FieldAcceptancePreset;
}

export class WorkspaceMlSettingsResponseDto implements WorkspaceMlSettingsDto {
  @ApiProperty({ enum: LABEL_AUTO_ASSIGN_PRESETS })
  labelAutoAssign!: LabelAutoAssignPreset;

  @ApiProperty({ enum: LABEL_SUGGESTION_PRESETS })
  labelSuggestions!: LabelSuggestionPreset;

  @ApiProperty({ enum: DUPLICATE_DETECTION_MODES })
  duplicateDetection!: DuplicateDetectionMode;

  @ApiProperty({ enum: FIELD_ACCEPTANCE_PRESETS })
  fieldAcceptance!: FieldAcceptancePreset;

  editable!: boolean;
}
