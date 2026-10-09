// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Body, Controller, Get, Param, Put, UseGuards } from '@nestjs/common';
import {
  AuthGuard,
  Session,
  type AuthSession,
} from '../../../shared/infrastructure/auth/auth.guard.js';
import {
  ReplaceTagCustomFieldsRequestDto,
  TagCustomFieldListResponseDto,
} from '../../../shared/presentation/dtos/tag-custom-fields.dto.js';
import {
  ListTagCustomFieldsUseCase,
  ReplaceTagCustomFieldsUseCase,
} from '../application/tag-custom-field.use-cases.js';
import { toTagCustomFieldDto } from './tag-custom-fields.mapper.js';

import {
  ApiDocuvateController,
  ApiDocuvateRoute,
} from '../../../shared/presentation/swagger/openapi-decorators.js';

@ApiDocuvateController('taxonomy')
@Controller('tags')
@UseGuards(AuthGuard)
export class TagCustomFieldsController {
  constructor(
    private readonly listFields: ListTagCustomFieldsUseCase,
    private readonly replaceFields: ReplaceTagCustomFieldsUseCase
  ) {}

  @Get(':tagId/custom-fields')
  @ApiDocuvateRoute({ operationId: 'getCustomFields', summary: 'getCustomFields' })
  async getCustomFields(
    @Session() session: AuthSession,
    @Param('tagId') tagId: string
  ): Promise<TagCustomFieldListResponseDto> {
    const items = await this.listFields.execute(tagId, session.user.id);
    return { items: items.map(toTagCustomFieldDto) };
  }

  @Put(':tagId/custom-fields')
  @ApiDocuvateRoute({ operationId: 'putCustomFields', summary: 'putCustomFields' })
  async putCustomFields(
    @Session() session: AuthSession,
    @Param('tagId') tagId: string,
    @Body() body: ReplaceTagCustomFieldsRequestDto
  ): Promise<TagCustomFieldListResponseDto> {
    const items = await this.replaceFields.execute(tagId, session.user.id, body);
    return { items: items.map(toTagCustomFieldDto) };
  }
}
