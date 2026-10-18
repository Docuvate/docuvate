// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type {
  AdminAuthSignInSettingsDto,
  AdminOidcProviderDto,
  AuthOidcProviderPublicDto,
  AuthSignInOptionsDto,
  CreateAdminOidcProviderRequest,
  OidcProviderSource,
  UpdateAdminOidcProviderRequest,
} from '@docuvate/contracts';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class AuthOidcProviderPublicResponseDto implements AuthOidcProviderPublicDto {
  @IsString()
  providerId!: string;

  @IsString()
  displayName!: string;
}

export class AuthSignInOptionsResponseDto implements AuthSignInOptionsDto {
  @IsBoolean()
  passkeysEnabled!: boolean;

  @Type(() => AuthOidcProviderPublicResponseDto)
  oidcProviders!: AuthOidcProviderPublicResponseDto[];

  @IsBoolean()
  emailChangeAvailable!: boolean;
}

export class AdminOidcProviderResponseDto implements AdminOidcProviderDto {
  @IsUUID()
  id!: string;

  @IsString()
  providerId!: string;

  @IsString()
  displayName!: string;

  @IsString()
  issuer!: string;

  @IsString()
  clientId!: string;

  @IsString()
  scopes!: string;

  @IsBoolean()
  enabled!: boolean;

  @IsIn(['admin', 'env'])
  source!: OidcProviderSource;

  @IsBoolean()
  hasClientSecret!: boolean;
}

export class AdminAuthSignInSettingsResponseDto implements AdminAuthSignInSettingsDto {
  @IsBoolean()
  passkeysEnabled!: boolean;

  @Type(() => AdminOidcProviderResponseDto)
  oidcProviders!: AdminOidcProviderResponseDto[];
}

export class CreateAdminOidcProviderRequestDto implements CreateAdminOidcProviderRequest {
  @IsString()
  @Matches(/^[a-z][a-z0-9_-]{0,62}$/)
  providerId!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(120)
  displayName!: string;

  @IsString()
  @MinLength(8)
  issuer!: string;

  @IsString()
  @MinLength(1)
  clientId!: string;

  @IsString()
  @MinLength(1)
  clientSecret!: string;

  @IsString()
  @MinLength(3)
  scopes!: string;

  @IsBoolean()
  enabled!: boolean;
}

export class UpdateAdminOidcProviderRequestDto implements UpdateAdminOidcProviderRequest {
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  displayName!: string;

  @IsString()
  @MinLength(8)
  issuer!: string;

  @IsString()
  @MinLength(1)
  clientId!: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  clientSecret?: string;

  @IsString()
  @MinLength(3)
  scopes!: string;

  @IsBoolean()
  enabled!: boolean;
}

export class AdminOidcProviderIdParamDto {
  @IsUUID()
  id!: string;
}
