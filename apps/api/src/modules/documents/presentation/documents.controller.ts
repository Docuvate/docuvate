// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { ExtractionCompareResponse, LayoutIrDocument } from '@docuvate/contracts';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiBody, ApiConsumes, ApiOkResponse } from '@nestjs/swagger';
import type { FastifyReply, FastifyRequest } from 'fastify';

import type { AuthorizationSubject } from '../../../shared/domain/authorization.js';
import {
  AuthGuard,
  type AuthSession,
  AuthSubject,
  Session,
} from '../../../shared/infrastructure/auth/auth.guard.js';
import {
  CreateDocumentChatThreadRequestDto,
  DocumentBulkRequestDto,
  DocumentChatRequestDto,
  DocumentChatResponseDto,
  DocumentChatThreadListResponseDto,
  DocumentChatThreadMessagesResponseDto,
  DuplicateStackKeepVersionRequestDto,
  DuplicateStackNotDuplicateRequestDto,
  DuplicateStackSetPrimaryRequestDto,
  ExtractionArenaRatingRequestDto,
  ExtractionCompareRequestDto,
  OkResponseDto,
  SendDocumentChatThreadMessageRequestDto,
  SendDocumentChatThreadMessageResponseDto,
} from '../../../shared/presentation/dtos/common.dto.js';
import {
  DocumentListQueryDto,
  DocumentListResponseDto,
  DocumentResponseDto,
  UpdateDocumentRequestDto,
} from '../../../shared/presentation/dtos/documents.dto.js';
import {
  LayoutCompareMetricsResponseDto,
  LayoutComparePageResponseDto,
  LayoutCompareSummaryResponseDto,
  LayoutHtmlResponseDto,
  LayoutIrDocumentDto,
  LayoutTypstResponseDto,
} from '../../../shared/presentation/dtos/layout-ir.dto.js';
import {
  ApiDocuvateController,
  ApiDocuvateRoute,
} from '../../../shared/presentation/swagger/openapi-decorators.js';
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
import { toDocumentBulkRequest, toDocumentDto, toDocumentListResponse } from './document.mapper.js';
import { toDocumentChatMessageRecordDto, toDocumentChatThreadDto } from './document-chat.mapper.js';
import { parseDocumentListQuery } from './document-list-query.js';

@ApiDocuvateController('documents')
@Controller('documents')
@UseGuards(AuthGuard)
export class DocumentsController {
  constructor(
    private readonly uploadDocument: UploadDocumentUseCase,
    private readonly getDocument: GetDocumentUseCase,
    private readonly listDocuments: ListDocumentsUseCase,
    private readonly updateDocument: UpdateDocumentUseCase,
    private readonly deleteDocument: DeleteDocumentUseCase,
    private readonly bulkDocuments: BulkDocumentsUseCase,
    private readonly getDocumentContent: GetDocumentContentUseCase,
    private readonly loadSuggestions: LoadDocumentLabelSuggestionsUseCase,
    private readonly refreshEmbeddings: RefreshEmbeddingSuggestionsUseCase,
    private readonly documentChat: DocumentChatUseCase,
    private readonly listDocumentChatThreads: ListDocumentChatThreadsUseCase,
    private readonly createDocumentChatThread: CreateDocumentChatThreadUseCase,
    private readonly listDocumentChatThreadMessages: ListDocumentChatThreadMessagesUseCase,
    private readonly sendDocumentChatThreadMessage: SendDocumentChatThreadMessageUseCase,
    private readonly streamDocumentChatMessage: StreamDocumentChatMessageUseCase,
    private readonly cancelDocumentChatGeneration: CancelDocumentChatGenerationUseCase,
    private readonly retryDocumentChatMessage: RetryDocumentChatMessageUseCase,
    private readonly listDuplicateCandidates: ListDuplicateCandidatesUseCase,
    private readonly dismissDuplicateCandidate: DismissDuplicateCandidateUseCase,
    private readonly compareExtraction: CompareDocumentExtractionUseCase,
    private readonly applyArenaWinner: ApplyArenaWinnerExtractionUseCase,
    private readonly requeueExtraction: RequeueDocumentExtractionUseCase,
    private readonly getDocumentLayoutIr: GetDocumentLayoutIrUseCase,
    private readonly getDocumentLayoutHtml: GetDocumentLayoutHtmlUseCase,
    private readonly getDocumentLayoutTypst: GetDocumentLayoutTypstUseCase,
    private readonly getDocumentLayoutCompareSummary: GetDocumentLayoutCompareSummaryUseCase,
    private readonly getDocumentLayoutCompareMetrics: GetDocumentLayoutCompareMetricsUseCase,
    private readonly getDocumentLayoutComparePage: GetDocumentLayoutComparePageUseCase,
    private readonly recordArenaRating: RecordExtractionArenaRatingUseCase,
    private readonly getDuplicateStack: GetDuplicateStackUseCase,
    private readonly setDuplicateStackPrimary: SetDuplicateStackPrimaryUseCase,
    private readonly confirmDuplicateVersion: ConfirmDuplicateVersionUseCase,
    private readonly releaseDuplicateStackMember: ReleaseDuplicateStackMemberUseCase
  ) {}

