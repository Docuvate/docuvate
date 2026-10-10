// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { ConnectorPlugin } from '../../../domain/connector.ports.js';
import type {
  ConnectorConfigurationInput,
  ConnectorValidationResult,
} from '../../../domain/connector.types.js';
import { requiredFieldsPresent } from '../shared/required-fields.validation.js';
import { remoteValidationFailed } from '../shared/validation-message.js';
import { openHomeAssistantRuntime } from './home-assistant.runtime.js';
import { validateHomeAssistantConnection } from './home-assistant-api.client.js';

export class HomeAssistantHomeAutomationConnector implements ConnectorPlugin {
  readonly descriptor = {
    id: 'home_assistant' as const,
    categoryId: 'home_automation' as const,
    labelKey: 'connectors.plugins.homeAssistant.label',
    descriptionKey: 'connectors.plugins.homeAssistant.description',
    capabilities: ['sink' as const],
    tier: 'oss' as const,
  };

  authDescriptor() {
    return {
      strategy: 'custom' as const,
      fields: [
        {
          key: 'base_url',
          labelKey: 'connectors.auth.fields.baseUrl',
          type: 'url' as const,
          required: true,
          placeholderKey: 'connectors.plugins.homeAssistant.baseUrlPlaceholder',
          helpKey: 'connectors.plugins.homeAssistant.baseUrlHelp',
        },
        {
          key: 'access_token',
          labelKey: 'connectors.auth.fields.accessToken',
          type: 'password' as const,
          required: true,
          secret: true,
          helpKey: 'connectors.plugins.homeAssistant.accessTokenHelp',
        },
      ],
    };
  }

  openRuntime(credentials: ConnectorConfigurationInput) {
    return openHomeAssistantRuntime(credentials);
  }

  async validateConfiguration(
    input: ConnectorConfigurationInput
  ): Promise<ConnectorValidationResult> {
    const required = requiredFieldsPresent(input, ['base_url', 'access_token']);
    if (!required.ok) {
      return required;
    }
    try {
      await validateHomeAssistantConnection(input);
      return { ok: true };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '';
      if (message === 'HA_UNAUTHORIZED') {
        return remoteValidationFailed('connectors.errors.homeAssistantUnauthorized');
      }
      return remoteValidationFailed('connectors.errors.homeAssistantUnreachable');
    }
  }
}
