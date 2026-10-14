// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { CreateMappeRequest, UpdateMappeRequest } from '@docuvate/contracts';
import { Inject, Injectable } from '@nestjs/common';

import { NotFoundError, ValidationError } from '../../../shared/domain/errors.js';
import {
  FOLDER_REPOSITORY,
  type FolderRepository,
  ID_GENERATOR,
  type IdGenerator,
  MAPPE_REPOSITORY,
  type MappeRepository,
} from '../../../shared/domain/ports.js';

@Injectable()
export class ListMappenUseCase {
  constructor(@Inject(MAPPE_REPOSITORY) private readonly mappen: MappeRepository) {}

  execute(userId: string) {
    return this.mappen.listForUser(userId);
  }
}

@Injectable()
export class CreateMappeUseCase {
  constructor(
    @Inject(MAPPE_REPOSITORY) private readonly mappen: MappeRepository,
    @Inject(FOLDER_REPOSITORY) private readonly folders: FolderRepository,
    @Inject(ID_GENERATOR) private readonly ids: IdGenerator
  ) {}

  async execute(userId: string, body: CreateMappeRequest) {
    const name = body.name.trim();
    if (!name) throw new ValidationError('Mappe name is required');
    const colorTrimmed = body.color?.trim();
    const color = colorTrimmed && colorTrimmed.length > 0 ? colorTrimmed : null;
    const mappeId = this.ids.generate();
    const mappe = await this.mappen.create(mappeId, userId, name, color);
    const rootFolderName = await this.uniqueRootFolderName(userId, name);
    await this.folders.create(this.ids.generate(), userId, rootFolderName, null, mappeId);
    return mappe;
  }

  private async uniqueRootFolderName(userId: string, preferred: string): Promise<string> {
    const existing = await this.folders.listForUser(userId);
    const taken = new Set(
      existing.filter((folder) => folder.parentId == null).map((folder) => folder.name)
    );
    if (!taken.has(preferred)) return preferred;
    let suffix = 2;
    while (taken.has(`${preferred} (${String(suffix)})`)) {
      suffix += 1;
    }
    return `${preferred} (${String(suffix)})`;
  }
}

@Injectable()
export class UpdateMappeUseCase {
  constructor(@Inject(MAPPE_REPOSITORY) private readonly mappen: MappeRepository) {}

  async execute(id: string, userId: string, body: UpdateMappeRequest) {
    const existing = await this.mappen.findByIdForUser(id, userId);
    if (!existing) throw new NotFoundError('Mappe');
    return this.mappen.update(id, userId, {
      name: body.name?.trim(),
      color: body.color,
    });
  }
}

@Injectable()
export class DeleteMappeUseCase {
  constructor(@Inject(MAPPE_REPOSITORY) private readonly mappen: MappeRepository) {}

  async execute(id: string, userId: string) {
    await this.mappen.delete(id, userId);
  }
}
