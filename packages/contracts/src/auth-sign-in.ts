// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

export interface AuthOidcProviderPublicDto {
  providerId: string;
  displayName: string;
}

export interface AuthSignInOptionsDto {
  passkeysEnabled: boolean;
  oidcProviders: AuthOidcProviderPublicDto[];
  emailChangeAvailable: boolean;
}

export type OidcProviderSource = 'admin' | 'env';

export interface AdminOidcProviderDto {
  id: string;
  providerId: string;
  displayName: string;
  issuer: string;
  clientId: string;
  scopes: string;
  enabled: boolean;
  source: OidcProviderSource;
  hasClientSecret: boolean;
}

export interface AdminAuthSignInSettingsDto {
  passkeysEnabled: boolean;
  oidcProviders: AdminOidcProviderDto[];
}

export interface CreateAdminOidcProviderRequest {
  providerId: string;
  displayName: string;
  issuer: string;
  clientId: string;
  clientSecret: string;
  scopes: string;
  enabled: boolean;
}

export interface UpdateAdminOidcProviderRequest {
  displayName: string;
  issuer: string;
  clientId: string;
  clientSecret?: string;
  scopes: string;
  enabled: boolean;
}
