// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { ConnectorConfigurationInput } from '../../../domain/connector.types.js';

export function readConnectorConfigString(
  input: ConnectorConfigurationInput,
  key: string
): string {
  const value = input[key];
  return typeof value === 'string' ? value.trim() : '';
}
