// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import type { FolderDto } from '@docuvate/contracts';
import {
  AuthGuard,
  Session,
  type AuthSession,
} from '../../../shared/infrastructure/auth/auth.guard.js';
import { OkResponseDto } from '../../../shared/presentation/dtos/common.dto.js';
import {
  CreateFolderRequestDto,
  FolderListResponseDto,
  UpdateFolderRequestDto,
} from '../../../shared/presentation/dtos/folders.dto.js';
import {
  CreateFolderUseCase,
  DeleteFolderUseCase,
  ListFoldersUseCase,
  UpdateFolderUseCase,
} from '../application/folder.use-cases.js';
import type { FolderEntity, FolderListItem } from '../../../shared/domain/ports.js';
import {
  ApiDocuvateController,
  ApiDocuvateRoute,
} from '../../../shared/presentation/swagger/openapi-decorators.js';

function toFolderDto(entity: FolderEntity, documentCount?: number): FolderDto {
  return {
    id: entity.id,
    name: entity.name,
    parentId: entity.parentId,
    mappeId: entity.mappeId,
    ...(documentCount !== undefined ? { documentCount } : {}),
    createdAt: entity.createdAt.toISOString(),
    updatedAt: entity.updatedAt.toISOString(),
  };
}

function listItemToFolderDto(entity: FolderListItem): FolderDto {
  return toFolderDto(entity, entity.documentCount);
}

@ApiDocuvateController('organizer')
@Controller('folders')
@UseGuards(AuthGuard)
export class FoldersController {
  constructor(
    private readonly listFolders: ListFoldersUseCase,
    private readonly createFolder: CreateFolderUseCase,
    private readonly updateFolder: UpdateFolderUseCase,
    private readonly deleteFolder: DeleteFolderUseCase
  ) {}

  @Get()
  @ApiDocuvateRoute({ operationId: 'listFolders', summary: 'List folders' })
  async list(@Session() session: AuthSession): Promise<FolderListResponseDto> {
    const items = await this.listFolders.execute(session.user.id);
    return { items: items.map(listItemToFolderDto) };
  }

  @Post()
  @ApiDocuvateRoute({ operationId: 'createFolder', summary: 'Create folder' })
  async create(
    @Session() session: AuthSession,
    @Body() body: CreateFolderRequestDto
  ): Promise<FolderDto> {
    const folder = await this.createFolder.execute(session.user.id, body);
    return toFolderDto(folder);
  }

  @Patch(':id')
  @ApiDocuvateRoute({ operationId: 'updateFolder', summary: 'Update folder' })
  async patch(
    @Session() session: AuthSession,
    @Param('id') id: string,
    @Body() body: UpdateFolderRequestDto
  ): Promise<FolderDto> {
    const folder = await this.updateFolder.execute(id, session.user.id, body);
    return toFolderDto(folder);
  }

  @Delete(':id')
  @ApiDocuvateRoute({ operationId: 'deleteFolder', summary: 'Delete folder' })
  async remove(@Session() session: AuthSession, @Param('id') id: string): Promise<OkResponseDto> {
    await this.deleteFolder.execute(id, session.user.id);
    return { ok: true };
  }
}
