import type { ConnectorPlugin } from '../../../domain/connector.ports.js';
import type {
  ConnectorConfigurationInput,
  ConnectorValidationResult,
} from '../../../domain/connector.types.js';
import { requiredFieldsPresent } from '../shared/required-fields.validation.js';
import { remoteValidationFailed } from '../shared/validation-message.js';
import { probeSftpPullHostKey } from './sftp-pull.gateway.js';
import { openSftpFetchRuntime } from './sftp-fetch.runtime.js';
import { listSftpPullFiles } from './sftp-pull.gateway.js';

export class SftpFetchConnector implements ConnectorPlugin {
  readonly descriptor = {
    id: 'sftp_fetch' as const,
    categoryId: 'scanner_sftp' as const,
    labelKey: 'connectors.plugins.sftpFetch.label',
    descriptionKey: 'connectors.plugins.sftpFetch.description',
    capabilities: ['source' as const],
    tier: 'oss' as const,
  };

  authDescriptor() {
    return {
      strategy: 'custom' as const,
      fields: [
        { key: 'host', labelKey: 'connectors.auth.fields.host', type: 'text' as const, required: true },
        {
          key: 'port',
          labelKey: 'connectors.auth.fields.port',
          type: 'text' as const,
          required: true,
          placeholderKey: 'connectors.plugins.sftpFetch.portPlaceholder',
        },
        { key: 'username', labelKey: 'connectors.auth.fields.username', type: 'text' as const, required: true },
        {
          key: 'password',
          labelKey: 'connectors.auth.fields.password',
          type: 'password' as const,
          required: false,
          secret: true,
        },
        {
          key: 'private_key',
          labelKey: 'connectors.auth.fields.privateKey',
          type: 'password' as const,
          required: false,
          secret: true,
          helpKey: 'connectors.plugins.sftpFetch.privateKeyHelp',
        },
        {
          key: 'remote_path',
          labelKey: 'connectors.auth.fields.remotePath',
          type: 'text' as const,
          required: true,
          placeholderKey: 'connectors.plugins.sftpFetch.remotePathPlaceholder',
        },
        {
          key: 'host_key_fingerprint',
          labelKey: 'connectors.auth.fields.hostKeyFingerprint',
          type: 'text' as const,
          required: true,
          helpKey: 'connectors.plugins.sftpFetch.hostKeyHelp',
        },
        {
          key: 'poll_interval_seconds',
          labelKey: 'connectors.auth.fields.pollIntervalSeconds',
          type: 'text' as const,
          required: true,
          placeholderKey: 'connectors.plugins.sftpFetch.pollIntervalPlaceholder',
        },
        {
          key: 'after_import',
          labelKey: 'connectors.auth.fields.afterImport',
          type: 'text' as const,
          required: true,
          placeholderKey: 'connectors.plugins.sftpFetch.afterImportPlaceholder',
          helpKey: 'connectors.plugins.sftpFetch.afterImportHelp',
        },
        {
          key: 'archive_subpath',
          labelKey: 'connectors.auth.fields.archiveSubpath',
          type: 'text' as const,
          required: false,
          placeholderKey: 'connectors.plugins.sftpFetch.archiveSubpathPlaceholder',
        },
        {
          key: 'target_folder_id',
          labelKey: 'connectors.auth.fields.targetFolderId',
          type: 'text' as const,
          required: false,
        },
        {
          key: 'label_ids',
          labelKey: 'connectors.auth.fields.labelIds',
          type: 'text' as const,
          required: false,
          helpKey: 'connectors.plugins.sftpFetch.labelIdsHelp',
        },
      ],
    };
  }

  openRuntime(credentials: ConnectorConfigurationInput) {
    return openSftpFetchRuntime(credentials);
  }

  async validateConfiguration(input: ConnectorConfigurationInput): Promise<ConnectorValidationResult> {
    const required = requiredFieldsPresent(input, [
      'host',
      'port',
      'username',
      'remote_path',
      'host_key_fingerprint',
      'poll_interval_seconds',
      'after_import',
    ]);
    if (!required.ok) return required;
    if (!input['password']?.trim() && !input['private_key']?.trim()) {
      return remoteValidationFailed('connectors.errors.sftpAuthRequired');
    }
    try {
      await listSftpPullFiles(input, 1);
      return { ok: true };
    } catch {
      return remoteValidationFailed('connectors.errors.sftpConnectionFailed');
    }
  }
}

export function probeSftpFetchHost(
  input: ConnectorConfigurationInput
): Promise<{ hostKeyFingerprintSha256: string }> {
  return probeSftpPullHostKey(input);
}
