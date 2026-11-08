// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
/* eslint-disable @typescript-eslint/consistent-type-assertions -- vitest partial mocks */
import { describe, expect, it, vi } from 'vitest';

import type { AuthorizationSubject } from '../../../shared/domain/authorization.js';
import { NotFoundError, ValidationError } from '../../../shared/domain/errors.js';
import { ApplyPageTransformUseCase } from './apply-page-transform.use-case.js';

const DOC_ID = '11111111-1111-4111-8111-111111111111';
const CORRECTION_ID = '22222222-2222-4222-8222-222222222222';
const USER_ID = 'user-1';
const subject = {
  kind: 'user',
  id: USER_ID,
  tenantId: 'tenant-1',
  roles: [],
  claims: [],
} satisfies AuthorizationSubject;

function makeUseCase(overrides?: {
  findByIdForUser?: ReturnType<typeof vi.fn>;
  upsertUserTransform?: ReturnType<typeof vi.fn>;
  assert?: ReturnType<typeof vi.fn>;
}) {
  const documents = {
    findByIdForUser: overrides?.findByIdForUser ?? vi.fn().mockResolvedValue({ id: DOC_ID }),
  };
  const transforms = {
    upsertUserTransform:
      overrides?.upsertUserTransform ??
      vi.fn().mockResolvedValue({
        page: 1,
        rotationQuarterTurns: 1,
        deskewDeg: 0,
        source: 'user',
        updatedAt: '2026-11-06T00:00:00.000Z',
      }),
    listForDocument: vi.fn(),
    replacePipelineTransforms: vi.fn(),
  };
  const authorization = {
    assert: overrides?.assert ?? vi.fn().mockResolvedValue(undefined),
  };
  const useCase = new ApplyPageTransformUseCase(
    authorization as never,
    documents as never,
    transforms
  );
  return { useCase, documents, transforms, authorization };
}

describe('ApplyPageTransformUseCase', () => {
  it('persists a manual quarter-turn without re-OCR', async () => {
    const { useCase, transforms, authorization } = makeUseCase();
    const result = await useCase.execute(DOC_ID, 1, USER_ID, subject, {
      id: CORRECTION_ID,
      rotationQuarterTurns: 1,
    });
    expect(authorization.assert).toHaveBeenCalledWith(subject, 'document:write', { id: DOC_ID });
    expect(transforms.upsertUserTransform).toHaveBeenCalledWith({
      documentId: DOC_ID,
      page: 1,
      rotationQuarterTurns: 1,
      deskewDeg: 0,
      userId: USER_ID,
      correctionId: CORRECTION_ID,
    });
    expect(result.correctionId).toBe(CORRECTION_ID);
    expect(result.transform.rotationQuarterTurns).toBe(1);
  });

  it('rejects unknown documents', async () => {
    const { useCase } = makeUseCase({
      findByIdForUser: vi.fn().mockResolvedValue(null),
    });
    await expect(
      useCase.execute(DOC_ID, 1, USER_ID, subject, {
        id: CORRECTION_ID,
        rotationQuarterTurns: 1,
      })
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it('rejects invalid quarter turns and page numbers', async () => {
    const { useCase } = makeUseCase();
    await expect(
      useCase.execute(DOC_ID, 0, USER_ID, subject, {
        id: CORRECTION_ID,
        rotationQuarterTurns: 1,
      })
    ).rejects.toBeInstanceOf(ValidationError);
    await expect(
      useCase.execute(DOC_ID, 1, USER_ID, subject, {
        id: CORRECTION_ID,
        rotationQuarterTurns: 4 as 0,
      })
    ).rejects.toBeInstanceOf(ValidationError);
  });
});
