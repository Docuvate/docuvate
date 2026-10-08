import { Body, Controller, Delete, Param, Post, UseGuards } from '@nestjs/common';
import type { DismissTagSuggestionRequest } from '@docuvate/contracts';
import { DismissTagSuggestionRequestDto } from '../../../shared/presentation/dtos/labels.dto.js';
import { AuthGuard, Session, type AuthSession } from '../../../shared/infrastructure/auth/auth.guard.js';
import { OkResponseDto } from '../../../shared/presentation/dtos/common.dto.js';
import {
  AcceptTagSuggestionUseCase,
  AssignDocumentTagUseCase,
  DismissTagSuggestionUseCase,
  RemoveDocumentTagUseCase,
} from '../application/document-label.use-cases.js';

import { ApiDocuvateController, ApiDocuvateRoute } from '../../../shared/presentation/swagger/openapi-decorators.js';

@ApiDocuvateController('documents')
@Controller('documents/:documentId')
@UseGuards(AuthGuard)
export class DocumentLabelsController {
  constructor(
    private readonly assignTag: AssignDocumentTagUseCase,
    private readonly removeTag: RemoveDocumentTagUseCase,
    private readonly acceptSuggestion: AcceptTagSuggestionUseCase,
    private readonly dismissSuggestion: DismissTagSuggestionUseCase
  ) {}

  @Post('tags/:tagId')
  @ApiDocuvateRoute({ operationId: 'assignDocumentTag', summary: 'Assign tag to document' })
  async assign(
    @Session() session: AuthSession,
    @Param('documentId') documentId: string,
    @Param('tagId') tagId: string
  ): Promise<OkResponseDto> {
    await this.assignTag.execute(documentId, session.user.id, tagId);
    return { ok: true };
  }

  @Delete('tags/:tagId')
  @ApiDocuvateRoute({ operationId: 'removeDocumentTag', summary: 'Remove tag from document' })
  async remove(
    @Session() session: AuthSession,
    @Param('documentId') documentId: string,
    @Param('tagId') tagId: string
  ): Promise<OkResponseDto> {
    await this.removeTag.execute(documentId, session.user.id, tagId);
    return { ok: true };
  }

  @Post('tag-suggestions/:tagId/accept')
  @ApiDocuvateRoute({ operationId: 'acceptDocumentTagSuggestion', summary: 'Accept tag suggestion on document' })
  async accept(
    @Session() session: AuthSession,
    @Param('documentId') documentId: string,
    @Param('tagId') tagId: string
  ): Promise<OkResponseDto> {
    await this.acceptSuggestion.execute(documentId, session.user.id, tagId);
    return { ok: true };
  }

  @Post('tag-suggestions/:tagId/dismiss')
  @ApiDocuvateRoute({ operationId: 'dismissDocumentTagSuggestion', summary: 'Dismiss tag suggestion on document' })
  async dismiss(
    @Session() session: AuthSession,
    @Param('documentId') documentId: string,
    @Param('tagId') tagId: string,
    @Body() body?: DismissTagSuggestionRequestDto
  ): Promise<OkResponseDto> {
    const options: DismissTagSuggestionRequest = body ?? {};
    await this.dismissSuggestion.execute(documentId, session.user.id, tagId, options);
    return { ok: true };
  }
}
