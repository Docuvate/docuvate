// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { formatUserFacingError } from './apiErrors';

export function formatConnectorError(err: unknown, fallbackKey: string): string {
  return formatUserFacingError(err, fallbackKey);
}