  @Get()
  @ApiDocuvateRoute({
    operationId: 'listDocuments',
    summary: 'List or search documents (ABAC filtered)',
  })
  async list(
    @Session() session: AuthSession,
    @AuthSubject() subject: AuthorizationSubject,
    @Query() query: DocumentListQueryDto
  ): Promise<DocumentListResponseDto> {
    const filters = parseDocumentListQuery(query);
    const docs = await this.listDocuments.execute(session.user.id, subject, filters);
    return toDocumentListResponse(docs);
  }

  @Post('bulk')
  @ApiDocuvateRoute({ operationId: 'bulk', summary: 'bulk' })
  async bulk(@Session() session: AuthSession, @Body() body: DocumentBulkRequestDto) {
    return this.bulkDocuments.execute(session.user.id, toDocumentBulkRequest(body));
  }

  @Get(':id/layout-ir')
  @ApiDocuvateRoute({
    operationId: 'getDocumentLayoutIr',
    summary: 'Layout IR for document re-render',
  })
  @ApiOkResponse({ type: LayoutIrDocumentDto })
  async layoutIr(
    @Session() session: AuthSession,
    @AuthSubject() subject: AuthorizationSubject,
    @Param('id') id: string
  ): Promise<LayoutIrDocumentDto & LayoutIrDocument> {
    return this.getDocumentLayoutIr.execute(id, session.user.id, subject);
  }

  @Get(':id/layout-html')
  @ApiDocuvateRoute({ operationId: 'getDocumentLayoutHtml', summary: 'Rendered layout HTML' })
  @ApiOkResponse({ type: LayoutHtmlResponseDto })
  async layoutHtml(
    @Session() session: AuthSession,
    @AuthSubject() subject: AuthorizationSubject,
    @Param('id') id: string
  ): Promise<LayoutHtmlResponseDto> {
    const result = await this.getDocumentLayoutHtml.execute(id, session.user.id, subject);
    return {
      html: result.html,
      reconstructionReliable: result.reconstructionReliable,
      unreliableReason: result.unreliableReason,
    };
  }

  @Get(':id/layout-typst')
  @ApiDocuvateRoute({
    operationId: 'getDocumentLayoutTypst',
    summary: 'Typst source for layout export',
  })
  @ApiOkResponse({ type: LayoutTypstResponseDto })
  async layoutTypst(
    @Session() session: AuthSession,
    @AuthSubject() subject: AuthorizationSubject,
    @Param('id') id: string,
    @Query('mode') mode: 'exakt' | 'semantisch' | undefined
  ): Promise<LayoutTypstResponseDto> {
    const exportMode = mode === 'semantisch' ? 'semantisch' : 'exakt';
    const result = await this.getDocumentLayoutTypst.execute(
      id,
      session.user.id,
      subject,
      exportMode
    );
    return {
      typst: result.typst,
      exportMode: result.exportMode,
      reconstructionReliable: result.reconstructionReliable,
      unreliableReason: result.unreliableReason,
    };
  }

