// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { LayoutIrDocument } from '@docuvate/contracts';
import type { AuthSession } from '../../../shared/infrastructure/auth/auth.guard.js';
import { DocumentsController } from './documents.controller.js';

const layoutIr: LayoutIrDocument = {
  version: 1,
  pages: [{ page: 1, widthPt: 595, heightPt: 842, blocks: [] }],
};

function useCaseMock() {
  return { execute: vi.fn() };
}

/** Wires layout use cases by constructor position (Vitest does not emit decorator metadata). */
function createDocumentsController(layout: {
  getDocumentLayoutIr: ReturnType<typeof useCaseMock>;
  getDocumentLayoutHtml: ReturnType<typeof useCaseMock>;
  getDocumentLayoutTypst: ReturnType<typeof useCaseMock>;
  getDocumentLayoutCompareSummary: ReturnType<typeof useCaseMock>;
  getDocumentLayoutCompareMetrics: ReturnType<typeof useCaseMock>;
  getDocumentLayoutComparePage: ReturnType<typeof useCaseMock>;
}): DocumentsController {
  const m = (): never => useCaseMock() as never;
  return new DocumentsController(
    m(),
    m(),
    m(),
    m(),
    m(),
    m(),
    m(),
    m(),
    m(),
    m(),
    m(),
    m(),
    m(),
    m(),
    m(),
    m(),
    m(),
    m(),
    m(),
    m(),
    m(),
    m(),
    layout.getDocumentLayoutIr as never,
    layout.getDocumentLayoutHtml as never,
    layout.getDocumentLayoutTypst as never,
    layout.getDocumentLayoutCompareSummary as never,
    layout.getDocumentLayoutCompareMetrics as never,
    layout.getDocumentLayoutComparePage as never,
    m(),
    m(),
    m(),
    m(),
    m()
  );
}

describe('DocumentsController layout routes', () => {
  const session: AuthSession = {
    user: { id: 'user-1', email: 'u@fixture.test', name: 'User' },
    session: { id: 'sess-1', token: 'token' },
  };
  const subject = {
    kind: 'user' as const,
    id: 'user-1',
    tenantId: 'user-1',
    roles: ['owner'],
    claims: ['document:*'],
  };

  const getDocumentLayoutIr = useCaseMock();
  const getDocumentLayoutHtml = useCaseMock();
  const getDocumentLayoutTypst = useCaseMock();
  const getDocumentLayoutCompareSummary = useCaseMock();
  const getDocumentLayoutCompareMetrics = useCaseMock();
  const getDocumentLayoutComparePage = useCaseMock();

  let controller: DocumentsController;

  beforeEach(() => {
    vi.restoreAllMocks();
    getDocumentLayoutIr.execute.mockReset();
    getDocumentLayoutHtml.execute.mockReset();
    getDocumentLayoutTypst.execute.mockReset();
    getDocumentLayoutCompareSummary.execute.mockReset();
    getDocumentLayoutCompareMetrics.execute.mockReset();
    getDocumentLayoutComparePage.execute.mockReset();
    controller = createDocumentsController({
      getDocumentLayoutIr,
      getDocumentLayoutHtml,
      getDocumentLayoutTypst,
      getDocumentLayoutCompareSummary,
      getDocumentLayoutCompareMetrics,
      getDocumentLayoutComparePage,
    });
  });

  it('returns layout IR from the use case', async () => {
    getDocumentLayoutIr.execute.mockResolvedValue(layoutIr);
    await expect(controller.layoutIr(session, subject, 'doc-1')).resolves.toEqual(layoutIr);
    expect(getDocumentLayoutIr.execute).toHaveBeenCalledWith('doc-1', 'user-1', subject);
  });

  it('returns layout HTML envelope', async () => {
    getDocumentLayoutHtml.execute.mockResolvedValue({
      html: '<html></html>',
      reconstructionReliable: true,
      unreliableReason: null,
    });
    await expect(controller.layoutHtml(session, subject, 'doc-1')).resolves.toEqual({
      html: '<html></html>',
      reconstructionReliable: true,
      unreliableReason: null,
    });
  });

  it('returns layout Typst envelope', async () => {
    getDocumentLayoutTypst.execute.mockResolvedValue({
      typst: '#set page(margin: 0pt)',
      exportMode: 'semantisch',
      reconstructionReliable: false,
      unreliableReason: 'unsupported_script',
    });
    await expect(controller.layoutTypst(session, subject, 'doc-1', 'semantisch')).resolves.toEqual({
      typst: '#set page(margin: 0pt)',
      exportMode: 'semantisch',
      reconstructionReliable: false,
      unreliableReason: 'unsupported_script',
    });
  });

  it('returns layout compare metrics envelope', async () => {
    getDocumentLayoutCompareMetrics.execute.mockResolvedValue({
      category: 'born_digital_standard',
      ssimFloor: 0.97,
      pageCount: 1,
      pages: [
        {
          pageNumber: 1,
          ssim: 0.99,
          inkDeviation: 0.01,
          pageReliable: true,
          errorCode: null,
        },
      ],
    });
    await expect(controller.layoutCompareMetrics(session, subject, 'doc-1')).resolves.toEqual({
      category: 'born_digital_standard',
      ssimFloor: 0.97,
      pageCount: 1,
      pages: [
        {
          pageNumber: 1,
          ssim: 0.99,
          inkDeviation: 0.01,
          pageReliable: true,
          errorCode: null,
        },
      ],
    });
  });
});
