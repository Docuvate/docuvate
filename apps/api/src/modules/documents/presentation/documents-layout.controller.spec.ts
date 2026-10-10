// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { LayoutIrDocument } from '@docuvate/contracts';
import { Test } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { AuthSession } from '../../../shared/infrastructure/auth/auth.guard.js';
import {
  DismissDuplicateCandidateUseCase,
  ListDuplicateCandidatesUseCase,
} from '../../duplicates/application/duplicate-query.use-cases.js';
import {
  ConfirmDuplicateVersionUseCase,
  GetDuplicateStackUseCase,
  ReleaseDuplicateStackMemberUseCase,
  SetDuplicateStackPrimaryUseCase,
} from '../../duplicates/application/duplicate-stack.use-cases.js';
import { LoadDocumentLabelSuggestionsUseCase } from '../../labels/application/load-document-labels.use-case.js';
import { RefreshEmbeddingSuggestionsUseCase } from '../../labels/application/refresh-embedding-suggestions.use-case.js';
import { RecordExtractionArenaRatingUseCase } from '../../settings/application/settings.use-cases.js';
import { ApplyArenaWinnerExtractionUseCase } from '../application/apply-arena-winner-extraction.use-case.js';
import { BulkDocumentsUseCase } from '../application/bulk-documents.use-case.js';
import { CancelDocumentChatGenerationUseCase } from '../application/cancel-document-chat-generation.use-case.js';
import { CompareDocumentExtractionUseCase } from '../application/compare-extraction.use-case.js';
import { CreateDocumentChatThreadUseCase } from '../application/create-document-chat-thread.use-case.js';
import { DeleteDocumentUseCase } from '../application/delete-document.use-case.js';
import { DocumentChatUseCase } from '../application/document-chat.use-case.js';
import { GetDocumentUseCase } from '../application/get-document.use-case.js';
import { GetDocumentContentUseCase } from '../application/get-document-content.use-case.js';
import { GetDocumentLayoutCompareMetricsUseCase } from '../application/get-document-layout-compare-metrics.use-case.js';
import { GetDocumentLayoutComparePageUseCase } from '../application/get-document-layout-compare-page.use-case.js';
import { GetDocumentLayoutCompareSummaryUseCase } from '../application/get-document-layout-compare-summary.use-case.js';
import { GetDocumentLayoutHtmlUseCase } from '../application/get-document-layout-html.use-case.js';
import { GetDocumentLayoutIrUseCase } from '../application/get-document-layout-ir.use-case.js';
import { GetDocumentLayoutTypstUseCase } from '../application/get-document-layout-typst.use-case.js';
import { ListDocumentChatThreadMessagesUseCase } from '../application/list-document-chat-thread-messages.use-case.js';
import { ListDocumentChatThreadsUseCase } from '../application/list-document-chat-threads.use-case.js';
import { ListDocumentsUseCase } from '../application/list-documents.use-case.js';
import { RequeueDocumentExtractionUseCase } from '../application/requeue-document-extraction.use-case.js';
import { RetryDocumentChatMessageUseCase } from '../application/retry-document-chat-message.use-case.js';
import { SendDocumentChatThreadMessageUseCase } from '../application/send-document-chat-thread-message.use-case.js';
import { StreamDocumentChatMessageUseCase } from '../application/stream-document-chat-message.use-case.js';
import { UpdateDocumentUseCase } from '../application/update-document.use-case.js';
import { UploadDocumentUseCase } from '../application/upload-document.use-case.js';
import { DocumentsController } from './documents.controller.js';

const layoutIr: LayoutIrDocument = {
  version: 1,
  pages: [{ page: 1, widthPt: 595, heightPt: 842, blocks: [] }],
};

interface ExecuteUseCaseFake {
  execute: ReturnType<typeof vi.fn>;
}

