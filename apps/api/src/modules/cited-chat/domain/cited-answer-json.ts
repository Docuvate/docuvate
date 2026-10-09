// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
export interface CitedClaimJson {
  text: string;
  source: string;
  quote: string;
}

export interface CitedAnswerJson {
  claims: CitedClaimJson[];
}
