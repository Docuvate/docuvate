// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it, vi } from 'vitest';

import { createAssignDocumentTagUseCaseStub } from '../../../test-support/assign-document-tag-use-case.stub.js';
import { createDocumentRepositoryStub } from '../../../test-support/document-repository.stub.js';
import { createLabelEmbeddingRepositoryStub } from '../../../test-support/label-embedding-repository.stub.js';
import { createTaxonomyRepositoryStub } from '../../../test-support/taxonomy-repository.stub.js';
import {
  createUserPreferencesEntity,
  createUserPreferencesRepositoryStub,
} from '../../../test-support/user-preferences-repository.stub.js';
import type { TagEntity } from '../../taxonomy/domain/taxonomy.entity.js';
import { AcceptLabelRecommendationUseCase } from './label-recommendation-actions.use-case.js';

const USER = 'user-1';
const DOC = 'doc-1';
const TAG = 'tag-1';
const DOC_A = '11111111-1111-4111-8111-111111111111';
const DOC_B = '22222222-2222-4222-8222-222222222222';

function tag(id: string, name: string): TagEntity {
  return {
    id,
    userId: USER,
    name,
    color: '#64748b',
    isInbox: false,
    matchingAlgorithm: 'any',
    match: name,
  };
}

describe('AcceptLabelRecommendationUseCase', () => {
  it('accepts assign recommendations when document embeddings are missing', async () => {
    const assignExecute = vi.fn().mockResolvedValue(undefined);
    const assignTag = createAssignDocumentTagUseCaseStub({ execute: assignExecute });
    const dismissRecommendation = vi.fn().mockResolvedValue(undefined);
    const labelEmbeddings = createLabelEmbeddingRepositoryStub({
      dismissRecommendation,
      listDocumentEmbeddingsForUser: vi.fn().mockResolvedValue([]),
      getTagCentroids: vi.fn().mockResolvedValue([]),
    });
    const prefs = createUserPreferencesRepositoryStub({
      getForUser: vi
        .fn()
        .mockResolvedValue(createUserPreferencesEntity({ labelNearSimilarityThreshold: 0.7 })),
      upsert: vi.fn().mockResolvedValue(createUserPreferencesEntity()),
    });
    const taxonomy = createTaxonomyRepositoryStub();
    const documents = createDocumentRepositoryStub({
      findByIdForUser: vi.fn().mockResolvedValue({ id: DOC }),
    });

    const ceLabelPropagation = { propagateAfterLabelSeed: vi.fn().mockResolvedValue(0) };
    const useCase = new AcceptLabelRecommendationUseCase(
      taxonomy,
      labelEmbeddings,
      prefs,
      documents,
      assignTag,
      ceLabelPropagation as never
    );

    const recommendationId = `assign:${DOC}:${TAG}`;
    const result = await useCase.execute(USER, { recommendationId, tagId: TAG });

    expect(result).toEqual({ tagId: TAG, action: 'assigned', documentId: DOC });
    expect(assignExecute).toHaveBeenCalledWith(DOC, USER, TAG, { learnFromEmbedding: true });
    expect(dismissRecommendation).toHaveBeenCalledWith(USER, recommendationId);
  });

  it('creates a cluster label and assigns sample documents when documentIds are provided', async () => {
    const createdTag = tag('tag-new', 'Cluster Label');
    const assignExecute = vi.fn().mockResolvedValue(undefined);
    const assignTag = createAssignDocumentTagUseCaseStub({ execute: assignExecute });
    const createTag = vi.fn().mockResolvedValue(createdTag);
    const dismissRecommendation = vi.fn().mockResolvedValue(undefined);
    const addClusterDocumentExclusions = vi.fn().mockResolvedValue(undefined);
    const taxonomy = createTaxonomyRepositoryStub({
      listTags: vi.fn().mockResolvedValue([]),
      createTag,
    });
    const labelEmbeddings = createLabelEmbeddingRepositoryStub({
      dismissRecommendation,
      addClusterDocumentExclusions,
    });
    const prefs = createUserPreferencesRepositoryStub();
    const documents = createDocumentRepositoryStub({
      findByIdForUser: vi.fn().mockImplementation((id: string) => Promise.resolve({ id })),
    });

    const ceLabelPropagation = { propagateAfterLabelSeed: vi.fn().mockResolvedValue(0) };
    const useCase = new AcceptLabelRecommendationUseCase(
      taxonomy,
      labelEmbeddings,
      prefs,
      documents,
      assignTag,
      ceLabelPropagation as never
    );

    const result = await useCase.execute(USER, {
      recommendationId: 'new:cluster:cluster-label',
      proposedName: 'Cluster Label',
      documentIds: [DOC_A],
      excludedDocumentIds: [DOC_B],
    });

    expect(result).toEqual({ tagId: createdTag.id, action: 'created' });
    expect(ceLabelPropagation.propagateAfterLabelSeed).toHaveBeenCalledWith(USER, 'tag-new', [
      DOC_A,
      DOC_B,
    ]);
    expect(createTag).toHaveBeenCalledWith(USER, 'Cluster Label', {
      color: '#64748b',
      matchingAlgorithm: 'any',
      match: 'Cluster Label',
    });
    expect(assignExecute).toHaveBeenCalledTimes(1);
    expect(assignExecute).toHaveBeenCalledWith(DOC_A, USER, createdTag.id, {
      learnFromEmbedding: true,
    });
    expect(addClusterDocumentExclusions).toHaveBeenCalledWith(USER, 'cluster label', [DOC_B]);
    expect(dismissRecommendation).toHaveBeenCalledWith(USER, 'new:cluster:cluster-label');
  });
});
