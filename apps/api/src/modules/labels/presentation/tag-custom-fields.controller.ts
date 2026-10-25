// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Body, Controller, Get, Param, Put, UseGuards } from '@nestjs/common';

import {
  AuthGuard,
  type AuthSession,
  Session,
} from '../../../shared/infrastructure/auth/auth.guard.js';
import {
  ReplaceTagCustomFieldsRequestDto,
  TagCustomFieldListResponseDtoClass,
} from '../../../shared/presentation/dtos/tag-custom-fields.dto.js';
import {
  ApiDocuvateController,
  ApiDocuvateRoute,
} from '../../../shared/presentation/swagger/openapi-decorators.js';
import { SuggestTagCustomFieldsUseCase } from '../application/suggest-tag-custom-fields.use-case.js';
import {
  ListTagCustomFieldsUseCase,
  ReplaceTagCustomFieldsUseCase,
} from '../application/tag-custom-field.use-cases.js';
import { toTagCustomFieldDto } from './tag-custom-fields.mapper.js';

@ApiDocuvateController('taxonomy')
@Controller('tags')
@UseGuards(AuthGuard)
export class TagCustomFieldsController {
  constructor(
    private readonly listFields: ListTagCustomFieldsUseCase,
    private readonly replaceFields: ReplaceTagCustomFieldsUseCase,
    private readonly suggestFields: SuggestTagCustomFieldsUseCase
  ) {}

  @Get(':tagId/custom-fields')
  @ApiDocuvateRoute({ operationId: 'getCustomFields', summary: 'getCustomFields' })
  async getCustomFields(
    @Session() session: AuthSession,
    @Param('tagId') tagId: string
  ): Promise<TagCustomFieldListResponseDtoClass> {
    const userId = session.user.id;
    const [items, suggestions] = await Promise.all([
      this.listFields.execute(tagId, userId),
      this.suggestFields.execute(tagId, userId),
    ]);
    const existingKeys = new Set(items.map((field) => field.key.trim().toLowerCase()));
    const filteredSuggestions = suggestions.filter(
      (field) => !existingKeys.has(field.key.trim().toLowerCase())
    );
    return {
      items: items.map(toTagCustomFieldDto),
      suggestions: filteredSuggestions.length > 0 ? filteredSuggestions : undefined,
    };
  }

  @Put(':tagId/custom-fields')
  @ApiDocuvateRoute({ operationId: 'putCustomFields', summary: 'putCustomFields' })
  async putCustomFields(
    @Session() session: AuthSession,
    @Param('tagId') tagId: string,
    @Body() body: ReplaceTagCustomFieldsRequestDto
  ): Promise<TagCustomFieldListResponseDtoClass> {
    const items = await this.replaceFields.execute(tagId, session.user.id, body);
    return { items: items.map(toTagCustomFieldDto) };
  }
}