function useCaseExecuteMock(): ExecuteUseCaseFake {
  return { execute: vi.fn() };
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

  const getDocumentLayoutIr = useCaseExecuteMock();
  const getDocumentLayoutHtml = useCaseExecuteMock();
  const getDocumentLayoutTypst = useCaseExecuteMock();
  const getDocumentLayoutCompareSummary = useCaseExecuteMock();
  const getDocumentLayoutCompareMetrics = useCaseExecuteMock();
  const getDocumentLayoutComparePage = useCaseExecuteMock();

  let controller: DocumentsController;

  beforeEach(async () => {
    vi.restoreAllMocks();
    getDocumentLayoutIr.execute.mockReset();
    getDocumentLayoutHtml.execute.mockReset();
    getDocumentLayoutTypst.execute.mockReset();
    getDocumentLayoutCompareSummary.execute.mockReset();
    getDocumentLayoutCompareMetrics.execute.mockReset();
    getDocumentLayoutComparePage.execute.mockReset();

    const moduleRef = await Test.createTestingModule({
      providers: [
        {
          provide: DocumentsController,
          useFactory: (
            uploadDocument: UploadDocumentUseCase,
            getDocument: GetDocumentUseCase,
            listDocuments: ListDocumentsUseCase,
            updateDocument: UpdateDocumentUseCase,
            deleteDocument: DeleteDocumentUseCase,
            bulkDocuments: BulkDocumentsUseCase,
            getDocumentContent: GetDocumentContentUseCase,
            loadSuggestions: LoadDocumentLabelSuggestionsUseCase,
            refreshEmbeddings: RefreshEmbeddingSuggestionsUseCase,
            documentChat: DocumentChatUseCase,
            listDocumentChatThreads: ListDocumentChatThreadsUseCase,
            createDocumentChatThread: CreateDocumentChatThreadUseCase,
            listDocumentChatThreadMessages: ListDocumentChatThreadMessagesUseCase,
            sendDocumentChatThreadMessage: SendDocumentChatThreadMessageUseCase,
            streamDocumentChatMessage: StreamDocumentChatMessageUseCase,
            cancelDocumentChatGeneration: CancelDocumentChatGenerationUseCase,
            retryDocumentChatMessage: RetryDocumentChatMessageUseCase,
            listDuplicateCandidates: ListDuplicateCandidatesUseCase,
            dismissDuplicateCandidate: DismissDuplicateCandidateUseCase,
            compareExtraction: CompareDocumentExtractionUseCase,
            applyArenaWinner: ApplyArenaWinnerExtractionUseCase,
            requeueExtraction: RequeueDocumentExtractionUseCase,
            getDocumentLayoutIrUseCase: GetDocumentLayoutIrUseCase,
            getDocumentLayoutHtmlUseCase: GetDocumentLayoutHtmlUseCase,
            getDocumentLayoutTypstUseCase: GetDocumentLayoutTypstUseCase,
            getDocumentLayoutCompareSummaryUseCase: GetDocumentLayoutCompareSummaryUseCase,
            getDocumentLayoutCompareMetricsUseCase: GetDocumentLayoutCompareMetricsUseCase,
            getDocumentLayoutComparePageUseCase: GetDocumentLayoutComparePageUseCase,
            recordArenaRating: RecordExtractionArenaRatingUseCase,
            getDuplicateStack: GetDuplicateStackUseCase,
            setDuplicateStackPrimary: SetDuplicateStackPrimaryUseCase,
            confirmDuplicateVersion: ConfirmDuplicateVersionUseCase,
            releaseDuplicateStackMember: ReleaseDuplicateStackMemberUseCase
          ) =>
            new DocumentsController(
              uploadDocument,
              getDocument,
              listDocuments,
              updateDocument,
              deleteDocument,
              bulkDocuments,
              getDocumentContent,
              loadSuggestions,
              refreshEmbeddings,
              documentChat,
              listDocumentChatThreads,
              createDocumentChatThread,
              listDocumentChatThreadMessages,
              sendDocumentChatThreadMessage,
              streamDocumentChatMessage,
              cancelDocumentChatGeneration,
              retryDocumentChatMessage,
              listDuplicateCandidates,
              dismissDuplicateCandidate,
              compareExtraction,
              applyArenaWinner,
              requeueExtraction,
              getDocumentLayoutIrUseCase,
              getDocumentLayoutHtmlUseCase,
              getDocumentLayoutTypstUseCase,
              getDocumentLayoutCompareSummaryUseCase,
              getDocumentLayoutCompareMetricsUseCase,
              getDocumentLayoutComparePageUseCase,
              recordArenaRating,
              getDuplicateStack,
              setDuplicateStackPrimary,
              confirmDuplicateVersion,
              releaseDuplicateStackMember
            ),
          inject: [
            UploadDocumentUseCase,
            GetDocumentUseCase,
            ListDocumentsUseCase,
            UpdateDocumentUseCase,
            DeleteDocumentUseCase,
            BulkDocumentsUseCase,
            GetDocumentContentUseCase,
            LoadDocumentLabelSuggestionsUseCase,
            RefreshEmbeddingSuggestionsUseCase,
            DocumentChatUseCase,
            ListDocumentChatThreadsUseCase,
            CreateDocumentChatThreadUseCase,
            ListDocumentChatThreadMessagesUseCase,
            SendDocumentChatThreadMessageUseCase,
            StreamDocumentChatMessageUseCase,
            CancelDocumentChatGenerationUseCase,
            RetryDocumentChatMessageUseCase,
            ListDuplicateCandidatesUseCase,
            DismissDuplicateCandidateUseCase,
            CompareDocumentExtractionUseCase,
            ApplyArenaWinnerExtractionUseCase,
            RequeueDocumentExtractionUseCase,
            GetDocumentLayoutIrUseCase,
            GetDocumentLayoutHtmlUseCase,
            GetDocumentLayoutTypstUseCase,
            GetDocumentLayoutCompareSummaryUseCase,
            GetDocumentLayoutCompareMetricsUseCase,
            GetDocumentLayoutComparePageUseCase,
            RecordExtractionArenaRatingUseCase,
            GetDuplicateStackUseCase,
            SetDuplicateStackPrimaryUseCase,
            ConfirmDuplicateVersionUseCase,
            ReleaseDuplicateStackMemberUseCase,
          ],
        },
        { provide: UploadDocumentUseCase, useValue: useCaseExecuteMock() },
        { provide: GetDocumentUseCase, useValue: useCaseExecuteMock() },
        { provide: ListDocumentsUseCase, useValue: useCaseExecuteMock() },
        { provide: UpdateDocumentUseCase, useValue: useCaseExecuteMock() },
        { provide: DeleteDocumentUseCase, useValue: useCaseExecuteMock() },
        { provide: BulkDocumentsUseCase, useValue: useCaseExecuteMock() },
        { provide: GetDocumentContentUseCase, useValue: useCaseExecuteMock() },
        { provide: LoadDocumentLabelSuggestionsUseCase, useValue: useCaseExecuteMock() },
        { provide: RefreshEmbeddingSuggestionsUseCase, useValue: useCaseExecuteMock() },
        { provide: DocumentChatUseCase, useValue: useCaseExecuteMock() },
        { provide: ListDocumentChatThreadsUseCase, useValue: useCaseExecuteMock() },
        { provide: CreateDocumentChatThreadUseCase, useValue: useCaseExecuteMock() },
        { provide: ListDocumentChatThreadMessagesUseCase, useValue: useCaseExecuteMock() },
        { provide: SendDocumentChatThreadMessageUseCase, useValue: useCaseExecuteMock() },
        { provide: StreamDocumentChatMessageUseCase, useValue: useCaseExecuteMock() },
        { provide: CancelDocumentChatGenerationUseCase, useValue: useCaseExecuteMock() },
        { provide: RetryDocumentChatMessageUseCase, useValue: useCaseExecuteMock() },
        { provide: ListDuplicateCandidatesUseCase, useValue: useCaseExecuteMock() },
        { provide: DismissDuplicateCandidateUseCase, useValue: useCaseExecuteMock() },
        { provide: CompareDocumentExtractionUseCase, useValue: useCaseExecuteMock() },
        { provide: ApplyArenaWinnerExtractionUseCase, useValue: useCaseExecuteMock() },
        { provide: RequeueDocumentExtractionUseCase, useValue: useCaseExecuteMock() },
        { provide: GetDocumentLayoutIrUseCase, useValue: getDocumentLayoutIr },
        { provide: GetDocumentLayoutHtmlUseCase, useValue: getDocumentLayoutHtml },
        { provide: GetDocumentLayoutTypstUseCase, useValue: getDocumentLayoutTypst },
        { provide: GetDocumentLayoutCompareSummaryUseCase, useValue: getDocumentLayoutCompareSummary },
        { provide: GetDocumentLayoutCompareMetricsUseCase, useValue: getDocumentLayoutCompareMetrics },
        { provide: GetDocumentLayoutComparePageUseCase, useValue: getDocumentLayoutComparePage },
        { provide: RecordExtractionArenaRatingUseCase, useValue: useCaseExecuteMock() },
        { provide: GetDuplicateStackUseCase, useValue: useCaseExecuteMock() },
        { provide: SetDuplicateStackPrimaryUseCase, useValue: useCaseExecuteMock() },
        { provide: ConfirmDuplicateVersionUseCase, useValue: useCaseExecuteMock() },
        { provide: ReleaseDuplicateStackMemberUseCase, useValue: useCaseExecuteMock() },
      ],
    }).compile();

    controller = moduleRef.get(DocumentsController);
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
