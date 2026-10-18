// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { PasswordPolicyDto } from '@docuvate/contracts';
import { normalizePasswordPolicy } from '@docuvate/contracts';

import { parseBoolean, parseNumber } from '../../../shared/infrastructure/database/row-parse.js';

export interface InstallationPasswordPolicyRow {
  min_length: number;
  require_lower: boolean;
  require_upper: boolean;
  require_digit: boolean;
  require_symbol: boolean;
  check_breached: boolean;
}

export function passwordPolicyFromRow(row: InstallationPasswordPolicyRow): PasswordPolicyDto {
  return normalizePasswordPolicy({
    minLength: parseNumber(row.min_length),
    requireLower: parseBoolean(row.require_lower),
    requireUpper: parseBoolean(row.require_upper),
    requireDigit: parseBoolean(row.require_digit),
    requireSymbol: parseBoolean(row.require_symbol),
    checkBreached: parseBoolean(row.check_breached),
  });
}
