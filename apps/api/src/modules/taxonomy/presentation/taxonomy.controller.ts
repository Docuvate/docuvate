// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';

import {
  AuthGuard,
  type AuthSession,
  Session,
} from '../../../shared/infrastructure/auth/auth.guard.js';
import { OkResponseDto } from '../../../shared/presentation/dtos/common.dto.js';
import {
  CreateTagRequestDto,
  TagListResponseDto,
  TagSearchQueryDto,
  TagSearchResponseDto,
  UpdateTagRequestDto,
} from '../../../shared/presentation/dtos/taxonomy.dto.js';
import {
  ApiDocuvateController,
  ApiDocuvateRoute,
} from '../../../shared/presentation/swagger/openapi-decorators.js';
import {
  CreateTagUseCase,
  DeleteTagUseCase,
  ListTagsUseCase,
  SearchTagsUseCase,
  UpdateTagUseCase,
} from '../application/taxonomy.use-cases.js';
import { toTagDto } from './taxonomy.mapper.js';

@ApiDocuvateController('taxonomy')
@Controller()
@UseGuards(AuthGuard)
export class TaxonomyController {
  constructor(
    private readonly listTags: ListTagsUseCase,
    private readonly searchTags: SearchTagsUseCase,
    private readonly createTag: CreateTagUseCase,
    private readonly updateTag: UpdateTagUseCase,
    private readonly deleteTag: DeleteTagUseCase
  ) {}

  @Get('tags')
  @ApiDocuvateRoute({ operationId: 'listTags', summary: 'List tags' })
  async getTags(@Session() session: AuthSession): Promise<TagListResponseDto> {
    const items = await this.listTags.execute(session.user.id);
    return { items: items.map(toTagDto) };
  }

  @Get('tags/search')
  @ApiDocuvateRoute({ operationId: 'searchTags', summary: 'Search tags (paginated)' })
  async getTagsSearch(
    @Session() session: AuthSession,
    @Query() query: TagSearchQueryDto
  ): Promise<TagSearchResponseDto> {
    const page = await this.searchTags.execute(session.user.id, query);
    return {
      items: page.items.map(toTagDto),
      nextCursor: page.nextCursor,
      hasMore: page.hasMore,
      total: page.total,
    };
  }

  @Post('tags')
  @ApiDocuvateRoute({ operationId: 'createTag', summary: 'Create tag' })
  async postTag(@Session() session: AuthSession, @Body() body: CreateTagRequestDto) {
    return toTagDto(await this.createTag.execute(session.user.id, body));
  }

  @Patch('tags/:id')
  @ApiDocuvateRoute({ operationId: 'updateTag', summary: 'Update tag' })
  async patchTag(
    @Session() session: AuthSession,
    @Param('id') id: string,
    @Body() body: UpdateTagRequestDto
  ) {
    return toTagDto(await this.updateTag.execute(session.user.id, id, body));
  }

  @Delete('tags/:id')
  @ApiDocuvateRoute({ operationId: 'deleteTag', summary: 'Delete tag' })
  async removeTag(
    @Session() session: AuthSession,
    @Param('id') id: string
  ): Promise<OkResponseDto> {
    await this.deleteTag.execute(session.user.id, id);
    return { ok: true };
  }
}
