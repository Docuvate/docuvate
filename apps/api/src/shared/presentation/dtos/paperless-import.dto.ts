// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { IsBoolean, IsObject, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

export class TestPaperlessConnectionRequestDto {
  @IsObject()
  credentials!: Record<string, string>;
}

export class TestPaperlessInstallationConnectionRequestDto {
  @IsOptional()
  @IsObject()
  credentials?: Record<string, string>;
}

export class UpdatePaperlessInstallationRequestDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  displayName?: string;

  @IsOptional()
  @IsObject()
  credentials?: Record<string, string>;

  @IsOptional()
  @IsBoolean()
  keepOcrText?: boolean;

  @IsOptional()
  @IsBoolean()
  rerunOcr?: boolean;

  @IsOptional()
  @IsBoolean()
  includeArchivedPdf?: boolean;
}

export class PaperlessImportRunParamsDto {
  @IsUUID()
  installationId!: string;

  @IsUUID()
  runId!: string;
}
