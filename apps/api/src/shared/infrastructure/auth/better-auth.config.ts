import { passkey } from '@better-auth/passkey';
import { betterAuth } from 'better-auth';
import { twoFactor } from 'better-auth/plugins/two-factor';
import pg from 'pg';
import {
  AUTH_MAX_PASSWORD_LENGTH,
  AUTH_MIN_PASSWORD_LENGTH,
} from '../../../modules/auth/domain/auth-password.constants.js';
import { assignInstallationRoleAfterSignUp } from '../../../modules/auth/infrastructure/instance-user-bootstrap.js';
import { createPasswordResetMailer } from '../../../modules/auth/infrastructure/mail/password-reset-mailer.factory.js';
import { isSignupPermitted } from '../../../modules/auth/infrastructure/signup-policy.js';
import { assertBetterAuthSecretForRuntime } from './better-auth-secret.js';

const pool = new pg.Pool({
  connectionString: process.env['DATABASE_URL'],
});

assertBetterAuthSecretForRuntime();

const passwordResetMailer = createPasswordResetMailer();

const webOrigin = process.env['WEB_ORIGIN'] ?? 'http://localhost:5173';

function passkeyRpId(): string {
  try {
    return new URL(webOrigin).hostname;
  } catch {
    return 'localhost';
  }
}

const authSecret =
  process.env['BETTER_AUTH_SECRET'] ?? 'dev-secret-change-me-32chars-minimum!!';

async function isUserSuspended(userId: string): Promise<boolean> {
  const result = await pool.query<{ suspended: boolean }>(
    `SELECT EXISTS (
       SELECT 1 FROM installation_user_suspensions s
       WHERE s.user_id = $1
         AND (s.expires_at IS NULL OR s.expires_at > now())
     ) AS suspended`,
    [userId]
  );
  return result.rows[0]?.suspended === true;
}

export const auth = betterAuth({
  database: pool,
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
