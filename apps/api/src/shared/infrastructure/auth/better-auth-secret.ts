const FORBIDDEN_PRODUCTION_SECRETS = new Set(
  [
    'dev-secret-change-me-32chars-minimum!!',
    'local-dev-better-auth-secret-min-32-chars!!',
    'local-dev-secret-change-me-32chars!!',
    'your-secret-key-at-least-32-chars-long',
    'change-me-local-compose-secret-32chars',
    'REPLACE_WITH_32_CHAR_MINIMUM_SECRET',
  ].map((s) => s.trim())
);

const PLACEHOLDER_SECRET_PATTERN =
  /change[-_]?me|replace[-_]?with|placeholder|your[-_]?secret|local[-_]?dev[-_]?secret/i;

export function isForbiddenBetterAuthSecret(secret: string): boolean {
  const trimmed = secret.trim();
  if (trimmed.length < 32) {
    return true;
  }
  if (FORBIDDEN_PRODUCTION_SECRETS.has(trimmed)) {
    return true;
  }
  return PLACEHOLDER_SECRET_PATTERN.test(trimmed);
}

export function assertBetterAuthSecretForRuntime(): void {
  const nodeEnv = process.env['NODE_ENV'] ?? 'development';
  if (nodeEnv !== 'production') {
    return;
  }
  const secret = process.env['BETTER_AUTH_SECRET']?.trim() ?? '';
  if (secret.length < 32) {
    throw new Error('BETTER_AUTH_SECRET must be set to at least 32 characters in production');
  }
  if (isForbiddenBetterAuthSecret(secret)) {
    throw new Error('BETTER_AUTH_SECRET must not use a default or placeholder value in production');
  }
}
