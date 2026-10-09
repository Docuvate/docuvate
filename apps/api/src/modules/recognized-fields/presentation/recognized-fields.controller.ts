// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import {
  AuthGuard,
  Session,
  type AuthSession,
} from '../../../shared/infrastructure/auth/auth.guard.js';
import { ReplaceRecognizedFieldsRequestDto } from '../../../shared/presentation/dtos/recognized-fields.dto.js';
import {
  ListRecognizedFieldsUseCase,
  ReplaceRecognizedFieldsUseCase,
} from '../application/recognized-field.use-cases.js';
import { toRecognizedFieldDto } from './recognized-fields.mapper.js';

import {
  ApiDocuvateController,
  ApiDocuvateRoute,
} from '../../../shared/presentation/swagger/openapi-decorators.js';

@ApiDocuvateController('settings')
@Controller('recognized-fields')
@UseGuards(AuthGuard)
export class RecognizedFieldsController {
  constructor(
    private readonly listFields: ListRecognizedFieldsUseCase,
    private readonly replaceFields: ReplaceRecognizedFieldsUseCase
  ) {}

  @Get()
  @ApiDocuvateRoute({
    operationId: 'listRecognizedFields',
    summary: 'List recognized field catalog',
  })
  async get(@Session() session: AuthSession) {
    const items = await this.listFields.execute(session.user.id);
    return { items: items.map(toRecognizedFieldDto) };
  }

  @Put()
  @ApiDocuvateRoute({
    operationId: 'replaceRecognizedFields',
    summary: 'Replace recognized field catalog',
  })
  async put(@Session() session: AuthSession, @Body() body: ReplaceRecognizedFieldsRequestDto) {
    const items = await this.replaceFields.execute(session.user.id, body);
    return { items: items.map(toRecognizedFieldDto) };
  }
}
