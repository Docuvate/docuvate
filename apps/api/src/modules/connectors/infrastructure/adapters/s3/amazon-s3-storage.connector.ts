// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { ConnectorPlugin } from '../../../domain/connector.ports.js';
import type {
  ConnectorConfigurationInput,
  ConnectorValidationResult,
} from '../../../domain/connector.types.js';
import { requiredFieldsPresent } from '../shared/required-fields.validation.js';
import { remoteValidationFailed } from '../shared/validation-message.js';
import { createS3ClientConfig, validateS3BucketAccess } from './s3-client.factory.js';
import { openS3Runtime } from './s3-storage.runtime.js';

export class AmazonS3StorageConnector implements ConnectorPlugin {
  readonly descriptor = {
    id: 'amazon_s3' as const,
    categoryId: 'storage' as const,
    labelKey: 'connectors.plugins.amazonS3.label',
    descriptionKey: 'connectors.plugins.amazonS3.description',
    capabilities: ['source' as const, 'sink' as const],
    tier: 'oss' as const,
  };

  authDescriptor() {
    return {
      strategy: 'custom' as const,
      fields: [
        {
          key: 'bucket',
          labelKey: 'connectors.auth.fields.bucket',
          type: 'text' as const,
          required: true,
          placeholderKey: 'connectors.plugins.amazonS3.bucketPlaceholder',
        },
        {
          key: 'region',
          labelKey: 'connectors.auth.fields.region',
          type: 'text' as const,
          required: true,
          placeholderKey: 'connectors.plugins.amazonS3.regionPlaceholder',
        },
        {
          key: 'access_key_id',
          labelKey: 'connectors.auth.fields.accessKeyId',
          type: 'text' as const,
          required: true,
        },
        {
          key: 'secret_access_key',
          labelKey: 'connectors.auth.fields.secretAccessKey',
          type: 'password' as const,
          required: true,
          secret: true,
        },
        {
          key: 'endpoint',
          labelKey: 'connectors.auth.fields.endpoint',
          type: 'url' as const,
          required: false,
          placeholderKey: 'connectors.plugins.amazonS3.endpointPlaceholder',
          helpKey: 'connectors.plugins.amazonS3.endpointHelp',
        },
        {
          key: 'path_style',
          labelKey: 'connectors.auth.fields.pathStyle',
          type: 'text' as const,
          required: false,
          placeholderKey: 'connectors.plugins.amazonS3.pathStylePlaceholder',
          helpKey: 'connectors.plugins.amazonS3.pathStyleHelp',
        },
      ],
    };
  }

  openRuntime(credentials: ConnectorConfigurationInput) {
    return openS3Runtime(credentials);
  }

  async validateConfiguration(
    input: ConnectorConfigurationInput
  ): Promise<ConnectorValidationResult> {
    const required = requiredFieldsPresent(input, [
      'bucket',
      'region',
      'access_key_id',
      'secret_access_key',
    ]);
    if (!required.ok) {
      return required;
    }
    try {
      const { bucket, client } = createS3ClientConfig(input);
      await validateS3BucketAccess(client, bucket);
      return { ok: true };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '';
      if (message === 'S3_BUCKET_NOT_FOUND') {
        return remoteValidationFailed('connectors.errors.s3BucketNotFound');
      }
      return remoteValidationFailed('connectors.errors.s3ConnectionFailed');
    }
  }
}
