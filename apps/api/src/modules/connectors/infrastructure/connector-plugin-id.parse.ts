// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { parseOptionalEnum } from '../../../shared/infrastructure/database/row-parse.js';
import type { ConnectorPluginId } from '../domain/connector.types.js';

const CONNECTOR_PLUGIN_IDS: readonly ConnectorPluginId[] = [
  'gmail',
  'outlook',
  'paperless',
  'home_assistant',
  'amazon_s3',
  'sftp_fetch',
];

export function parseConnectorPluginId(value: unknown): ConnectorPluginId {
  const parsed = parseOptionalEnum(value, CONNECTOR_PLUGIN_IDS);
  if (!parsed) {
    throw new Error('Invalid connector plugin_id');
  }
  return parsed;
}