  @Get(':id/layout-compare/summary')
  @ApiDocuvateRoute({
    operationId: 'getDocumentLayoutCompareSummary',
    summary: 'SSIM category and page count for layout reconstruction compare',
  })
  @ApiOkResponse({ type: LayoutCompareSummaryResponseDto })
  async layoutCompareSummary(
    @Session() session: AuthSession,
    @AuthSubject() subject: AuthorizationSubject,
    @Param('id') id: string
  ): Promise<LayoutCompareSummaryResponseDto> {
    return this.getDocumentLayoutCompareSummary.execute(id, session.user.id, subject);
  }

  @Get(':id/layout-compare/metrics')
  @ApiDocuvateRoute({
    operationId: 'getDocumentLayoutCompareMetrics',
    summary: 'Per-page SSIM metrics for layout reconstruction compare',
  })
  @ApiOkResponse({ type: LayoutCompareMetricsResponseDto })
  async layoutCompareMetrics(
    @Session() session: AuthSession,
    @AuthSubject() subject: AuthorizationSubject,
    @Param('id') id: string,
    @Query('from') from?: string,
    @Query('to') to?: string
  ): Promise<LayoutCompareMetricsResponseDto> {
    const fromPage = from !== undefined ? Number.parseInt(from, 10) : undefined;
    const toPage = to !== undefined ? Number.parseInt(to, 10) : undefined;
    return this.getDocumentLayoutCompareMetrics.execute(
      id,
      session.user.id,
      subject,
      fromPage,
      toPage
    );
  }

  @Get(':id/layout-compare/pages/:page')
  @ApiDocuvateRoute({
    operationId: 'getDocumentLayoutComparePage',
    summary: 'Raster compare payload for one layout reconstruction page',
  })
  @ApiOkResponse({ type: LayoutComparePageResponseDto })
  async layoutComparePage(
    @Session() session: AuthSession,
    @AuthSubject() subject: AuthorizationSubject,
    @Param('id') id: string,
    @Param('page') page: string,
    @Query('heatmap') heatmap?: string
  ): Promise<LayoutComparePageResponseDto> {
    const pageNumber = Number.parseInt(page, 10);
    const includeHeatmap = heatmap !== '0' && heatmap !== 'false';
    return this.getDocumentLayoutComparePage.execute(
      id,
      session.user.id,
      subject,
      pageNumber,
      includeHeatmap
    );
  }

  @Get(':id/content')
  @ApiDocuvateRoute({ operationId: 'content', summary: 'content' })
  async content(
    @Session() session: AuthSession,
    @AuthSubject() subject: AuthorizationSubject,
    @Param('id') id: string,
    @Query('download') download: string | undefined,
    @Res({ passthrough: false }) reply: FastifyReply
  ) {
    const { buffer, mimeType, filename } = await this.getDocumentContent.execute(
      id,
      session.user.id,
      subject
    );
    const disposition = download === '1' || download === 'true' ? 'attachment' : 'inline';
    void reply
      .header('Content-Type', mimeType)
      .header('Content-Disposition', `${disposition}; filename="${encodeURIComponent(filename)}"`)
      .send(buffer);
  }

  @Post(':id/tag-suggestions/refresh')
  @ApiDocuvateRoute({ operationId: 'refreshSuggestions', summary: 'refreshSuggestions' })
  async refreshSuggestions(
    @Session() session: AuthSession,
    @AuthSubject() subject: AuthorizationSubject,
    @Param('id') id: string
  ) {
    await this.refreshEmbeddings.execute(id, session.user.id);
    const doc = await this.getDocument.execute(id, session.user.id, subject);
    const suggestions = await this.loadSuggestions.execute(id, session.user.id);
    return toDocumentDto(doc, suggestions);
  }

