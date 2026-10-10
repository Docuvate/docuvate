// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { LayoutIrDocument } from '@docuvate/contracts';
import type { AuthSession } from '../../../shared/infrastructure/auth/auth.guard.js';
import { DocumentsController } from './documents.controller.js';
import { UploadDocumentUseCase } from '../application/upload-document.use-case.js';
import { GetDocumentUseCase } from '../application/get-document.use-case.js';
import { ListDocumentsUseCase } from '../application/list-documents.use-case.js';
import { UpdateDocumentUseCase } from '../application/update-document.use-case.js';
import { DeleteDocumentUseCase } from '../application/delete-document.use-case.js';
import { BulkDocumentsUseCase } from '../application/bulk-documents.use-case.js';
import { GetDocumentContentUseCase } from '../application/get-document-content.use-case.js';
import { DocumentChatUseCase } from '../application/document-chat.use-case.js';
import { ListDocumentChatThreadsUseCase } from '../application/list-document-chat-threads.use-case.js';
import { CreateDocumentChatThreadUseCase } from '../application/create-document-chat-thread.use-case.js';
import { ListDocumentChatThreadMessagesUseCase } from '../application/list-document-chat-thread-messages.use-case.js';
import { SendDocumentChatThreadMessageUseCase } from '../application/send-document-chat-thread-message.use-case.js';
import { StreamDocumentChatMessageUseCase } from '../application/stream-document-chat-message.use-case.js';
import { CancelDocumentChatGenerationUseCase } from '../application/cancel-document-chat-generation.use-case.js';
import { RetryDocumentChatMessageUseCase } from '../application/retry-document-chat-message.use-case.js';
import { CompareDocumentExtractionUseCase } from '../application/compare-extraction.use-case.js';
import { ApplyArenaWinnerExtractionUseCase } from '../application/apply-arena-winner-extraction.use-case.js';
import { RequeueDocumentExtractionUseCase } from '../application/requeue-document-extraction.use-case.js';
import { GetDocumentLayoutIrUseCase } from '../application/get-document-layout-ir.use-case.js';
import { GetDocumentLayoutHtmlUseCase } from '../application/get-document-layout-html.use-case.js';
import { GetDocumentLayoutTypstUseCase } from '../application/get-document-layout-typst.use-case.js';
import { GetDocumentLayoutCompareSummaryUseCase } from '../application/get-document-layout-compare-summary.use-case.js';
import { GetDocumentLayoutCompareMetricsUseCase } from '../application/get-document-layout-compare-metrics.use-case.js';
import { GetDocumentLayoutComparePageUseCase } from '../application/get-document-layout-compare-page.use-case.js';
import { RecordExtractionArenaRatingUseCase } from '../../settings/application/settings.use-cases.js';
import {
  ConfirmDuplicateVersionUseCase,
  GetDuplicateStackUseCase,
  ReleaseDuplicateStackMemberUseCase,
  SetDuplicateStackPrimaryUseCase,
} from '../../duplicates/application/duplicate-stack.use-cases.js';
import {
  DismissDuplicateCandidateUseCase,
  ListDuplicateCandidatesUseCase,
} from '../../duplicates/application/duplicate-query.use-cases.js';
import { LoadDocumentLabelSuggestionsUseCase } from '../../labels/application/load-document-labels.use-case.js';
import { RefreshEmbeddingSuggestionsUseCase } from '../../labels/application/refresh-embedding-suggestions.use-case.js';

const layoutIr: LayoutIrDocument = {
  version: 1,
  pages: [{ page: 1, widthPt: 595, heightPt: 842, blocks: [] }],
};

type ExecuteStub = { execute: ReturnType<typeof vi.fn> };

function useCaseStub(): ExecuteStub {
  return { execute: vi.fn() };
}

function asUseCase<T>(stub: ExecuteStub): T {
  return stub as unknown as T;
}

/** Wires layout use cases by constructor position (Vitest does not emit decorator metadata). */
function createDocumentsController(layout: {
  getDocumentLayoutIr: ExecuteStub;
  getDocumentLayoutHtml: ExecuteStub;
  getDocumentLayoutTypst: ExecuteStub;
  getDocumentLayoutCompareSummary: ExecuteStub;
  getDocumentLayoutCompareMetrics: ExecuteStub;
  getDocumentLayoutComparePage: ExecuteStub;
}): DocumentsController {
  const filler = (): ExecuteStub => useCaseStub();
  return new DocumentsController(
    asUseCase<UploadDocumentUseCase>(filler()),
    asUseCase<GetDocumentUseCase>(filler()),
    asUseCase<ListDocumentsUseCase>(filler()),
    asUseCase<UpdateDocumentUseCase>(filler()),
    asUseCase<DeleteDocumentUseCase>(filler()),
    asUseCase<BulkDocumentsUseCase>(filler()),
    asUseCase<GetDocumentContentUseCase>(filler()),
    asUseCase<LoadDocumentLabelSuggestionsUseCase>(filler()),
    asUseCase<RefreshEmbeddingSuggestionsUseCase>(filler()),
    asUseCase<DocumentChatUseCase>(filler()),
    asUseCase<ListDocumentChatThreadsUseCase>(filler()),
    asUseCase<CreateDocumentChatThreadUseCase>(filler()),
    asUseCase<ListDocumentChatThreadMessagesUseCase>(filler()),
    asUseCase<SendDocumentChatThreadMessageUseCase>(filler()),
    asUseCase<StreamDocumentChatMessageUseCase>(filler()),
    asUseCase<CancelDocumentChatGenerationUseCase>(filler()),
    asUseCase<RetryDocumentChatMessageUseCase>(filler()),
    asUseCase<ListDuplicateCandidatesUseCase>(filler()),
    asUseCase<DismissDuplicateCandidateUseCase>(filler()),
    asUseCase<CompareDocumentExtractionUseCase>(filler()),
    asUseCase<ApplyArenaWinnerExtractionUseCase>(filler()),
    asUseCase<RequeueDocumentExtractionUseCase>(filler()),
    asUseCase<GetDocumentLayoutIrUseCase>(layout.getDocumentLayoutIr),
    asUseCase<GetDocumentLayoutHtmlUseCase>(layout.getDocumentLayoutHtml),
    asUseCase<GetDocumentLayoutTypstUseCase>(layout.getDocumentLayoutTypst),
    asUseCase<GetDocumentLayoutCompareSummaryUseCase>(layout.getDocumentLayoutCompareSummary),
    asUseCase<GetDocumentLayoutCompareMetricsUseCase>(layout.getDocumentLayoutCompareMetrics),
    asUseCase<GetDocumentLayoutComparePageUseCase>(layout.getDocumentLayoutComparePage),
    asUseCase<RecordExtractionArenaRatingUseCase>(filler()),
    asUseCase<GetDuplicateStackUseCase>(filler()),
    asUseCase<SetDuplicateStackPrimaryUseCase>(filler()),
    asUseCase<ConfirmDuplicateVersionUseCase>(filler()),
    asUseCase<ReleaseDuplicateStackMemberUseCase>(filler())
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

  const getDocumentLayoutIr = useCaseStub();
  const getDocumentLayoutHtml = useCaseStub();
  const getDocumentLayoutTypst = useCaseStub();
  const getDocumentLayoutCompareSummary = useCaseStub();
  const getDocumentLayoutCompareMetrics = useCaseStub();
  const getDocumentLayoutComparePage = useCaseStub();

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
