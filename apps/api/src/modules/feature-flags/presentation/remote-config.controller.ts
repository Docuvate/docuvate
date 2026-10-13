// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Controller, Get, UseGuards } from '@nestjs/common';

import {
  AuthGuard,
  type AuthSession,
  Session,
} from '../../../shared/infrastructure/auth/auth.guard.js';
import { RemoteConfigResponseDto } from '../../../shared/presentation/dtos/remote-config.dto.js';
import {
  ApiDocuvateController,
  ApiDocuvateRoute,
} from '../../../shared/presentation/swagger/openapi-decorators.js';
import { ResolveFeatureFlagsUseCase } from '../application/resolve-feature-flags.use-case.js';

@ApiDocuvateController('remote-config')
@Controller('remote-config')
@UseGuards(AuthGuard)
export class RemoteConfigController {
  constructor(private readonly resolveFeatureFlags: ResolveFeatureFlagsUseCase) {}

  @Get()
  @ApiDocuvateRoute({
    operationId: 'getRemoteConfig',
    summary: 'Resolved feature flags for the current tenant',
  })
  async getRemoteConfig(@Session() session: AuthSession): Promise<RemoteConfigResponseDto> {
    const featureFlags = await this.resolveFeatureFlags.execute(session.user.id);
    return { featureFlags };
  }
}
