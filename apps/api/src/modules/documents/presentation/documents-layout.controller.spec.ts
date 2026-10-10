// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { LayoutIrDocument } from '@docuvate/contracts';
import type { AuthSession } from '../../../shared/infrastructure/auth/auth.guard.js';
import { DocumentsController } from './documents.controller.js';
import type { GetDocumentLayoutCompareMetricsUseCase } from '../application/get-document-layout-compare-metrics.use-case.js';
import type { GetDocumentLayoutComparePageUseCase } from '../application/get-document-layout-compare-page.use-case.js';
import type { GetDocumentLayoutCompareSummaryUseCase } from '../application/get-document-layout-compare-summary.use-case.js';
import type { GetDocumentLayoutHtmlUseCase } from '../application/get-document-layout-html.use-case.js';
import type { GetDocumentLayoutIrUseCase } from '../application/get-document-layout-ir.use-case.js';
import type { GetDocumentLayoutTypstUseCase } from '../application/get-document-layout-typst.use-case.js';

const layoutIr: LayoutIrDocument = {
  version: 1,
  pages: [{ page: 1, widthPt: 595, heightPt: 842, blocks: [] }],
};

type LayoutUseCaseFake = Pick<GetDocumentLayoutIrUseCase, 'execute'>;

type ExecuteUseCaseFake = { execute: ReturnType<typeof vi.fn> };

function useCaseFake(): ExecuteUseCaseFake {
  return { execute: vi.fn() };
}

/** Wires layout use cases by constructor position (Vitest does not emit decorator metadata). */
function createDocumentsController(layout: {
  getDocumentLayoutIr: LayoutUseCaseFake;
  getDocumentLayoutHtml: Pick<GetDocumentLayoutHtmlUseCase, 'execute'>;
  getDocumentLayoutTypst: Pick<GetDocumentLayoutTypstUseCase, 'execute'>;
  getDocumentLayoutCompareSummary: Pick<GetDocumentLayoutCompareSummaryUseCase, 'execute'>;
  getDocumentLayoutCompareMetrics: Pick<GetDocumentLayoutCompareMetricsUseCase, 'execute'>;
  getDocumentLayoutComparePage: Pick<GetDocumentLayoutComparePageUseCase, 'execute'>;
}): DocumentsController {
  const filler = (): ExecuteUseCaseFake => useCaseFake();
  return new DocumentsController(
    filler() as never,
    filler() as never,
    filler() as never,
    filler() as never,
    filler() as never,
    filler() as never,
    filler() as never,
    filler() as never,
    filler() as never,
    filler() as never,
    filler() as never,
    filler() as never,
    filler() as never,
    filler() as never,
    filler() as never,
    filler() as never,
    filler() as never,
    filler() as never,
    filler() as never,
    filler() as never,
    filler() as never,
    filler() as never,
    layout.getDocumentLayoutIr as never,
    layout.getDocumentLayoutHtml as never,
    layout.getDocumentLayoutTypst as never,
    layout.getDocumentLayoutCompareSummary as never,
    layout.getDocumentLayoutCompareMetrics as never,
    layout.getDocumentLayoutComparePage as never,
    filler() as never,
    filler() as never,
    filler() as never,
    filler() as never,
    filler() as never
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

  const getDocumentLayoutIr = useCaseFake();
  const getDocumentLayoutHtml = useCaseFake();
  const getDocumentLayoutTypst = useCaseFake();
  const getDocumentLayoutCompareSummary = useCaseFake();
  const getDocumentLayoutCompareMetrics = useCaseFake();
  const getDocumentLayoutComparePage = useCaseFake();

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
