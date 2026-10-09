// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { ConnectorPluginId } from '../../../domain/connector.types.js';

export interface MailOAuthProviderConfig {
  clientId: string;
  clientSecret: string;
  authorizationEndpoint: string;
  tokenEndpoint: string;
  scopes: string[];
  extraAuthorizeParams?: Record<string, string>;
}

function env(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

const GMAIL_OAUTH_ENV_VARS = [
  'DOCUVATE_GMAIL_OAUTH_CLIENT_ID',
  'DOCUVATE_GMAIL_OAUTH_CLIENT_SECRET',
] as const;

const OUTLOOK_OAUTH_ENV_VARS = [
  'DOCUVATE_OUTLOOK_OAUTH_CLIENT_ID',
  'DOCUVATE_OUTLOOK_OAUTH_CLIENT_SECRET',
] as const;

export function mailOAuthEnvVarNames(
  pluginId: Extract<ConnectorPluginId, 'gmail' | 'outlook'>
): readonly string[] {
  return pluginId === 'gmail' ? GMAIL_OAUTH_ENV_VARS : OUTLOOK_OAUTH_ENV_VARS;
}

export function mailOAuthMissingEnvVars(
  pluginId: Extract<ConnectorPluginId, 'gmail' | 'outlook'>
): string[] {
  return mailOAuthEnvVarNames(pluginId).filter((name) => !env(name));
}

export function connectorOAuthRedirectUri(): string {
  const configured = env('DOCUVATE_CONNECTOR_OAUTH_REDIRECT_URI');
  if (configured) {
    return configured;
  }
  const apiPublic = env('DOCUVATE_API_PUBLIC_URL');
  if (apiPublic) {
    return `${apiPublic.replace(/\/$/, '')}/v1/connectors/oauth/callback`;
  }
  return 'http://localhost:3001/v1/connectors/oauth/callback';
}

export function mailOAuthConfig(
  pluginId: Extract<ConnectorPluginId, 'gmail' | 'outlook'>
): MailOAuthProviderConfig | null {
  if (pluginId === 'gmail') {
    const clientId = env('DOCUVATE_GMAIL_OAUTH_CLIENT_ID');
    const clientSecret = env('DOCUVATE_GMAIL_OAUTH_CLIENT_SECRET');
    if (!clientId || !clientSecret) {
      return null;
    }
    return {
      clientId,
      clientSecret,
      authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenEndpoint: 'https://oauth2.googleapis.com/token',
      scopes: ['https://www.googleapis.com/auth/gmail.readonly'],
      extraAuthorizeParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    };
  }
  const clientId = env('DOCUVATE_OUTLOOK_OAUTH_CLIENT_ID');
  const clientSecret = env('DOCUVATE_OUTLOOK_OAUTH_CLIENT_SECRET');
  if (!clientId || !clientSecret) {
    return null;
  }
  return {
    clientId,
    clientSecret,
    authorizationEndpoint: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
    tokenEndpoint: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
    scopes: ['offline_access', 'Mail.Read'],
  };
}

export function mailOAuthConfigured(
  pluginId: Extract<ConnectorPluginId, 'gmail' | 'outlook'>
): boolean {
  return mailOAuthMissingEnvVars(pluginId).length === 0;
}

export function mailOAuthSetupStatus(pluginId: Extract<ConnectorPluginId, 'gmail' | 'outlook'>): {
  configured: boolean;
  missingEnvVars: string[];
} {
  const missingEnvVars = mailOAuthMissingEnvVars(pluginId);
  return { configured: missingEnvVars.length === 0, missingEnvVars: [...missingEnvVars] };
}
