// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import {
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

export class SftpIngressCreateAccountBodyDto {
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  displayName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  username?: string;

  @IsOptional()
  @IsString()
  @MinLength(16)
  @MaxLength(256)
  passwordPlain?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(8192)
  sshPublicKey?: string | null;

  @IsOptional()
  @IsUUID()
  folderId?: string | null;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  labelIds?: string[];

  @IsOptional()
  @IsBoolean()
  mapSubfolders?: boolean;
}

export class SftpIngressEventsQueryDto {
  @IsOptional()
  @IsString()
  limit?: string;
}
