// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { Pool } from 'pg';

import { ResolveFeatureFlagsUseCase } from '../../src/modules/feature-flags/application/resolve-feature-flags.use-case.js';
import { PgFeatureFlagRepository } from '../../src/modules/feature-flags/infrastructure/pg-feature-flag.repository.js';

/** Enable local Ollama for cited-chat integration tests that mock `/api/chat`. */
export function enableLocalChatModelForIntegration(): () => void {
  const previous = process.env['DOCUVATE_FEATURE_LOCAL_CHAT_MODEL'];
  process.env['DOCUVATE_FEATURE_LOCAL_CHAT_MODEL'] = 'true';
  return () => {
    if (previous === undefined) {
      delete process.env['DOCUVATE_FEATURE_LOCAL_CHAT_MODEL'];
    } else {
      process.env['DOCUVATE_FEATURE_LOCAL_CHAT_MODEL'] = previous;
    }
  };
}

export function createIntegrationResolveFeatureFlags(pool: Pool): ResolveFeatureFlagsUseCase {
  return new ResolveFeatureFlagsUseCase(new PgFeatureFlagRepository(pool));
}
