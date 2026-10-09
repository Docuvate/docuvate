// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { IsOptional, IsString, IsUUID } from 'class-validator';
import type { CreateFolderRequest, FolderDto, UpdateFolderRequest } from '@docuvate/contracts';

export class CreateFolderRequestDto implements CreateFolderRequest {
  @IsString()
  name!: string;

  @IsOptional()
  @IsUUID('4')
  parentId?: string | null;

  @IsOptional()
  @IsUUID('4')
  mappeId?: string | null;
}

export class UpdateFolderRequestDto implements UpdateFolderRequest {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsUUID('4')
  parentId?: string | null;

  @IsOptional()
  @IsUUID('4')
  mappeId?: string | null;
}

export class FolderListResponseDto {
  items!: FolderDto[];
}

export class FolderResponseDto implements FolderDto {
  id!: string;
  name!: string;
  createdAt!: string;
  updatedAt!: string;
}
