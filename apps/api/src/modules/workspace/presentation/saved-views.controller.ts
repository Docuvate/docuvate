import { Body, Controller, Delete, Get, Param, Patch, Post, Put, UseGuards } from '@nestjs/common';
import { AuthGuard, Session, type AuthSession } from '../../../shared/infrastructure/auth/auth.guard.js';
import { OkResponseDto } from '../../../shared/presentation/dtos/common.dto.js';
import {
  CreateSavedDocumentViewRequestDto,
  ReorderSavedDocumentViewsRequestDto,
  SavedDocumentViewDtoClass,
  SavedDocumentViewListResponseDto,
  UpdateSavedDocumentViewRequestDto,
} from '../../../shared/presentation/dtos/workspace.dto.js';
import { ApiDocuvateController, ApiDocuvateRoute } from '../../../shared/presentation/swagger/openapi-decorators.js';
import {
  CreateSavedViewUseCase,
  DeleteSavedViewUseCase,
  GetSavedViewUseCase,
  ListSavedViewsUseCase,
  ReorderSavedViewsUseCase,
  UpdateSavedViewUseCase,
} from '../application/workspace.use-cases.js';
import { toSavedDocumentViewDto } from './workspace.mapper.js';

@ApiDocuvateController('workspace')
@Controller('saved-views')
@UseGuards(AuthGuard)
export class SavedViewsController {
  constructor(
    private readonly listViews: ListSavedViewsUseCase,
    private readonly getView: GetSavedViewUseCase,
    private readonly createView: CreateSavedViewUseCase,
    private readonly updateView: UpdateSavedViewUseCase,
    private readonly deleteView: DeleteSavedViewUseCase,
    private readonly reorderViews: ReorderSavedViewsUseCase
  ) {}

  @Get()
  @ApiDocuvateRoute({ operationId: 'listSavedDocumentViews', summary: 'List saved document views' })
  async list(@Session() session: AuthSession): Promise<SavedDocumentViewListResponseDto> {
    const items = await this.listViews.execute(session.user.id);
    return { items: items.map(toSavedDocumentViewDto) };
  }

  @Put('reorder')
  @ApiDocuvateRoute({ operationId: 'reorderSavedDocumentViews', summary: 'Reorder owned saved views' })
  async reorder(
    @Session() session: AuthSession,
    @Body() body: ReorderSavedDocumentViewsRequestDto
  ): Promise<OkResponseDto> {
    await this.reorderViews.execute(session.user.id, body.orderedIds);
    return { ok: true };
  }

  @Get(':id')
  @ApiDocuvateRoute({ operationId: 'getSavedDocumentView', summary: 'Get one saved document view' })
  async get(@Session() session: AuthSession, @Param('id') id: string): Promise<SavedDocumentViewDtoClass> {
    const view = await this.getView.execute(session.user.id, id);
    return toSavedDocumentViewDto(view);
  }

  @Post()
  @ApiDocuvateRoute({ operationId: 'createSavedDocumentView', summary: 'Create saved document view' })
  async create(
    @Session() session: AuthSession,
    @Body() body: CreateSavedDocumentViewRequestDto
  ): Promise<SavedDocumentViewDtoClass> {
    const view = await this.createView.execute(session.user.id, body);
    return toSavedDocumentViewDto(view);
  }

  @Patch(':id')
  @ApiDocuvateRoute({ operationId: 'updateSavedDocumentView', summary: 'Update saved document view' })
  async patch(
    @Session() session: AuthSession,
    @Param('id') id: string,
    @Body() body: UpdateSavedDocumentViewRequestDto
  ): Promise<SavedDocumentViewDtoClass> {
    const view = await this.updateView.execute(session.user.id, id, body);
    return toSavedDocumentViewDto(view);
  }

  @Delete(':id')
  @ApiDocuvateRoute({ operationId: 'deleteSavedDocumentView', summary: 'Delete saved document view' })
  async remove(@Session() session: AuthSession, @Param('id') id: string): Promise<OkResponseDto> {
    await this.deleteView.execute(session.user.id, id);
    return { ok: true };
  }

}
