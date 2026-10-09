// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { ConnectorPlugin } from '../../../domain/connector.ports.js';
import type {
  ConnectorConfigurationInput,
  ConnectorValidationResult,
} from '../../../domain/connector.types.js';
import { requiredFieldsPresent } from '../shared/required-fields.validation.js';
import { remoteValidationFailed } from '../shared/validation-message.js';
import { connectorFetch } from '../shared/connector-http.js';
import { mailOAuthConfigured, mailOAuthSetupStatus } from './mail-oauth.config.js';
import { openOutlookRuntime } from './outlook-mail.runtime.js';

export class OutlookMailConnector implements ConnectorPlugin {
  readonly descriptor = {
    id: 'outlook' as const,
    categoryId: 'mail' as const,
    labelKey: 'connectors.plugins.outlook.label',
    descriptionKey: 'connectors.plugins.outlook.description',
    capabilities: ['source' as const],
    tier: 'oss' as const,
  };

  authDescriptor() {
    return {
      strategy: 'oauth2' as const,
      oauth: mailOAuthSetupStatus('outlook'),
      fields: [],
    };
  }

  openRuntime(credentials: ConnectorConfigurationInput) {
    return openOutlookRuntime(credentials);
  }

  async validateConfiguration(
    input: ConnectorConfigurationInput
  ): Promise<ConnectorValidationResult> {
    if (!mailOAuthConfigured('outlook')) {
      return remoteValidationFailed('connectors.errors.oauthNotConfigured');
    }
    const tokenCheck = requiredFieldsPresent(input, ['access_token']);
    if (!tokenCheck.ok) {
      return remoteValidationFailed('connectors.errors.oauthTokenMissing');
    }
    const accessToken = input['access_token']?.trim() ?? '';
    const response = await connectorFetch('https://graph.microsoft.com/v1.0/me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (response.status === 401 || response.status === 403) {
      return remoteValidationFailed('connectors.errors.outlookUnauthorized');
    }
    if (!response.ok) {
      return remoteValidationFailed('connectors.errors.outlookUnreachable');
    }
    return { ok: true };
  }
}
