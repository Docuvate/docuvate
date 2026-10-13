// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Controller, Get } from '@nestjs/common';

import { readCeFeatureFlagsFromEnv } from '../../../shared/application/ce-feature-flags.js';
import { Public } from '../../../shared/infrastructure/auth/public.decorator.js';
import { CeFeatureFlagsResponseDto } from '../../../shared/presentation/dtos/ce-settings.dto.js';
import {
  ApiDocuvateController,
  ApiDocuvateRoute,
} from '../../../shared/presentation/swagger/openapi-decorators.js';

@ApiDocuvateController('settings')
@Controller('settings')
export class CeSettingsController {
  @Public()
  @Get('ce')
  @ApiDocuvateRoute({
    operationId: 'getCeFeatureFlags',
    summary: 'Community Edition installation feature flags',
  })
  getCeFeatureFlags(): CeFeatureFlagsResponseDto {
    return readCeFeatureFlagsFromEnv();
  }
}
