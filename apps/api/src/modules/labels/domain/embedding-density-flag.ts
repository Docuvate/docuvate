// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

/** NEST density classification is on in CE unless explicitly disabled. */
export function embeddingDensityGloballyEnabled(): boolean {
  const raw = process.env['EMBEDDING_DENSITY_SUGGESTIONS_ENABLED'];
  if (raw === undefined || raw === '') {
    return true;
  }
  return raw === 'true';
}
