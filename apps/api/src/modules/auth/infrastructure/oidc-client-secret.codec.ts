// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'node:crypto';

const SCRYPT_SALT = 'docuvate-installation-oidc-v1';

function deriveKey(): Buffer {
  const secret =
    process.env['DOCUVATE_CONNECTOR_SECRETS_KEY'] ?? 'dev-insecure-connector-secrets-key-change-me';
  return scryptSync(secret, SCRYPT_SALT, 32);
}

export function encryptOidcClientSecret(clientSecret: string): Buffer {
  const key = deriveKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const plaintext = Buffer.from(clientSecret, 'utf8');
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, ciphertext]);
}

export function decryptOidcClientSecret(blob: Buffer): string {
  const iv = blob.subarray(0, 12);
  const tag = blob.subarray(12, 28);
  const ciphertext = blob.subarray(28);
  const key = deriveKey();
  const decipher = createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return plaintext.toString('utf8');
}
