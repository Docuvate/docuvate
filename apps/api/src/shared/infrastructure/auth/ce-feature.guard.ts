// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { CanActivate, Injectable, type Type } from '@nestjs/common';

import {
  assertCeFeatureEnabled,
  type CeFeatureKey,
} from '../../application/assert-ce-feature.js';

export function CeFeatureGuard(feature: CeFeatureKey): Type<CanActivate> {
  @Injectable()
  class CeFeatureGuardMixin implements CanActivate {
    canActivate(): boolean {
      assertCeFeatureEnabled(feature);
      return true;
    }
  }
  return CeFeatureGuardMixin;
}
