// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { IsArray, IsBoolean, IsOptional, IsString, IsUUID } from 'class-validator';
import type {
  AddLabelRecommendationBlocklistRequest,
  ConfirmLabelRecommendationBlocklistPatternRequest,
  DismissLabelRecommendationRequest,
  DismissTagSuggestionRequest,
  LabelMapResponseDto,
  LabelRecommendationBlocklistEntryDto,
  LabelRecommendationBlocklistPatternDto,
  LabelRecommendationDto,
  ProposeLabelRecommendationBlocklistPatternRequest,
} from '@docuvate/contracts';

export class AcceptLabelRecommendationRequestDto {
  @IsOptional()
  @IsString()
  recommendationId?: string;

  @IsOptional()
  @IsString()
  proposedName?: string;

  @IsOptional()
  @IsUUID('4')
  tagId?: string;

  @IsOptional()
  @IsUUID('4')
  keepTagId?: string;

  @IsOptional()
  @IsUUID('4')
  removeTagId?: string;

  @IsOptional()
  @IsString()
  color?: string;
}

export class LabelRecommendationListResponseDto {
  items!: LabelRecommendationDto[];
}

export class LabelMapResponseDtoClass implements LabelMapResponseDto {
  points!: LabelMapResponseDto['points'];
  documentCount!: number;
  tagCount!: number;
  extractedDocumentCount!: number;
  emptyReason?: LabelMapResponseDto['emptyReason'];
}

export class AcceptLabelRecommendationResponseDto {
  tagId!: string;
  action!: string;
}

export class DismissTagSuggestionRequestDto implements DismissTagSuggestionRequest {
  @IsOptional()
  @IsBoolean()
  blockFuture?: boolean;
}

export class DismissLabelRecommendationRequestDto implements DismissLabelRecommendationRequest {
  @IsOptional()
  @IsString()
  phrase?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  phrases?: string[];

  @IsOptional()
  @IsBoolean()
  blockFuture?: boolean;
}

export class AddLabelRecommendationBlocklistRequestDto implements AddLabelRecommendationBlocklistRequest {
  @IsString()
  phrase!: string;
}

export class LabelRecommendationBlocklistListResponseDto {
  items!: LabelRecommendationBlocklistEntryDto[];
  patterns!: LabelRecommendationBlocklistPatternDto[];
}

export class ProposeLabelRecommendationBlocklistPatternRequestDto implements ProposeLabelRecommendationBlocklistPatternRequest {
  @IsArray()
  @IsString({ each: true })
  phrases!: string[];
}

export class ConfirmLabelRecommendationBlocklistPatternRequestDto implements ConfirmLabelRecommendationBlocklistPatternRequest {
  @IsString()
  pattern!: string;
}

export class LabelRecommendationBlocklistEntryResponseDto implements LabelRecommendationBlocklistEntryDto {
  id!: string;
  phrase!: string;
  source!: 'manual' | 'dismiss';
  createdAt!: string;
}
