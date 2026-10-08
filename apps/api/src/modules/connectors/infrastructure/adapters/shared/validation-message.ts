import type { ConnectorValidationResult } from '../../../domain/connector.types.js';

export function remoteValidationFailed(messageKey = 'connectors.errors.remoteValidationFailed'): ConnectorValidationResult {
  return { ok: false, messageKey };
}
