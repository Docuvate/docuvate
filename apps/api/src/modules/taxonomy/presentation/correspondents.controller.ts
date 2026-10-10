// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';

import {
  AuthGuard,
  type AuthSession,
  Session,
} from '../../../shared/infrastructure/auth/auth.guard.js';
import { OkResponseDto } from '../../../shared/presentation/dtos/common.dto.js';
import {
  CorrespondentListResponseDto,
  CreateCorrespondentRequestDto,
  UpdateCorrespondentRequestDto,
} from '../../../shared/presentation/dtos/taxonomy.dto.js';
import {
  ApiDocuvateController,
  ApiDocuvateRoute,
} from '../../../shared/presentation/swagger/openapi-decorators.js';
import {
  CreateCorrespondentUseCase,
  DeleteCorrespondentUseCase,
  ListCorrespondentsUseCase,
  UpdateCorrespondentUseCase,
} from '../application/taxonomy.use-cases.js';
import { toCorrespondentDto } from './taxonomy.mapper.js';

@ApiDocuvateController('correspondents')
@Controller('correspondents')
@UseGuards(AuthGuard)
export class CorrespondentsController {
  constructor(
    private readonly listCorrespondents: ListCorrespondentsUseCase,
    private readonly createCorrespondent: CreateCorrespondentUseCase,
    private readonly updateCorrespondent: UpdateCorrespondentUseCase,
    private readonly deleteCorrespondent: DeleteCorrespondentUseCase
  ) {}

  @Get()
  @ApiDocuvateRoute({ operationId: 'listCorrespondents', summary: 'List correspondents' })
  async getCorrespondents(@Session() session: AuthSession): Promise<CorrespondentListResponseDto> {
    const items = await this.listCorrespondents.execute(session.user.id);
    return { items: items.map(toCorrespondentDto) };
  }

  @Post()
  @ApiDocuvateRoute({ operationId: 'createCorrespondent', summary: 'Create correspondent' })
  async postCorrespondent(
    @Session() session: AuthSession,
    @Body() body: CreateCorrespondentRequestDto
  ) {
    return toCorrespondentDto(await this.createCorrespondent.execute(session.user.id, body));
  }

  @Patch(':id')
  @ApiDocuvateRoute({ operationId: 'updateCorrespondent', summary: 'Update correspondent' })
  async patchCorrespondent(
    @Session() session: AuthSession,
    @Param('id') id: string,
    @Body() body: UpdateCorrespondentRequestDto
  ) {
    return toCorrespondentDto(await this.updateCorrespondent.execute(session.user.id, id, body));
  }

  @Delete(':id')
  @ApiDocuvateRoute({ operationId: 'deleteCorrespondent', summary: 'Delete correspondent' })
  async removeCorrespondent(
    @Session() session: AuthSession,
    @Param('id') id: string
  ): Promise<OkResponseDto> {
    await this.deleteCorrespondent.execute(session.user.id, id);
    return { ok: true };
  }
}
