// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { RemoteConfigDto } from '@docuvate/contracts';
import { ApiProperty } from '@nestjs/swagger';

export class FeatureFlagsResponseDto {
  @ApiProperty()
  layoutReconstructionCompare!: boolean;

  @ApiProperty()
  sourceConnectors!: boolean;

  @ApiProperty()
  experimentalResearchModels!: boolean;
}

export class RemoteConfigResponseDto implements RemoteConfigDto {
  @ApiProperty({ type: FeatureFlagsResponseDto })
  featureFlags!: FeatureFlagsResponseDto;
}
