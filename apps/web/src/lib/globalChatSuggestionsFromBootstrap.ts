// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { GlobalChatSuggestionBootstrapDto } from '@docuvate/contracts';

import type { GlobalChatSuggestionsResult } from './globalChatSuggestions';

function buildAmountCostQuestion(tagName: string): string {
  return `Was kostet ${tagName}?`;
}

function buildSumQuestion(tagName: string, year: number): string {
  return `Summe aller ${tagName} ${String(year)}`;
}

function buildContractEndQuestion(contractLabel: string): string {
  return `Wann endet ${contractLabel}?`;
}

export function buildGlobalChatSuggestionsFromBootstrap(
  bootstrap: GlobalChatSuggestionBootstrapDto,
  now: Date = new Date()
): GlobalChatSuggestionsResult {
  const chips: GlobalChatSuggestionsResult['chips'] = [];
  const year = now.getFullYear();

  if (bootstrap.topTagName && bootstrap.topTagDocumentCount >= 1) {
    chips.push({
      id: 'cost-top-label',
      text: buildAmountCostQuestion(bootstrap.topTagName),
    });
    if (bootstrap.amountTaggedDocumentCount >= 2) {
      chips.push({
        id: 'sum-top-label-year',
        text: buildSumQuestion(bootstrap.topTagName, year),
      });
    }
  }

  if (bootstrap.contractEndSample) {
    chips.push({
      id: 'contract-end',
      text: buildContractEndQuestion(bootstrap.contractEndSample.label),
    });
  }

  return {
    chips: chips.slice(0, 3),
    recentQuestions: bootstrap.recentQuestions.slice(0, 3),
  };
}
