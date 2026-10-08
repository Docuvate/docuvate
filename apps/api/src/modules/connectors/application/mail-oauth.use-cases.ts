import { Inject, Injectable } from '@nestjs/common';
import { ValidationError } from '../../../shared/domain/errors.js';
import type { ConnectorPluginId } from '../domain/connector.types.js';
import {
  CONNECTOR_INSTALLATION_REPOSITORY,
  CONNECTOR_REGISTRY,
  type ConnectorInstallationRepository,
  type ConnectorRegistryPort,
} from '../domain/connector.ports.js';
import {
  connectorOAuthRedirectUri,
  mailOAuthConfig,
} from '../infrastructure/adapters/mail/mail-oauth.config.js';
import { newPkcePair } from '../infrastructure/adapters/mail/mail-oauth.pkce.js';
import {
  decodeMailOAuthState,
  encodeMailOAuthState,
  newOAuthNonce,
} from '../infrastructure/adapters/mail/mail-oauth.state.js';
import { connectorFetch } from '../infrastructure/adapters/shared/connector-http.js';

type MailPluginId = Extract<ConnectorPluginId, 'gmail' | 'outlook'>;

@Injectable()
export class StartMailOAuthUseCase {
  execute(input: {
    pluginId: MailPluginId;
    userId: string;
    displayName: string;
    accountHint?: string;
  }): { authorizationUrl: string } {
    const displayName = input.displayName.trim();
    if (!displayName) {
      throw new ValidationError('connectors.errors.displayNameRequired');
    }
    const config = mailOAuthConfig(input.pluginId);
    if (!config) {
      throw new ValidationError('connectors.errors.oauthNotConfigured');
    }
    const { codeVerifier, codeChallenge } = newPkcePair();
    const state = encodeMailOAuthState({
      pluginId: input.pluginId,
      userId: input.userId,
      displayName,
      accountHint: input.accountHint?.trim() || undefined,
      nonce: newOAuthNonce(),
      codeVerifier,
      issuedAtMs: Date.now(),
    });
    const redirectUri = connectorOAuthRedirectUri();
    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: config.scopes.join(' '),
      state,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
    });
    for (const [key, value] of Object.entries(config.extraAuthorizeParams ?? {})) {
      params.set(key, value);
    }
    return { authorizationUrl: `${config.authorizationEndpoint}?${params.toString()}` };
  }
}

interface TokenResponse {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
  scope?: string;
}

@Injectable()
export class CompleteMailOAuthUseCase {
  constructor(
    @Inject(CONNECTOR_REGISTRY) private readonly registry: ConnectorRegistryPort,
    @Inject(CONNECTOR_INSTALLATION_REPOSITORY)
    private readonly installations: ConnectorInstallationRepository
  ) {}

  async execute(input: { code: string; state: string }): Promise<{ installationId: string; pluginId: MailPluginId }> {
    const payload = decodeMailOAuthState(input.state);
    if (!payload) {
      throw new ValidationError('connectors.errors.oauthStateInvalid');
    }
    const config = mailOAuthConfig(payload.pluginId);
    if (!config) {
      throw new ValidationError('connectors.errors.oauthNotConfigured');
    }
    const redirectUri = connectorOAuthRedirectUri();
    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      code: input.code,
      redirect_uri: redirectUri,
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code_verifier: payload.codeVerifier,
    });
    const tokenResponse = await connectorFetch(config.tokenEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });
    if (!tokenResponse.ok) {
      throw new ValidationError('connectors.errors.oauthTokenExchangeFailed');
    }
    const tokens = (await tokenResponse.json()) as TokenResponse;
    const accessToken = tokens.access_token?.trim();
    if (!accessToken) {
      throw new ValidationError('connectors.errors.oauthTokenMissing');
    }
    const plugin = this.registry.getPlugin(payload.pluginId);
    if (!plugin) {
      throw new ValidationError('connectors.errors.oauthPluginMissing');
    }
    const credentials: Record<string, string> = {
      access_token: accessToken,
    };
    if (tokens.refresh_token?.trim()) {
      credentials['refresh_token'] = tokens.refresh_token.trim();
    }
    if (tokens.expires_in != null) {
      credentials['expires_at'] = String(Date.now() + tokens.expires_in * 1000);
    }
    if (payload.accountHint) {
      credentials['account_hint'] = payload.accountHint;
    }
    const validation = await plugin.validateConfiguration(credentials);
    if (!validation.ok) {
      throw new ValidationError(validation.messageKey ?? 'connectors.errors.oauthValidationFailed');
    }
    await this.installations.deleteForUserByPlugin(payload.userId, payload.pluginId);
    const installation = await this.installations.create({
      userId: payload.userId,
      pluginId: payload.pluginId,
      displayName: payload.displayName,
      credentials,
    });
    return { installationId: installation.id, pluginId: payload.pluginId };
  }
}
