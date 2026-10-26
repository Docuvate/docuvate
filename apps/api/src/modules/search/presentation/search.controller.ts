// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { GlobalSearchResponseDto } from '@docuvate/contracts';
import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import type { FastifyRequest } from 'fastify';

import {
  AuthGuard,
  type AuthSession,
  Session,
} from '../../../shared/infrastructure/auth/auth.guard.js';
import {
  ApiDocuvateController,
  ApiDocuvateRoute,
} from '../../../shared/presentation/swagger/openapi-decorators.js';
import { GlobalSearchUseCase } from '../application/global-search.use-case.js';
import { GlobalSearchQueryDto } from './global-search-query.dto.js';

@ApiDocuvateController('search')
@Controller('search')
@UseGuards(AuthGuard)
export class SearchController {
  constructor(private readonly globalSearch: GlobalSearchUseCase) {}

  @Get()
  @ApiDocuvateRoute({
    operationId: 'globalSearch',
    summary: 'Hybrid global search (FTS, trigram, semantic)',
    description:
      'Combines Postgres FTS, pg_trgm, and unaccent with optional semantic ranking over document_embeddings JSONB (bounded lexical candidates + in-API cosine, ADR 016). ABAC: only the caller’s own data.',
  })
  async search(
    @Session() session: AuthSession,
    @Query() query: GlobalSearchQueryDto,
    @Req() req: FastifyRequest
  ): Promise<GlobalSearchResponseDto> {
    const abortController = new AbortController();
    const onClose = () => {
      abortController.abort();
    };
    req.raw.on('close', onClose);
    try {
      return await this.globalSearch.execute(
        session.user.id,
        {
          q: query.q,
          types: query.types,
          limit: query.limit,
        },
        { signal: abortController.signal }
      );
    } finally {
      req.raw.off('close', onClose);
    }
  }
}