  @Get(':id/chat/threads')
  @ApiDocuvateRoute({ operationId: 'listChatThreads', summary: 'listChatThreads' })
  async listChatThreads(
    @Session() session: AuthSession,
    @AuthSubject() subject: AuthorizationSubject,
    @Param('id') id: string
  ): Promise<DocumentChatThreadListResponseDto> {
    const threads = await this.listDocumentChatThreads.execute(id, session.user.id, subject);
    return { threads: threads.map(toDocumentChatThreadDto) };
  }

  @Post(':id/chat/threads')
  @ApiDocuvateRoute({ operationId: 'createChatThread', summary: 'createChatThread' })
  async createChatThread(
    @Session() session: AuthSession,
    @AuthSubject() subject: AuthorizationSubject,
    @Param('id') id: string,
    @Body() body: CreateDocumentChatThreadRequestDto
  ) {
    const thread = await this.createDocumentChatThread.execute(
      id,
      session.user.id,
      subject,
      body.title
    );
    return { thread: toDocumentChatThreadDto(thread) };
  }

  @Get(':id/chat/threads/:threadId/messages')
  @ApiDocuvateRoute({ operationId: 'listChatThreadMessages', summary: 'listChatThreadMessages' })
  async listChatThreadMessages(
    @Session() session: AuthSession,
    @AuthSubject() subject: AuthorizationSubject,
    @Param('id') id: string,
    @Param('threadId') threadId: string
  ): Promise<DocumentChatThreadMessagesResponseDto> {
    const messages = await this.listDocumentChatThreadMessages.execute(
      id,
      threadId,
      session.user.id,
      subject
    );
    return { messages: messages.map(toDocumentChatMessageRecordDto) };
  }

  @Post(':id/chat/threads/:threadId/messages')
  @ApiDocuvateRoute({ operationId: 'sendChatThreadMessage', summary: 'sendChatThreadMessage' })
  async sendChatThreadMessage(
    @Session() session: AuthSession,
    @AuthSubject() subject: AuthorizationSubject,
    @Param('id') id: string,
    @Param('threadId') threadId: string,
    @Body() body: SendDocumentChatThreadMessageRequestDto
  ): Promise<SendDocumentChatThreadMessageResponseDto> {
    const result = await this.sendDocumentChatThreadMessage.execute(
      id,
      threadId,
      session.user.id,
      subject,
      body.message
    );
    return {
      reply: result.reply,
      configured: result.configured,
      provider: result.provider,
      setupHint: result.setupHint ?? null,
      userMessage: toDocumentChatMessageRecordDto(result.userMessage),
      assistantMessage: toDocumentChatMessageRecordDto(result.assistantMessage),
      asyncGeneration: result.asyncGeneration,
    };
  }

  @Get(':id/chat/threads/:threadId/messages/:messageId/stream')
  @ApiDocuvateRoute({
    operationId: 'streamChatThreadMessage',
    summary: 'SSE stream for async assistant message generation',
  })
  async streamChatThreadMessage(
    @Session() session: AuthSession,
    @AuthSubject() _subject: AuthorizationSubject,
    @Param('id') id: string,
    @Param('threadId') threadId: string,
    @Param('messageId') messageId: string,
    @Req() req: FastifyRequest,
    @Res({ passthrough: false }) reply: FastifyReply
  ): Promise<void> {
    let closed = false;
    req.raw.on('close', () => {
      closed = true;
    });
    await this.streamDocumentChatMessage.execute(
      id,
      threadId,
      messageId,
      session.user.id,
      reply.raw,
      () => closed
    );
  }

  @Post(':id/chat/threads/:threadId/messages/:messageId/cancel')
  @ApiDocuvateRoute({
    operationId: 'cancelChatThreadMessage',
    summary: 'Cancel in-flight async chat generation',
  })
  async cancelChatThreadMessage(
    @Session() session: AuthSession,
    @AuthSubject() _subject: AuthorizationSubject,
    @Param('id') id: string,
    @Param('threadId') threadId: string,
    @Param('messageId') messageId: string
  ): Promise<OkResponseDto> {
    await this.cancelDocumentChatGeneration.execute(id, threadId, messageId, session.user.id);
    return { ok: true };
  }

