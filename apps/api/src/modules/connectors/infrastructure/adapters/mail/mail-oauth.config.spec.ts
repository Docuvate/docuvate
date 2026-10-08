import { afterEach, describe, expect, it } from 'vitest';
import {
  connectorOAuthRedirectUri,
  mailOAuthMissingEnvVars,
  mailOAuthSetupStatus,
} from './mail-oauth.config.js';

describe('mail oauth config', () => {
  const envSnapshot = { ...process.env };

  afterEach(() => {
    process.env = { ...envSnapshot };
  });

  it('lists missing Gmail env vars when unset', () => {
    delete process.env['DOCUVATE_GMAIL_OAUTH_CLIENT_ID'];
    delete process.env['DOCUVATE_GMAIL_OAUTH_CLIENT_SECRET'];
    expect(mailOAuthMissingEnvVars('gmail')).toEqual([
      'DOCUVATE_GMAIL_OAUTH_CLIENT_ID',
      'DOCUVATE_GMAIL_OAUTH_CLIENT_SECRET',
    ]);
    expect(mailOAuthSetupStatus('gmail').configured).toBe(false);
  });

  it('prefers explicit redirect URI', () => {
    process.env['DOCUVATE_CONNECTOR_OAUTH_REDIRECT_URI'] =
      'http://localhost:3001/v1/connectors/oauth/callback';
    expect(connectorOAuthRedirectUri()).toBe(
      'http://localhost:3001/v1/connectors/oauth/callback'
    );
  });

  it('builds redirect from public API URL', () => {
    delete process.env['DOCUVATE_CONNECTOR_OAUTH_REDIRECT_URI'];
    process.env['DOCUVATE_API_PUBLIC_URL'] = 'https://app.example.com/api';
    expect(connectorOAuthRedirectUri()).toBe(
      'https://app.example.com/api/v1/connectors/oauth/callback'
    );
  });
});
