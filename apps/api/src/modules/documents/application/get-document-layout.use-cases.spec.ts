// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { randomUUID } from 'node:crypto';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { LayoutIrDocument } from '@docuvate/contracts';
import {
  ForbiddenError,
  NotFoundError,
  ServiceUnavailableError,
} from '../../../shared/domain/errors.js';
import { GetDocumentLayoutTypstUseCase } from './get-document-layout-typst.use-case.js';
import { GetDocumentLayoutIrUseCase } from './get-document-layout-ir.use-case.js';
import { GetDocumentLayoutHtmlUseCase } from './get-document-layout-html.use-case.js';
import { DocumentAuthorizationService } from '../../../shared/application/document-authorization.service.js';

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

  const documents = {
    findByIdForUser: vi.fn(),
    findLayoutIrForUser: vi.fn(),
  };
  const documentAuthz = {
    assert: vi.fn(),
  } as unknown as DocumentAuthorizationService;
  const getDocumentContent = {
    execute: vi.fn().mockResolvedValue({
      buffer: Buffer.from('%PDF-1.4'),
      mimeType: 'application/pdf',
      filename: 'doc.pdf',
    }),
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    documents.findByIdForUser.mockReset();
    documents.findLayoutIrForUser.mockReset();
    getDocumentContent.execute.mockReset();
    getDocumentContent.execute.mockResolvedValue({
      buffer: Buffer.from('%PDF-1.4'),
      mimeType: 'application/pdf',
      filename: 'doc.pdf',
    });
    vi.spyOn(documentAuthz, 'assert').mockResolvedValue(undefined);
  });

  it('returns layout IR for owner', async () => {
    documents.findByIdForUser.mockResolvedValue({ id: docId, userId });
    documents.findLayoutIrForUser.mockResolvedValue(layoutIr);
    const uc = new GetDocumentLayoutIrUseCase(documents as never, documentAuthz);
    await expect(uc.execute(docId, userId, subject)).resolves.toEqual(layoutIr);
  });

  it('404 when another user requests layout IR', async () => {
    documents.findByIdForUser.mockResolvedValue(null);
    const uc = new GetDocumentLayoutIrUseCase(documents as never, documentAuthz);
    await expect(uc.execute(docId, otherId, subject)).rejects.toBeInstanceOf(NotFoundError);
  });

  it('404 when IR row missing', async () => {
    documents.findByIdForUser.mockResolvedValue({ id: docId, userId });
    documents.findLayoutIrForUser.mockResolvedValue(null);
    const uc = new GetDocumentLayoutIrUseCase(documents as never, documentAuthz);
    await expect(uc.execute(docId, userId, subject)).rejects.toBeInstanceOf(NotFoundError);
  });

  it('propagates ABAC denial for layout IR', async () => {
    documents.findByIdForUser.mockResolvedValue({ id: docId, userId });
    vi.spyOn(documentAuthz, 'assert').mockRejectedValue(new ForbiddenError());
    const uc = new GetDocumentLayoutIrUseCase(documents as never, documentAuthz);
    await expect(uc.execute(docId, userId, subject)).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('returns typst for owner', async () => {
    documents.findByIdForUser.mockResolvedValue({ id: docId, userId });
    documents.findLayoutIrForUser.mockResolvedValue(layoutIr);
    const getLayoutIr = new GetDocumentLayoutIrUseCase(documents as never, documentAuthz);
    const typstUc = new GetDocumentLayoutTypstUseCase(getLayoutIr, getDocumentContent as never);
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          typst: '#set page(margin: 0pt)',
          reconstructionReliable: true,
        }),
      })
    );
    const result = await typstUc.execute(docId, userId, subject);
    expect(result.typst).toContain('page');
    expect(result.reconstructionReliable).toBe(true);
    vi.unstubAllGlobals();
  });

  it('404 when another user requests layout typst', async () => {
    documents.findByIdForUser.mockResolvedValue(null);
    const getLayoutIr = new GetDocumentLayoutIrUseCase(documents as never, documentAuthz);
    const typstUc = new GetDocumentLayoutTypstUseCase(getLayoutIr, getDocumentContent as never);
    await expect(typstUc.execute(docId, otherId, subject)).rejects.toBeInstanceOf(NotFoundError);
  });

  it('maps worker failure to service unavailable for layout typst', async () => {
    documents.findByIdForUser.mockResolvedValue({ id: docId, userId });
    documents.findLayoutIrForUser.mockResolvedValue(layoutIr);
    const getLayoutIr = new GetDocumentLayoutIrUseCase(documents as never, documentAuthz);
    const typstUc = new GetDocumentLayoutTypstUseCase(getLayoutIr, getDocumentContent as never);
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 503, json: async () => ({}) })
    );
    await expect(typstUc.execute(docId, userId, subject)).rejects.toBeInstanceOf(
      ServiceUnavailableError
    );
    vi.unstubAllGlobals();
  });

  it('maps worker failure to service unavailable for layout HTML', async () => {
    documents.findByIdForUser.mockResolvedValue({ id: docId, userId });
    documents.findLayoutIrForUser.mockResolvedValue(layoutIr);
    const getLayoutIr = new GetDocumentLayoutIrUseCase(documents as never, documentAuthz);
    const htmlUc = new GetDocumentLayoutHtmlUseCase(getLayoutIr, getDocumentContent as never);
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 503, json: async () => ({}) })
    );
    await expect(htmlUc.execute(docId, userId, subject)).rejects.toBeInstanceOf(
      ServiceUnavailableError
    );
    vi.unstubAllGlobals();
  });
});