  @Post(':id/chat/threads/:threadId/messages/:messageId/retry')
  @ApiDocuvateRoute({
    operationId: 'retryChatThreadMessage',
    summary: 'Retry failed async chat message generation',
  })
  async retryChatThreadMessage(
    @Session() session: AuthSession,
    @AuthSubject() _subject: AuthorizationSubject,
    @Param('id') id: string,
    @Param('threadId') threadId: string,
    @Param('messageId') messageId: string
  ) {
    const message = await this.retryDocumentChatMessage.execute(
      id,
      threadId,
      messageId,
      session.user.id
    );
    return { message: toDocumentChatMessageRecordDto(message) };
  }

  @Post(':id/chat')
  @ApiDocuvateRoute({ operationId: 'chat', summary: 'chat' })
  async chat(
    @Session() session: AuthSession,
    @AuthSubject() subject: AuthorizationSubject,
    @Param('id') id: string,
    @Body() body: DocumentChatRequestDto
  ): Promise<DocumentChatResponseDto> {
    const result = await this.documentChat.execute(
      id,
      session.user.id,
      subject,
      body.message,
      body.history ?? []
    );
    return {
      reply: result.reply,
      configured: result.configured,
      provider: result.provider,
      setupHint: result.setupHint ?? null,
    };
  }

  @Get(':id/duplicate-candidates')
  @ApiDocuvateRoute({ operationId: 'duplicateCandidates', summary: 'duplicateCandidates' })
  async duplicateCandidates(@Session() session: AuthSession, @Param('id') id: string) {
    const items = await this.listDuplicateCandidates.execute(id, session.user.id);
    return { items };
  }

  @Post(':id/duplicate-candidates/:candidateId/dismiss')
  @ApiDocuvateRoute({ operationId: 'dismissDuplicate', summary: 'dismissDuplicate' })
  async dismissDuplicate(
    @Session() session: AuthSession,
    @Param('id') id: string,
    @Param('candidateId') candidateId: string
  ) {
    await this.dismissDuplicateCandidate.execute(id, candidateId, session.user.id);
    return { ok: true };
  }

  @Post(':id/extraction/requeue')
  @ApiDocuvateRoute({ operationId: 'extractionRequeue', summary: 'extractionRequeue' })
  async extractionRequeue(
    @Session() session: AuthSession,
    @Param('id') id: string
  ): Promise<OkResponseDto> {
    await this.requeueExtraction.execute(id, session.user.id);
    return { ok: true };
  }

  @Post(':id/extraction/compare')
  @ApiDocuvateRoute({ operationId: 'extractionCompare', summary: 'extractionCompare' })
  async extractionCompare(
    @Session() session: AuthSession,
    @Param('id') id: string,
    @Body() body: ExtractionCompareRequestDto
  ): Promise<ExtractionCompareResponse> {
    const engines = body.engines?.length ? body.engines : [];
    return this.compareExtraction.execute(id, session.user.id, engines, body.maxPages ?? 3);
  }

  @Post(':id/extraction/arena-rating')
  @ApiDocuvateRoute({ operationId: 'extractionArenaRating', summary: 'extractionArenaRating' })
  async extractionArenaRating(
    @Session() session: AuthSession,
    @Param('id') id: string,
    @Body() body: ExtractionArenaRatingRequestDto
  ): Promise<OkResponseDto> {
    await this.applyArenaWinner.execute(id, session.user.id, body.winnerEngine);
    await this.recordArenaRating.execute(session.user.id, {
      documentId: id,
      winnerEngine: body.winnerEngine,
      comparedEngines: body.comparedEngines,
      rating: body.rating,
      applyAsDefault: body.applyAsDefault,
    });
    return { ok: true };
  }

  @Get(':id/duplicate-stack')
  @ApiDocuvateRoute({ operationId: 'duplicateStack', summary: 'duplicateStack' })
  async duplicateStack(@Session() session: AuthSession, @Param('id') id: string) {
    const stack = await this.getDuplicateStack.execute(id, session.user.id);
    return { stack };
  }

