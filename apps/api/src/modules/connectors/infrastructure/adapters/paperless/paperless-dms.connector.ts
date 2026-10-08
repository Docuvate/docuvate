import type { ConnectorPlugin } from '../../../domain/connector.ports.js';
import type {
  ConnectorConfigurationInput,
  ConnectorValidationResult,
} from '../../../domain/connector.types.js';
import {
  requireHostAndTokenOrBasicAuth,
} from '../shared/required-fields.validation.js';
import { remoteValidationFailed } from '../shared/validation-message.js';
import { validatePaperlessConnection } from './paperless-api.client.js';
import { openPaperlessRuntime } from './paperless-dms.runtime.js';

export class PaperlessDmsConnector implements ConnectorPlugin {
  readonly descriptor = {
    id: 'paperless' as const,
    categoryId: 'dms' as const,
    labelKey: 'connectors.plugins.paperless.label',
    descriptionKey: 'connectors.plugins.paperless.description',
    capabilities: ['source' as const, 'sink' as const],
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
          placeholderKey: 'connectors.plugins.paperless.baseUrlPlaceholder',
        },
        {
          key: 'api_token',
          labelKey: 'connectors.auth.fields.apiToken',
          type: 'password' as const,
          required: false,
          secret: true,
          helpKey: 'connectors.plugins.paperless.apiTokenHelp',
        },
        {
          key: 'username',
          labelKey: 'connectors.auth.fields.username',
          type: 'text' as const,
          required: false,
        },
        {
          key: 'password',
          labelKey: 'connectors.auth.fields.password',
          type: 'password' as const,
          required: false,
          secret: true,
          helpKey: 'connectors.plugins.paperless.passwordHelp',
        },
      ],
    };
  }

  openRuntime(credentials: ConnectorConfigurationInput) {
    return openPaperlessRuntime(credentials);
  }

  async validateConfiguration(input: ConnectorConfigurationInput): Promise<ConnectorValidationResult> {
    const shape = requireHostAndTokenOrBasicAuth(input, 'base_url', 'api_token', [
      'username',
      'password',
    ]);
    if (!shape.ok) {
      return shape;
    }
    try {
      await validatePaperlessConnection(input);
      return { ok: true };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '';
      if (message === 'PAPERLESS_UNAUTHORIZED') {
        return remoteValidationFailed('connectors.errors.paperlessUnauthorized');
      }
      return remoteValidationFailed('connectors.errors.paperlessUnreachable');
    }
  }
}
