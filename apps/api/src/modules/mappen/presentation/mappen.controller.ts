import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import type { MappeDto } from '@docuvate/contracts';
import { AuthGuard, Session, type AuthSession } from '../../../shared/infrastructure/auth/auth.guard.js';
import { OkResponseDto } from '../../../shared/presentation/dtos/common.dto.js';
import {
  CreateMappeRequestDto,
  MappeListResponseDto,
  UpdateMappeRequestDto,
} from '../../../shared/presentation/dtos/mappen.dto.js';
import type { MappeEntity, MappeListItem } from '../../../shared/domain/ports.js';
import {
  CreateMappeUseCase,
  DeleteMappeUseCase,
  ListMappenUseCase,
  UpdateMappeUseCase,
} from '../application/mappe.use-cases.js';
import { ApiDocuvateController, ApiDocuvateRoute } from '../../../shared/presentation/swagger/openapi-decorators.js';

function toMappeDto(entity: MappeEntity | MappeListItem): MappeDto {
  const counts =
    'documentCount' in entity
      ? { documentCount: entity.documentCount, folderCount: entity.folderCount }
      : {};
  return {
    id: entity.id,
    name: entity.name,
    color: entity.color,
    ...counts,
    createdAt: entity.createdAt.toISOString(),
    updatedAt: entity.updatedAt.toISOString(),
  };
}

@ApiDocuvateController('organizer')
@Controller('mappen')
@UseGuards(AuthGuard)
export class MappenController {
  constructor(
    private readonly listMappen: ListMappenUseCase,
    private readonly createMappe: CreateMappeUseCase,
    private readonly updateMappe: UpdateMappeUseCase,
    private readonly deleteMappe: DeleteMappeUseCase
  ) {}

  @Get()
  @ApiDocuvateRoute({ operationId: 'listMappen', summary: 'List root Ordner buckets' })
  async list(@Session() session: AuthSession): Promise<MappeListResponseDto> {
    const items = await this.listMappen.execute(session.user.id);
    return { items: items.map(toMappeDto) };
  }

  @Post()
  @ApiDocuvateRoute({ operationId: 'createMappe', summary: 'Create root Ordner bucket' })
  async create(@Session() session: AuthSession, @Body() body: CreateMappeRequestDto): Promise<MappeDto> {
    const mappe = await this.createMappe.execute(session.user.id, body);
    return toMappeDto(mappe);
  }

  @Patch(':id')
  @ApiDocuvateRoute({ operationId: 'updateMappe', summary: 'Update root Ordner bucket' })
  async patch(
    @Session() session: AuthSession,
    @Param('id') id: string,
    @Body() body: UpdateMappeRequestDto
  ): Promise<MappeDto> {
    const mappe = await this.updateMappe.execute(id, session.user.id, body);
    return toMappeDto(mappe);
  }

  @Delete(':id')
  @ApiDocuvateRoute({ operationId: 'deleteMappe', summary: 'Delete root Ordner bucket' })
  async remove(@Session() session: AuthSession, @Param('id') id: string): Promise<OkResponseDto> {
    await this.deleteMappe.execute(id, session.user.id);
    return { ok: true };
  }
}
