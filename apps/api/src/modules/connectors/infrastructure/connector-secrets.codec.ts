import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'node:crypto';
import type { ConnectorConfigurationInput } from '../domain/connector.types.js';

const SCRYPT_SALT = 'docuvate-connector-installations-v1';

function deriveKey(): Buffer {
  const secret =
    process.env['DOCUVATE_CONNECTOR_SECRETS_KEY'] ??
    'dev-insecure-connector-secrets-key-change-me';
  return scryptSync(secret, SCRYPT_SALT, 32);
}

export function encryptConnectorCredentials(credentials: ConnectorConfigurationInput): Buffer {
  const key = deriveKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const plaintext = Buffer.from(JSON.stringify(credentials), 'utf8');
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, ciphertext]);
}

export function decryptConnectorCredentials(blob: Buffer): ConnectorConfigurationInput {
  const iv = blob.subarray(0, 12);
  const tag = blob.subarray(12, 28);
  const ciphertext = blob.subarray(28);
  const key = deriveKey();
  const decipher = createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return JSON.parse(plaintext.toString('utf8')) as ConnectorConfigurationInput;
}