  @Post(':id/duplicate-stack/set-primary')
  @ApiDocuvateRoute({
    operationId: 'duplicateStackSetPrimary',
    summary: 'duplicateStackSetPrimary',
  })
  async duplicateStackSetPrimary(
    @Session() session: AuthSession,
    @Param('id') id: string,
    @Body() body: DuplicateStackSetPrimaryRequestDto
  ) {
    await this.setDuplicateStackPrimary.execute(body.stackId, body.documentId, session.user.id);
    const stack = await this.getDuplicateStack.execute(id, session.user.id);
    return { stack };
  }

  @Post(':id/duplicate-stack/keep-version')
  @ApiDocuvateRoute({
    operationId: 'duplicateStackKeepVersion',
    summary: 'duplicateStackKeepVersion',
  })
  async duplicateStackKeepVersion(
    @Session() session: AuthSession,
    @Param('id') id: string,
    @Body() body: DuplicateStackKeepVersionRequestDto
  ) {
    await this.confirmDuplicateVersion.execute(id, body.versionDocumentId, session.user.id);
    const stack = await this.getDuplicateStack.execute(id, session.user.id);
    return { stack };
  }

  @Post(':id/duplicate-stack/not-duplicate')
  @ApiDocuvateRoute({
    operationId: 'duplicateStackNotDuplicate',
    summary: 'duplicateStackNotDuplicate',
  })
  async duplicateStackNotDuplicate(
    @Session() session: AuthSession,
    @Param('id') id: string,
    @Body() body: DuplicateStackNotDuplicateRequestDto
  ): Promise<OkResponseDto> {
    await this.releaseDuplicateStackMember.execute(id, body.otherDocumentId, session.user.id);
    return { ok: true };
  }

  @Get(':id')
  @ApiDocuvateRoute({ operationId: 'getDocument', summary: 'Get document (ABAC)' })
  @ApiOkResponse({ type: DocumentResponseDto })
  async getOne(
    @Session() session: AuthSession,
    @AuthSubject() subject: AuthorizationSubject,
    @Param('id') id: string
  ) {
    const doc = await this.getDocument.execute(id, session.user.id, subject);
    const suggestions = await this.loadSuggestions.execute(id, session.user.id);
    const duplicateCandidates = await this.listDuplicateCandidates.execute(id, session.user.id);
    return toDocumentDto(doc, suggestions, duplicateCandidates.length);
  }

  @Patch(':id')
  @ApiDocuvateRoute({ operationId: 'patch', summary: 'patch' })
  async patch(
    @Session() session: AuthSession,
    @Param('id') id: string,
    @Body() body: UpdateDocumentRequestDto
  ) {
    const { document, fieldCorrectionsRecorded } = await this.updateDocument.execute(
      id,
      session.user.id,
      body
    );
    const suggestions = await this.loadSuggestions.execute(id, session.user.id);
    return {
      document: toDocumentDto(document, suggestions),
      fieldCorrectionsRecorded,
    };
  }

  @Delete(':id')
  @ApiDocuvateRoute({ operationId: 'deleteDocument', summary: 'Delete document' })
  async remove(@Session() session: AuthSession, @Param('id') id: string) {
    await this.deleteDocument.execute(id, session.user.id);
    return { ok: true };
  }

  @Post()
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
      required: ['file'],
    },
  })
  @ApiDocuvateRoute({
    operationId: 'createDocument',
    summary: 'Upload document (multipart file field)',
  })
  async upload(
    @Session() session: AuthSession,
    @Req() req: FastifyRequest,
    @Query('folderId') folderId?: string,
    @Query('mappeId') mappeId?: string
  ) {
    const file = await req.file();
    if (!file) {
      return { code: 'VALIDATION_ERROR', message: 'No file uploaded' };
    }
    const buffer = await file.toBuffer();
    const doc = await this.uploadDocument.execute({
      userId: session.user.id,
      filename: file.filename,
      mimeType: file.mimetype,
      buffer,
      folderId: folderId ?? null,
      mappeId: mappeId ?? null,
    });
    return toDocumentDto(doc);
  }
}
