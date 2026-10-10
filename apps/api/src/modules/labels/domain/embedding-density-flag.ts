// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

/** Research feature: enabled only when explicitly set to "true". */
export function embeddingDensityGloballyEnabled(): boolean {
  return process.env.EMBEDDING_DENSITY_SUGGESTIONS_ENABLED === 'true';
}
