import { betterAuth } from 'better-auth';
import pg from 'pg';
import {
  AUTH_MAX_PASSWORD_LENGTH,
  AUTH_MIN_PASSWORD_LENGTH,
} from '../../../modules/auth/domain/auth-password.constants.js';
import { createPasswordResetMailer } from '../../../modules/auth/infrastructure/mail/password-reset-mailer.factory.js';

const pool = new pg.Pool({
  connectionString: process.env['DATABASE_URL'],
});

const passwordResetMailer = createPasswordResetMailer();

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
  trustedOrigins: [process.env['WEB_ORIGIN'] ?? 'http://localhost:5173'],
  baseURL: process.env['BETTER_AUTH_URL'] ?? 'http://localhost:3001',
  secret:
    process.env['BETTER_AUTH_SECRET'] ??
    'dev-secret-change-me-32chars-minimum!!',
});
