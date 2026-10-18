// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { passkey } from '@better-auth/passkey';
import { betterAuth } from 'better-auth';
import { twoFactor } from 'better-auth/plugins/two-factor';
import pg from 'pg';

import {
  AUTH_MAX_PASSWORD_LENGTH,
  AUTH_MIN_PASSWORD_LENGTH,
} from '../../../modules/auth/domain/auth-password.constants.js';
import { createBetterAuthPasswordPolicyBeforeHook } from '../../../modules/auth/infrastructure/better-auth-password-policy.middleware.js';
import { buildGenericOAuthPlugin } from '../../../modules/auth/infrastructure/build-generic-oauth-config.js';
import { assignInstallationRoleAfterSignUp } from '../../../modules/auth/infrastructure/instance-user-bootstrap.js';
import {
  createEmailChangeMailer,
  isEmailChangeMailAvailable,
} from '../../../modules/auth/infrastructure/mail/email-change-mailer.factory.js';
import { createPasswordResetMailer } from '../../../modules/auth/infrastructure/mail/password-reset-mailer.factory.js';
import { PgInstallationOidcProviderRepository } from '../../../modules/auth/infrastructure/pg-installation-oidc-provider.repository.js';
import { isSignupPermitted } from '../../../modules/auth/infrastructure/signup-policy.js';
import { syncEnvOidcProviders } from '../../../modules/auth/infrastructure/sync-env-oidc-providers.js';
import { assertBetterAuthSecretForRuntime } from './better-auth-secret.js';

const pool = new pg.Pool({
  connectionString: process.env['DATABASE_URL'],
});

assertBetterAuthSecretForRuntime();

const passwordResetMailer = createPasswordResetMailer();
const emailChangeMailer = createEmailChangeMailer();

const webOrigin = process.env['WEB_ORIGIN'] ?? 'http://localhost:5173';

function passkeyRpId(): string {
  try {
    return new URL(webOrigin).hostname;
  } catch {
    return 'localhost';
  }
}

const authSecret = process.env['BETTER_AUTH_SECRET'] ?? 'dev-secret-change-me-32chars-minimum!!';

async function isUserSuspended(userId: string): Promise<boolean> {
  const result = await pool.query<{ suspended: boolean }>(
    `SELECT EXISTS (
       SELECT 1 FROM installation_user_suspensions s
       WHERE s.user_id = $1
         AND (s.expires_at IS NULL OR s.expires_at > now())
     ) AS suspended`,
    [userId]
  );
  return result.rows[0]?.suspended ?? false;
}

async function buildAuthInstance() {
  await syncEnvOidcProviders(pool);
  const oidcRepo = new PgInstallationOidcProviderRepository(pool);
  const oidcRows = await oidcRepo.listAll();
  const genericOauth = buildGenericOAuthPlugin(oidcRows);
  const emailChangeEnabled = isEmailChangeMailAvailable();

  return betterAuth({
    database: pool,
    hooks: {
      before: createBetterAuthPasswordPolicyBeforeHook(pool),
    },
    emailAndPassword: {
      enabled: true,
      minPasswordLength: AUTH_MIN_PASSWORD_LENGTH,
      maxPasswordLength: AUTH_MAX_PASSWORD_LENGTH,
      sendResetPassword: ({ user, url }) => {
        void passwordResetMailer.sendPasswordReset({
          to: user.email,
          subject: 'Reset your Docuvate password',
          resetUrl: url,
        });
        return Promise.resolve();
      },
    },
    user: {
      changeEmail: {
        enabled: emailChangeEnabled,
        sendChangeEmailConfirmation: async ({ user, url }) => {
          await emailChangeMailer.sendPasswordReset({
            to: user.email,
            subject: 'Bestätigen Sie Ihre E-Mail-Änderung bei Docuvate',
            resetUrl: url,
          });
        },
      },
    },
    emailVerification: {
      sendVerificationEmail: async ({ user, url }) => {
        await emailChangeMailer.sendPasswordReset({
          to: user.email,
          subject: 'Bestätigen Sie Ihre neue E-Mail bei Docuvate',
          resetUrl: url,
        });
      },
    },
    trustedOrigins: [webOrigin],
    baseURL: process.env['BETTER_AUTH_URL'] ?? 'http://localhost:3001',
    secret: authSecret,
    plugins: [
      twoFactor({
        issuer: 'Docuvate',
      }),
      passkey({
        rpID: passkeyRpId(),
        rpName: 'Docuvate',
        origin: webOrigin,
      }),
      ...(genericOauth ? [genericOauth] : []),
    ],
    databaseHooks: {
      user: {
        create: {
          before: async () => {
            if (!(await isSignupPermitted(pool))) {
              return false;
            }
          },
          after: async (user) => {
            await assignInstallationRoleAfterSignUp(pool, user.id);
          },
        },
      },
      session: {
        create: {
          before: async (session) => {
            const userId = session.userId;
            if (!userId) {
              return false;
            }
            if (await isUserSuspended(userId)) {
              throw new Error('Account suspended');
            }
          },
        },
      },
    },
  });
}

export type BetterAuthInstance = Awaited<ReturnType<typeof buildAuthInstance>>;

let authInstance: BetterAuthInstance | null = null;
let initPromise: Promise<BetterAuthInstance> | null = null;

export async function initializeAuth(): Promise<BetterAuthInstance> {
  if (authInstance) {
    return authInstance;
  }
  initPromise ??= buildAuthInstance().then((instance) => {
    authInstance = instance;
    return instance;
  });
  return initPromise;
}

export function getAuth(): BetterAuthInstance {
  if (!authInstance) {
    throw new Error('Auth runtime is not initialized. Call initializeAuth() before handling requests.');
  }
  return authInstance;
}

export async function invalidateAuthRuntime(): Promise<BetterAuthInstance> {
  authInstance = null;
  initPromise = null;
  return initializeAuth();
}

export function getAuthDatabasePool(): pg.Pool {
  return pool;
}
