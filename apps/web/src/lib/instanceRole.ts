// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { InstanceRole } from '@docuvate/contracts';

export function parseInstanceRole(value: string): InstanceRole {
  if (value === 'admin' || value === 'member') {
    return value;
  }
  throw new Error(`Unknown instance role: ${value}`);
}
