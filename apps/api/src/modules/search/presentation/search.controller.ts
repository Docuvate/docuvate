import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import type { GlobalSearchResponseDto } from '@docuvate/contracts';
import { AuthGuard, Session, type AuthSession } from '../../../shared/infrastructure/auth/auth.guard.js';
import { ApiDocuvateController, ApiDocuvateRoute } from '../../../shared/presentation/swagger/openapi-decorators.js';
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
    @Query() query: GlobalSearchQueryDto
  ): Promise<GlobalSearchResponseDto> {
    return this.globalSearch.execute(session.user.id, {
      q: query.q,
      types: query.types,
      limit: query.limit,
    });
  }
}
