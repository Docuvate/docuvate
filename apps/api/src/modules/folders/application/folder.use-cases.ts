// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Inject, Injectable } from '@nestjs/common';
import type { CreateFolderRequest, UpdateFolderRequest } from '@docuvate/contracts';
import {
  FOLDER_REPOSITORY,
  ID_GENERATOR,
  MAPPE_REPOSITORY,
  type FolderRepository,
  type IdGenerator,
  type MappeRepository,
} from '../../../shared/domain/ports.js';
import { NotFoundError, ValidationError } from '../../../shared/domain/errors.js';
import { assertFolderDepthAllowed } from '../domain/folder-depth.js';

@Injectable()
export class ListFoldersUseCase {
  constructor(@Inject(FOLDER_REPOSITORY) private readonly folders: FolderRepository) {}

  execute(userId: string) {
    return this.folders.listForUser(userId);
  }
}

@Injectable()
export class CreateFolderUseCase {
  constructor(
    @Inject(FOLDER_REPOSITORY) private readonly folders: FolderRepository,
    @Inject(MAPPE_REPOSITORY) private readonly mappen: MappeRepository,
    @Inject(ID_GENERATOR) private readonly ids: IdGenerator
  ) {}

  async execute(userId: string, body: CreateFolderRequest) {
    const name = body.name.trim();
    if (!name) throw new ValidationError('Folder name is required');
    let mappeId: string | null = body.mappeId ?? null;
    const allFolders = await this.folders.listForUser(userId);
    if (body.parentId) {
      const parent = await this.folders.findByIdForUser(body.parentId, userId);
      if (!parent) throw new NotFoundError('Folder');
      mappeId = parent.mappeId;
      try {
        assertFolderDepthAllowed(allFolders, { parentId: body.parentId });
      } catch {
        throw new ValidationError('Ordner maximal drei Ebenen tief');
      }
    } else if (mappeId) {
      const mappe = await this.mappen.findByIdForUser(mappeId, userId);
      if (!mappe) throw new NotFoundError('Mappe');
    }
    return this.folders.create(this.ids.generate(), userId, name, body.parentId ?? null, mappeId);
  }
}

@Injectable()
export class UpdateFolderUseCase {
  constructor(@Inject(FOLDER_REPOSITORY) private readonly folders: FolderRepository) {}

  async execute(id: string, userId: string, body: UpdateFolderRequest) {
    if (body.parentId) {
      if (body.parentId === id) throw new ValidationError('Folder cannot be its own parent');
      const parent = await this.folders.findByIdForUser(body.parentId, userId);
      if (!parent) throw new NotFoundError('Folder');
      const allFolders = await this.folders.listForUser(userId);
      try {
        assertFolderDepthAllowed(allFolders, { parentId: body.parentId, folderId: id });
      } catch {
        throw new ValidationError('Ordner maximal drei Ebenen tief');
      }
    }
    return this.folders.update(id, userId, {
      name: body.name?.trim(),
      parentId: body.parentId,
    });
  }
}

@Injectable()
export class DeleteFolderUseCase {
  constructor(@Inject(FOLDER_REPOSITORY) private readonly folders: FolderRepository) {}

  async execute(id: string, userId: string) {
    await this.folders.delete(id, userId);
  }
}
