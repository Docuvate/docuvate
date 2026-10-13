// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { FeatureFlagKey } from '@docuvate/contracts';
import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsIn } from 'class-validator';

import { FEATURE_FLAG_KEYS_ORDERED } from '../../../modules/feature-flags/domain/feature-flag-keys.js';

export class SetAdminUserFeatureFlagRequestDto {
  @ApiProperty({ enum: FEATURE_FLAG_KEYS_ORDERED })
  @IsIn(FEATURE_FLAG_KEYS_ORDERED)
  flag!: FeatureFlagKey;

  @ApiProperty()
  @IsBoolean()
  enabled!: boolean;
}
