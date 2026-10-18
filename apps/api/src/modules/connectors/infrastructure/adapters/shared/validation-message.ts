// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { ConnectorValidationResult } from '../../../domain/connector.types.js';

export function remoteValidationFailed(
  messageKey = 'connectors.errors.remoteValidationFailed'
): ConnectorValidationResult {
  return { ok: false, messageKey };
}
