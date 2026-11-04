// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

/** Gate values a catalog field inherits when it has no per-field override. */
export interface FieldGateDefaults {
  confidenceGateEnabled: boolean;
  /** From the workspace field-acceptance preset. */
  minLabelConfidence: number;
  requiredLabelIds: string[];
}
