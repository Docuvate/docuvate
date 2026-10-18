// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { ConnectorPluginId } from '@docuvate/contracts';

export function parseConnectorPluginIdRoute(value: string): ConnectorPluginId | null {
  switch (value) {
    case 'gmail':
      return 'gmail';
    case 'outlook':
      return 'outlook';
    case 'paperless':
      return 'paperless';
    case 'home_assistant':
      return 'home_assistant';
    case 'amazon_s3':
      return 'amazon_s3';
    case 'sftp_fetch':
      return 'sftp_fetch';
    default:
      return null;
  }
}
