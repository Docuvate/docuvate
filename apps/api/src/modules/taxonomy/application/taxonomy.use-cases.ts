// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Inject, Injectable } from '@nestjs/common';
import type {
  CreateCorrespondentRequest,
  CreateTagRequest,
  MatchingAlgorithm,
  UpdateCorrespondentRequest,
  UpdateTagRequest,
} from '@docuvate/contracts';
import {
  TAG_CUSTOM_FIELD_REPOSITORY,
  TAXONOMY_REPOSITORY,
  type TagCustomFieldRepository,
  type TaxonomyRepository,
} from '../../../shared/domain/ports.js';
import { assertTagNameNotNearDuplicate } from '../../../shared/domain/tag-name-uniqueness.js';

function algo(value: MatchingAlgorithm | undefined): MatchingAlgorithm {
  return value ?? 'none';
}

@Injectable()
export class ListTagsUseCase {
  constructor(
    @Inject(TAXONOMY_REPOSITORY) private readonly taxonomy: TaxonomyRepository,
    @Inject(TAG_CUSTOM_FIELD_REPOSITORY) private readonly customFields: TagCustomFieldRepository
  ) {}

  async execute(userId: string) {
    const tags = await this.taxonomy.listTags(userId);
    const allFields = await this.customFields.listForUser(userId);
    const fieldsByTag = new Map<string, typeof allFields>();
    for (const field of allFields) {
      const list = fieldsByTag.get(field.tagId) ?? [];
      list.push(field);
      fieldsByTag.set(field.tagId, list);
    }
    return tags.map((tag) => ({
      ...tag,
      customFields: (fieldsByTag.get(tag.id) ?? []).map((field) => ({
        id: field.id,
        tagId: field.tagId,
        key: field.key,
        label: field.label,
        fieldType: field.fieldType,
        sortOrder: field.sortOrder,
      })),
    }));
  }
}

@Injectable()
export class CreateTagUseCase {
  constructor(@Inject(TAXONOMY_REPOSITORY) private readonly taxonomy: TaxonomyRepository) {}
  async execute(userId: string, body: CreateTagRequest) {
    const existing = await this.taxonomy.listTags(userId);
    assertTagNameNotNearDuplicate(body.name, existing);
    return this.taxonomy.createTag(userId, body.name, {
      color: body.color ?? null,
      isInbox: body.isInbox,
      matchingAlgorithm: algo(body.matchingAlgorithm),
      match: body.match,
    });
  }
}

@Injectable()
export class UpdateTagUseCase {
  constructor(@Inject(TAXONOMY_REPOSITORY) private readonly taxonomy: TaxonomyRepository) {}
  async execute(userId: string, id: string, body: UpdateTagRequest) {
    if (body.name) {
      const existing = await this.taxonomy.listTags(userId);
      assertTagNameNotNearDuplicate(body.name, existing, id);
    }
    return this.taxonomy.updateTag(id, userId, {
      name: body.name,
      color: body.color,
      isInbox: body.isInbox,
      matchingAlgorithm: body.matchingAlgorithm,
      match: body.match,
    });
  }
}

@Injectable()
export class DeleteTagUseCase {
  constructor(@Inject(TAXONOMY_REPOSITORY) private readonly taxonomy: TaxonomyRepository) {}
  execute(userId: string, id: string) {
    return this.taxonomy.deleteTag(id, userId);
  }
}

@Injectable()
export class ListCorrespondentsUseCase {
  constructor(@Inject(TAXONOMY_REPOSITORY) private readonly taxonomy: TaxonomyRepository) {}
  execute(userId: string) {
    return this.taxonomy.listCorrespondents(userId);
  }
}

@Injectable()
export class CreateCorrespondentUseCase {
  constructor(@Inject(TAXONOMY_REPOSITORY) private readonly taxonomy: TaxonomyRepository) {}
  execute(userId: string, body: CreateCorrespondentRequest) {
    return this.taxonomy.createCorrespondent(
      userId,
      body.name,
      algo(body.matchingAlgorithm),
      body.match
    );
  }
}

@Injectable()
export class UpdateCorrespondentUseCase {
  constructor(@Inject(TAXONOMY_REPOSITORY) private readonly taxonomy: TaxonomyRepository) {}
  execute(userId: string, id: string, body: UpdateCorrespondentRequest) {
    return this.taxonomy.updateCorrespondent(id, userId, {
      name: body.name,
      matchingAlgorithm: body.matchingAlgorithm,
      match: body.match,
    });
  }
}

@Injectable()
export class DeleteCorrespondentUseCase {
  constructor(@Inject(TAXONOMY_REPOSITORY) private readonly taxonomy: TaxonomyRepository) {}
  execute(userId: string, id: string) {
    return this.taxonomy.deleteCorrespondent(id, userId);
  }
}
