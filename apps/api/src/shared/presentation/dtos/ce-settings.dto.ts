// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { CeFeatureFlagsDto } from '@docuvate/contracts';
import { ApiProperty } from '@nestjs/swagger';

export class CeFeatureFlagsResponseDto implements CeFeatureFlagsDto {
  @ApiProperty()
  layoutReconstructionCompare!: boolean;

  @ApiProperty()
  sourceConnectors!: boolean;

  @ApiProperty()
  experimentalResearchModels!: boolean;
}
