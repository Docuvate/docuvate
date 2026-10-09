// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
export interface CitedClaimCitationJson {
  source: string;
  quote: string;
}

export interface CitedClaimJson {
  text: string;
  source?: string;
  quote?: string;
  /** Multiple source/quote pairs when one sentence cites several documents or spans. */
  citations?: CitedClaimCitationJson[];
}

export interface CitedAnswerJson {
  claims: CitedClaimJson[];
}
