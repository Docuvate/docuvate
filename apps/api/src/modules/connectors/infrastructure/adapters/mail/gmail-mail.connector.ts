// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { ConnectorPlugin } from '../../../domain/connector.ports.js';
import type {
  ConnectorConfigurationInput,
  ConnectorValidationResult,
} from '../../../domain/connector.types.js';
import { readConnectorConfigString } from '../shared/connector-config-string.js';
import { connectorFetch } from '../shared/connector-http.js';
import { requiredFieldsPresent } from '../shared/required-fields.validation.js';
import { remoteValidationFailed } from '../shared/validation-message.js';
import { openGmailRuntime } from './gmail-mail.runtime.js';
import { mailOAuthConfigured, mailOAuthSetupStatus } from './mail-oauth.config.js';

export class GmailMailConnector implements ConnectorPlugin {
  readonly descriptor = {
    id: 'gmail' as const,
    categoryId: 'mail' as const,
    labelKey: 'connectors.plugins.gmail.label',
    descriptionKey: 'connectors.plugins.gmail.description',
    capabilities: ['source' as const],
    tier: 'oss' as const,
  };

  authDescriptor() {
    return {
      strategy: 'oauth2' as const,
      oauth: mailOAuthSetupStatus('gmail'),
      fields: [
        {
          key: 'account_hint',
          labelKey: 'connectors.auth.fields.accountHint',
          type: 'email' as const,
          required: false,
          helpKey: 'connectors.plugins.gmail.accountHintHelp',
        },
      ],
    };
  }

  openRuntime(credentials: ConnectorConfigurationInput) {
    return openGmailRuntime(credentials);
  }

  async validateConfiguration(
    input: ConnectorConfigurationInput
  ): Promise<ConnectorValidationResult> {
    if (!mailOAuthConfigured('gmail')) {
      return remoteValidationFailed('connectors.errors.oauthNotConfigured');
    }
    const tokenCheck = requiredFieldsPresent(input, ['access_token']);
    if (!tokenCheck.ok) {
      return remoteValidationFailed('connectors.errors.oauthTokenMissing');
    }
    const accessToken = readConnectorConfigString(input, 'access_token');
    const response = await connectorFetch(
      'https://gmail.googleapis.com/gmail/v1/users/me/profile',
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );
    if (response.status === 401 || response.status === 403) {
      return remoteValidationFailed('connectors.errors.gmailUnauthorized');
    }
    if (!response.ok) {
      return remoteValidationFailed('connectors.errors.gmailUnreachable');
    }
    return { ok: true };
  }
}
