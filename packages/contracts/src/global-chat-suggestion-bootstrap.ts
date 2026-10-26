// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

export interface GlobalChatSuggestionBootstrapDto {
  topTagId: string | null;
  topTagName: string | null;
  topTagDocumentCount: number;
  amountTaggedDocumentCount: number;
  contractEndSample?: { label: string; value: string };
  recentQuestions: string[];
}
