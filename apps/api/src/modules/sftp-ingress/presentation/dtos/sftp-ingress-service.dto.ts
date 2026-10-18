// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class SftpIngressServiceAuditDto {
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  kind!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(128)
  username!: string;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  clientIp?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  accountId?: string;
}

export class SftpIngressServiceAuthenticateDto {
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  username!: string;

  @IsOptional()
  @IsString()
  @MaxLength(4096)
  password?: string;

  @IsOptional()
  @IsString()
  @MaxLength(8192)
  publicKey?: string;
}

export class SftpIngressServiceResolveDto {
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  username!: string;
}
