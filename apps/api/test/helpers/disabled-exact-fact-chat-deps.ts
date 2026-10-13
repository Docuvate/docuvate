// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { FeatureFlagsDto } from '@docuvate/contracts';

import type { ExactFactQueryRouterService } from '../../src/modules/exact-facts/application/exact-fact-query-router.service.js';
import type { TryExactFactChatAnswerUseCase } from '../../src/modules/exact-facts/application/try-exact-fact-chat-answer.use-case.js';
import type { ResolveFeatureFlagsUseCase } from '../../src/modules/feature-flags/application/resolve-feature-flags.use-case.js';

const DEFAULT_DISABLED_FLAGS: FeatureFlagsDto = {
  layoutReconstructionCompare: false,
  sourceConnectors: false,
  experimentalResearchModels: false,
  exactAnswers: false,
  answerAbstention: false,
};

export function disabledExactFactChatDeps(flags: FeatureFlagsDto = DEFAULT_DISABLED_FLAGS): {
  resolveFeatureFlags: Pick<ResolveFeatureFlagsUseCase, 'execute'>;
  exactFactQueryRouter: Pick<ExactFactQueryRouterService, 'parse'>;
  exactFactChat: Pick<TryExactFactChatAnswerUseCase, 'execute'>;
} {
  return {
    resolveFeatureFlags: {
      execute: () => Promise.resolve(flags),
    },
    exactFactQueryRouter: {
      parse: () => null,
    },
    exactFactChat: {
      execute: () => Promise.resolve(null),
    },
  };
}
