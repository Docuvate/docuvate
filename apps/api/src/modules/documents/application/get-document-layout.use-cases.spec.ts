// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { randomUUID } from 'node:crypto';

import type { LayoutIrDocument } from '@docuvate/contracts';
import { Test } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { DocumentAuthorizationService } from '../../../shared/application/document-authorization.service.js';
import {
  ForbiddenError,
  NotFoundError,
  ServiceUnavailableError,
} from '../../../shared/domain/errors.js';
import { DOCUMENT_REPOSITORY, type DocumentRepository } from '../../../shared/domain/ports.js';
import { createDocumentRepositoryStub } from '../../../test-support/document-repository.stub.js';
import { GetDocumentContentUseCase } from './get-document-content.use-case.js';
import { GetDocumentLayoutHtmlUseCase } from './get-document-layout-html.use-case.js';
import { GetDocumentLayoutIrUseCase } from './get-document-layout-ir.use-case.js';
import { GetDocumentLayoutTypstUseCase } from './get-document-layout-typst.use-case.js';

const layoutIr: LayoutIrDocument = {
  version: 1,
  pages: [{ page: 1, widthPt: 595, heightPt: 842, blocks: [] }],
};

describe('layout document use cases', () => {
  const userId = 'user-a';
  const otherId = 'user-b';
  const docId = randomUUID();
  const subject = {
    kind: 'user' as const,
    id: userId,
    tenantId: userId,
    roles: ['owner'],
    claims: ['document:*'],
  };

  const findByIdForUser = vi.fn();
  const findLayoutIrForUser = vi.fn();
  const documents = createDocumentRepositoryStub({
    findByIdForUser,
    findLayoutIrForUser,
  });
  const documentAuthzAssert = vi.fn();
  const getDocumentContent = {
    execute: vi.fn(),
  };

  beforeEach(() => {
    findByIdForUser.mockReset();
    findLayoutIrForUser.mockReset();
    documentAuthzAssert.mockReset();
    getDocumentContent.execute.mockReset();
    getDocumentContent.execute.mockResolvedValue({
      buffer: Buffer.from('%PDF-1.4'),
      mimeType: 'application/pdf',
      filename: 'doc.pdf',
    });
    documentAuthzAssert.mockResolvedValue(undefined);
  });

  async function createLayoutIrUseCase(): Promise<GetDocumentLayoutIrUseCase> {
    const moduleRef = await Test.createTestingModule({
      providers: [
        {
          provide: GetDocumentLayoutIrUseCase,
          useFactory: (
            documentRepository: DocumentRepository,
            authorization: DocumentAuthorizationService
          ) => new GetDocumentLayoutIrUseCase(documentRepository, authorization),
          inject: [DOCUMENT_REPOSITORY, DocumentAuthorizationService],
        },
        { provide: DOCUMENT_REPOSITORY, useValue: documents },
        {
          provide: DocumentAuthorizationService,
          useValue: { assert: documentAuthzAssert },
        },
      ],
    }).compile();
    return moduleRef.get(GetDocumentLayoutIrUseCase);
  }

  async function createLayoutTypstUseCase(): Promise<GetDocumentLayoutTypstUseCase> {
    const moduleRef = await Test.createTestingModule({
      providers: [
        {
          provide: GetDocumentLayoutTypstUseCase,
          useFactory: (
            getLayoutIr: GetDocumentLayoutIrUseCase,
            getContent: GetDocumentContentUseCase
          ) => new GetDocumentLayoutTypstUseCase(getLayoutIr, getContent),
          inject: [GetDocumentLayoutIrUseCase, GetDocumentContentUseCase],
        },
        {
          provide: GetDocumentLayoutIrUseCase,
          useFactory: (
            documentRepository: DocumentRepository,
            authorization: DocumentAuthorizationService
          ) => new GetDocumentLayoutIrUseCase(documentRepository, authorization),
          inject: [DOCUMENT_REPOSITORY, DocumentAuthorizationService],
        },
        { provide: DOCUMENT_REPOSITORY, useValue: documents },
        {
          provide: DocumentAuthorizationService,
          useValue: { assert: documentAuthzAssert },
        },
        { provide: GetDocumentContentUseCase, useValue: getDocumentContent },
      ],
    }).compile();
    return moduleRef.get(GetDocumentLayoutTypstUseCase);
  }

  async function createLayoutHtmlUseCase(): Promise<GetDocumentLayoutHtmlUseCase> {
    const moduleRef = await Test.createTestingModule({
      providers: [
        {
          provide: GetDocumentLayoutHtmlUseCase,
          useFactory: (
            getLayoutIr: GetDocumentLayoutIrUseCase,
            getContent: GetDocumentContentUseCase
          ) => new GetDocumentLayoutHtmlUseCase(getLayoutIr, getContent),
          inject: [GetDocumentLayoutIrUseCase, GetDocumentContentUseCase],
        },
        {
          provide: GetDocumentLayoutIrUseCase,
          useFactory: (
            documentRepository: DocumentRepository,
            authorization: DocumentAuthorizationService
          ) => new GetDocumentLayoutIrUseCase(documentRepository, authorization),
          inject: [DOCUMENT_REPOSITORY, DocumentAuthorizationService],
        },
        { provide: DOCUMENT_REPOSITORY, useValue: documents },
        {
          provide: DocumentAuthorizationService,
          useValue: { assert: documentAuthzAssert },
        },
        { provide: GetDocumentContentUseCase, useValue: getDocumentContent },
      ],
    }).compile();
    return moduleRef.get(GetDocumentLayoutHtmlUseCase);
  }

  it('returns layout IR for owner', async () => {
    findByIdForUser.mockResolvedValue({ id: docId, userId });
    findLayoutIrForUser.mockResolvedValue(layoutIr);
    const uc = await createLayoutIrUseCase();
    await expect(uc.execute(docId, userId, subject)).resolves.toEqual(layoutIr);
  });

  it('parses layout IR blocks stored in JSONB (page field, not type)', async () => {
    findByIdForUser.mockResolvedValue({ id: docId, userId });
    findLayoutIrForUser.mockResolvedValue({
      version: 1,
      pages: [
        {
          page: 1,
          widthPt: 595,
          heightPt: 842,
          blocks: [
            {
              page: 1,
              x: 0.1,
              y: 0.2,
              width: 0.5,
              height: 0.04,
              text: 'Invoice total',
            },
          ],
        },
      ],
    });
    const uc = await createLayoutIrUseCase();
    const result = await uc.execute(docId, userId, subject);
    expect(result.pages[0]?.blocks).toHaveLength(1);
    expect(result.pages[0]?.blocks[0]?.text).toBe('Invoice total');
  });

  it('parses layout IR tables from storage JSON', async () => {
    findByIdForUser.mockResolvedValue({ id: docId, userId });
    findLayoutIrForUser.mockResolvedValue({
      version: 1,
      pages: [
        {
          page: 1,
          widthPt: 595,
          heightPt: 842,
          blocks: [],
          tables: [
            {
              page: 1,
              x: 0.1,
              y: 0.3,
              width: 0.8,
              height: 0.2,
              columnCount: 2,
              rows: [
                [
                  { text: 'Qty', x: 0.1, y: 0.3, width: 0.2, height: 0.04 },
                  { text: 'Item', x: 0.35, y: 0.3, width: 0.5, height: 0.04 },
                ],
              ],
            },
          ],
        },
      ],
    });
    const uc = await createLayoutIrUseCase();
    const result = await uc.execute(docId, userId, subject);
    expect(result.pages[0]?.tables).toHaveLength(1);
    expect(result.pages[0]?.tables?.[0]?.rows[0]?.[0]?.text).toBe('Qty');
  });

  it('404 when another user requests layout IR', async () => {
    findByIdForUser.mockResolvedValue(null);
    const uc = await createLayoutIrUseCase();
    await expect(uc.execute(docId, otherId, subject)).rejects.toBeInstanceOf(NotFoundError);
  });

  it('404 when IR row missing', async () => {
    findByIdForUser.mockResolvedValue({ id: docId, userId });
    findLayoutIrForUser.mockResolvedValue(null);
    const uc = await createLayoutIrUseCase();
    await expect(uc.execute(docId, userId, subject)).rejects.toBeInstanceOf(NotFoundError);
  });

  it('propagates ABAC denial for layout IR', async () => {
    findByIdForUser.mockResolvedValue({ id: docId, userId });
    documentAuthzAssert.mockRejectedValue(new ForbiddenError());
    const uc = await createLayoutIrUseCase();
    await expect(uc.execute(docId, userId, subject)).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('returns typst for owner', async () => {
    findByIdForUser.mockResolvedValue({ id: docId, userId });
    findLayoutIrForUser.mockResolvedValue(layoutIr);
    const typstUc = await createLayoutTypstUseCase();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({
            typst: '#set page(margin: 0pt)',
            reconstructionReliable: true,
          }),
      })
    );
    const result = await typstUc.execute(docId, userId, subject);
    expect(result.typst).toContain('page');
    expect(result.exportMode).toBe('exakt');
    expect(result.reconstructionReliable).toBe(true);
    vi.unstubAllGlobals();
  });

  it('404 when another user requests layout typst', async () => {
    findByIdForUser.mockResolvedValue(null);
    const typstUc = await createLayoutTypstUseCase();
    await expect(typstUc.execute(docId, otherId, subject)).rejects.toBeInstanceOf(NotFoundError);
  });

  it('maps worker failure to service unavailable for layout typst', async () => {
    findByIdForUser.mockResolvedValue({ id: docId, userId });
    findLayoutIrForUser.mockResolvedValue(layoutIr);
    const typstUc = await createLayoutTypstUseCase();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 503,
        json: () => Promise.resolve({}),
      })
    );
    await expect(typstUc.execute(docId, userId, subject)).rejects.toBeInstanceOf(
      ServiceUnavailableError
    );
    vi.unstubAllGlobals();
  });

  it('maps worker failure to service unavailable for layout HTML', async () => {
    findByIdForUser.mockResolvedValue({ id: docId, userId });
    findLayoutIrForUser.mockResolvedValue(layoutIr);
    const htmlUc = await createLayoutHtmlUseCase();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 503,
        json: () => Promise.resolve({}),
      })
    );
    await expect(htmlUc.execute(docId, userId, subject)).rejects.toBeInstanceOf(
      ServiceUnavailableError
    );
    vi.unstubAllGlobals();
  });
});
