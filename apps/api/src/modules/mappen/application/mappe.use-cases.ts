// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Inject, Injectable } from '@nestjs/common';
import type { CreateMappeRequest, UpdateMappeRequest } from '@docuvate/contracts';
import {
  ID_GENERATOR,
  MAPPE_REPOSITORY,
  type IdGenerator,
  type MappeRepository,
} from '../../../shared/domain/ports.js';
import { NotFoundError, ValidationError } from '../../../shared/domain/errors.js';

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
    @Inject(ID_GENERATOR) private readonly ids: IdGenerator
  ) {}

  async execute(userId: string, body: CreateMappeRequest) {
    const name = body.name.trim();
    if (!name) throw new ValidationError('Mappe name is required');
    const color = body.color?.trim() || null;
    return this.mappen.create(this.ids.generate(), userId, name, color);
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
