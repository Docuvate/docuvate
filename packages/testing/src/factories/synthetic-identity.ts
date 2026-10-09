// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { randomUUID } from 'node:crypto';

/** Neutral synthetic person names for fixtures (no real PII). */
const GIVEN_NAMES = ['Alex', 'Sam', 'Jordan', 'Robin', 'Casey'] as const;
const FAMILY_NAMES = ['Testmann', 'Beispiel', 'Muster', 'Probe', 'Demo'] as const;

export function syntheticUserId(prefix = 'usr'): string {
  return `${prefix}_${randomUUID().replace(/-/g, '').slice(0, 16)}`;
}

export function syntheticEmail(userId: string): string {
  return `${userId}@fixture.docuvate.test`;
}

export function syntheticDisplayName(seed = randomUUID()): string {
  const g = GIVEN_NAMES[seed.charCodeAt(0) % GIVEN_NAMES.length] ?? 'Alex';
  const f = FAMILY_NAMES[seed.charCodeAt(1) % FAMILY_NAMES.length] ?? 'Testmann';
  return `${g} ${f}`;
}

export type SyntheticUserInsert = {
  id: string;
  name: string;
  email: string;
};

export function buildSyntheticUser(overrides?: Partial<SyntheticUserInsert>): SyntheticUserInsert {
  const id = overrides?.id ?? syntheticUserId();
  return {
    id,
    name: overrides?.name ?? syntheticDisplayName(id),
    email: overrides?.email ?? syntheticEmail(id),
  };
}
