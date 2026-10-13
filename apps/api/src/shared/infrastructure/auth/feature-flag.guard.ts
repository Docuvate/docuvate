// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { FeatureFlagKey } from '@docuvate/contracts';
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  type Type,
} from '@nestjs/common';

import { ResolveFeatureFlagsUseCase } from '../../../modules/feature-flags/application/resolve-feature-flags.use-case.js';
import { type AuthenticatedRequest } from './auth.guard.js';

export function FeatureFlagGuard(feature: FeatureFlagKey): Type<CanActivate> {
  @Injectable()
  class FeatureFlagGuardMixin implements CanActivate {
    constructor(private readonly resolveFeatureFlags: ResolveFeatureFlagsUseCase) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
      const req = context.switchToHttp().getRequest<AuthenticatedRequest>();
      const tenantId = req.authSession?.user?.id;
      if (!tenantId) {
        throw new UnauthorizedException('Not authenticated');
      }
      await this.resolveFeatureFlags.assertEnabled(tenantId, feature);
      return true;
    }
  }
  Object.defineProperty(FeatureFlagGuardMixin, 'name', {
    value: `FeatureFlagGuard_${feature}`,
  });
  return FeatureFlagGuardMixin;
}

export const SourceConnectorsFeatureGuard = FeatureFlagGuard('sourceConnectors');
