// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-EE

export type EnterpriseFeatureId = 'sso' | 'audit_export' | 'advanced_abac';

export type EnterpriseFeatureFlags = Record<EnterpriseFeatureId, boolean>;

const CE_FLAGS: EnterpriseFeatureFlags = {
  sso: false,
  audit_export: false,
  advanced_abac: false,
};

/**
 * Reads EE feature flags for the web app. CE builds always disable enterprise features.
 * Production EE may hydrate this from the API once license validation exists server-side.
 */
export function readEnterpriseFeatureFlags(): EnterpriseFeatureFlags {
  const raw = import.meta.env.VITE_DOCUVATE_EE_FEATURES;
  if (typeof raw !== 'string' || raw.trim() === '') {
    return { ...CE_FLAGS };
  }
  try {
    const parsed = JSON.parse(raw) as Partial<EnterpriseFeatureFlags>;
    return { ...CE_FLAGS, ...parsed };
  } catch {
    return { ...CE_FLAGS };
  }
}
