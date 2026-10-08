import type {
  ConnectorConfigurationInput,
  ConnectorValidationResult,
} from '../../../domain/connector.types.js';

export function requiredFieldsPresent(
  input: ConnectorConfigurationInput,
  keys: string[]
): ConnectorValidationResult {
  for (const key of keys) {
    const value = input[key]?.trim();
    if (!value) {
      return { ok: false, messageKey: 'connectors.errors.missingRequiredField' };
    }
  }
  return { ok: true };
}

/** Require `baseUrlKey` plus either `tokenKey` or all keys in `passwordAuthKeys`. */
export function requireHostAndTokenOrBasicAuth(
  input: ConnectorConfigurationInput,
  baseUrlKey: string,
  tokenKey: string,
  passwordAuthKeys: [string, string]
): ConnectorValidationResult {
  const base = requiredFieldsPresent(input, [baseUrlKey]);
  if (!base.ok) {
    return base;
  }
  const token = input[tokenKey]?.trim();
  if (token) {
    return { ok: true };
  }
  const basic = requiredFieldsPresent(input, passwordAuthKeys);
  if (basic.ok) {
    return basic;
  }
  return { ok: false, messageKey: 'connectors.errors.tokenOrPasswordAuthRequired' };
}
