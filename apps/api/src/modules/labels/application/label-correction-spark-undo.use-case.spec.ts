// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
/* eslint-disable @typescript-eslint/consistent-type-assertions -- vitest partial mocks */
import { describe, expect, it, vi } from 'vitest';

import type { TagEntity } from '../../taxonomy/domain/taxonomy.entity.js';
import { ApplyLabelCorrectionUseCase } from './apply-label-correction.use-case.js';
import { ApplySparkLabelPropagationUseCase } from './apply-spark-label-propagation.use-case.js';
import { WithdrawLabelCorrectionUseCase } from './withdraw-label-correction.use-case.js';

const USER = 'user-1';
const SOURCE = 'doc-source';
const SIM_A = 'doc-sim-a';
const SIM_B = 'doc-sim-b';
const TAG_A = 'tag-a';
const INBOX = 'tag-inbox';
const CORR = 'corr-1';

function tag(id: string, isInbox = false): TagEntity {
  return {
    id,
    userId: USER,
    name: id,
    color: '#000',
    isInbox,
    matchingAlgorithm: 'literal',
    match: '',
  };
}

describe('label correction SPARK undo', () => {
  it('correct → propagate 2 docs → withdraw restores propagated documents', async () => {
    const docTags = new Map<string, string[]>([
      [SOURCE, [INBOX]],
      [SIM_A, [INBOX]],
      [SIM_B, [INBOX]],
    ]);

    const taxonomy = {
      listTagsForDocument: vi.fn((documentId: string) => {
        const ids = docTags.get(documentId) ?? [];
        return Promise.resolve(ids.map((id): TagEntity => tag(id, id === INBOX)));
      }),
      assignTagToDocument: vi.fn((documentId: string, tagId: string) => {
        const ids = docTags.get(documentId) ?? [];
        if (!ids.includes(tagId)) {
          docTags.set(documentId, [...ids, tagId]);
        }
        return Promise.resolve();
      }),
      removeTagFromDocument: vi.fn((documentId: string, tagId: string) => {
        docTags.set(
          documentId,
          (docTags.get(documentId) ?? []).filter((id) => id !== tagId)
        );
        return Promise.resolve();
      }),
      clearInboxTagForDocument: vi.fn((documentId: string) => {
        docTags.set(
          documentId,
          (docTags.get(documentId) ?? []).filter((id) => id !== INBOX)
        );
        return Promise.resolve();
      }),
      ensureInboxTag: vi.fn(() => Promise.resolve(tag(INBOX, true))),
    };

    const propagated: {
      correctionId: string;
      documentId: string;
      tagId: string;
      inboxCleared: boolean;
    }[] = [];

    const densityRepo = {
      isCalibrationReady: vi.fn().mockResolvedValue(true),
      listTrainingExamples: vi.fn().mockResolvedValue({ allLabelIds: [TAG_A] }),
      loadWorkerState: vi.fn().mockResolvedValue({ label_ids: [TAG_A] }),
      recordPropagatedAssignment: vi.fn(
        (
          correctionId: string,
          documentId: string,
          tagId: string,
          inboxCleared: boolean
        ) => {
          propagated.push({ correctionId, documentId, tagId, inboxCleared });
          return Promise.resolve();
        }
      ),
      listPropagatedAssignments: vi.fn((correctionId: string) =>
        Promise.resolve(propagated.filter((row) => row.correctionId === correctionId))
      ),
      findLabelCorrectionAssignment: vi.fn().mockResolvedValue({
        fromTagId: null,
        toTagId: TAG_A,
      }),
      withdrawLabelCorrection: vi.fn().mockResolvedValue(true),
    };

    const labelEmbeddings = {
      listDocumentEmbeddingsForUser: vi.fn().mockResolvedValue([
        { documentId: SIM_A, embedding: [1, 0], nonInboxTagIds: [] },
        { documentId: SIM_B, embedding: [1, 0], nonInboxTagIds: [] },
      ]),
    };

    const densityWorker = {
      classify: vi.fn().mockResolvedValue({
        decisionTier: 'auto_apply',
        labelId: TAG_A,
      }),
    };

    const spark = new ApplySparkLabelPropagationUseCase(
      taxonomy as never,
      labelEmbeddings as never,
      densityRepo as never,
      densityWorker as never
    );

    const updated = await spark.propagateAfterLabelCorrection(USER, TAG_A, SOURCE, CORR);
    expect(updated).toBe(2);
    expect(docTags.get(SIM_A)).toEqual([TAG_A]);
    expect(docTags.get(SIM_B)).toEqual([TAG_A]);
    expect(propagated).toHaveLength(2);

    const withdraw = new WithdrawLabelCorrectionUseCase(
      { findByIdForUser: vi.fn().mockResolvedValue({ id: SOURCE }) } as never,
      taxonomy as never,
      densityRepo as never
    );
    await withdraw.execute(SOURCE, USER, CORR);

    expect(docTags.get(SIM_A)).toEqual([INBOX]);
    expect(docTags.get(SIM_B)).toEqual([INBOX]);
  });

  it('ApplyLabelCorrectionUseCase passes correctionId into SPARK propagation', async () => {
    const spark = { propagateAfterLabelCorrection: vi.fn().mockResolvedValue(2) };
    const assignTag = { execute: vi.fn().mockResolvedValue(undefined) };
    const densityCorrection = { recordLabelCorrection: vi.fn().mockResolvedValue(CORR) };
    const documents = { findByIdForUser: vi.fn().mockResolvedValue({ id: SOURCE }) };
    const taxonomy = {
      findTagByIdForUser: vi.fn().mockResolvedValue(tag(TAG_A)),
      listTagsForDocument: vi.fn().mockResolvedValue([]),
    };

    const useCase = new ApplyLabelCorrectionUseCase(
      documents as never,
      taxonomy as never,
      assignTag as never,
      densityCorrection as never,
      spark as never
    );

    await useCase.execute(SOURCE, USER, TAG_A);

    expect(spark.propagateAfterLabelCorrection).toHaveBeenCalledWith(
      USER,
      TAG_A,
      SOURCE,
      CORR
    );
  });
});
