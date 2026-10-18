// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { ReplaceTagCustomFieldsRequest } from '@docuvate/contracts';
import { Inject, Injectable } from '@nestjs/common';

import { NotFoundError } from '../../../shared/domain/errors.js';
import {
  TAG_CUSTOM_FIELD_REPOSITORY,
  type TagCustomFieldRepository,
  TAXONOMY_REPOSITORY,
  type TaxonomyRepository,
} from '../../../shared/domain/ports.js';

@Injectable()
export class ListTagCustomFieldsUseCase {
  constructor(
    @Inject(TAG_CUSTOM_FIELD_REPOSITORY) private readonly fields: TagCustomFieldRepository,
    @Inject(TAXONOMY_REPOSITORY) private readonly taxonomy: TaxonomyRepository
  ) {}

  async execute(tagId: string, userId: string) {
    const tag = await this.taxonomy.findTagByIdForUser(tagId, userId);
    if (!tag) {
      throw new NotFoundError('Tag');
    }
    return this.fields.listForTag(tagId, userId);
  }
}

@Injectable()
export class ReplaceTagCustomFieldsUseCase {
  constructor(
    @Inject(TAG_CUSTOM_FIELD_REPOSITORY) private readonly fields: TagCustomFieldRepository,
    @Inject(TAXONOMY_REPOSITORY) private readonly taxonomy: TaxonomyRepository
  ) {}

  async execute(tagId: string, userId: string, body: ReplaceTagCustomFieldsRequest) {
    const tag = await this.taxonomy.findTagByIdForUser(tagId, userId);
    if (!tag) {
      throw new NotFoundError('Tag');
    }
    return this.fields.replaceForTag(
      tagId,
      userId,
      body.fields.map((field, index) => ({
        key: field.key,
        label: field.label,
        fieldType: field.fieldType ?? 'text',
        sortOrder: field.sortOrder ?? index,
      }))
    );
  }
}
