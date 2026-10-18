// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { CreateFolderRequest, UpdateFolderRequest } from '@docuvate/contracts';
import { ERROR_CODES, errorCodeI18nKey } from '@docuvate/contracts';
import { Inject, Injectable } from '@nestjs/common';

import { NotFoundError, ValidationError } from '../../../shared/domain/errors.js';
import {
  FOLDER_REPOSITORY,
  type FolderRepository,
  ID_GENERATOR,
  type IdGenerator,
} from '../../../shared/domain/ports.js';
import { wouldCreateFolderCycle } from '../domain/folder-cycle.js';

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
    @Inject(ID_GENERATOR) private readonly ids: IdGenerator
  ) {}

  async execute(userId: string, body: CreateFolderRequest) {
    const name = body.name.trim();
    if (!name) {
      throw new ValidationError(
        errorCodeI18nKey(ERROR_CODES.VALIDATION_FAILED),
        ERROR_CODES.VALIDATION_FAILED
      );
    }
    const parentId = body.parentId ?? null;
    if (parentId) {
      const parent = await this.folders.findByIdForUser(parentId, userId);
      if (!parent) throw new NotFoundError('Folder');
    }
    return this.folders.create(this.ids.generate(), userId, name, parentId);
  }
}

@Injectable()
export class UpdateFolderUseCase {
  constructor(@Inject(FOLDER_REPOSITORY) private readonly folders: FolderRepository) {}

  async execute(id: string, userId: string, body: UpdateFolderRequest) {
    const existing = await this.folders.findByIdForUser(id, userId);
    if (!existing) throw new NotFoundError('Folder');

    if (body.parentId !== undefined) {
      if (body.parentId === id) {
        throw new ValidationError(
          errorCodeI18nKey(ERROR_CODES.FOLDER_CYCLE),
          ERROR_CODES.FOLDER_CYCLE
        );
      }
      if (body.parentId) {
        const parent = await this.folders.findByIdForUser(body.parentId, userId);
        if (!parent) throw new NotFoundError('Folder');
        const allFolders = await this.folders.listForUser(userId);
        if (wouldCreateFolderCycle(allFolders, id, body.parentId)) {
          throw new ValidationError(
            errorCodeI18nKey(ERROR_CODES.FOLDER_CYCLE),
            ERROR_CODES.FOLDER_CYCLE
          );
        }
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
