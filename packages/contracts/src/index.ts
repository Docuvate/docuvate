// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
export * from './upload-formats.js';
export * from './password-policy.js';
export * from './auth-sign-in.js';
import type { ConnectorSourceScopeDto } from './connector-source-scope.js';
export type { SavedDocumentViewFieldFilterDto } from './saved-view-field-filter.js';
import type { SavedDocumentViewFieldFilterDto } from './saved-view-field-filter.js';
import type { ExtractedFactDto } from './extracted-facts.js';
import type { RecognizedFieldExtractionAttemptDto } from './field-extraction-attempt.js';

export type DocumentStatus = 'uploaded' | 'queued' | 'extracting' | 'ready' | 'failed';

export type MatchingAlgorithm = 'none' | 'any' | 'all' | 'exact' | 'regex';

export type CustomFieldType = 'text' | 'date' | 'number' | 'currency';

export interface TagCustomFieldDefinitionDto {
  id: string;
  tagId: string;
  key: string;
  label: string;
  fieldType: CustomFieldType;
  sortOrder: number;
}

/** Open-set CE field discovery for a label (suggest only; user saves via unified custom-fields API). */
export interface TagCustomFieldSuggestionDto {
  key: string;
  label: string;
  confidence: number;
  kind: string;
}

export type RecognizedFieldLabelGateMatch = 'any' | 'all';

/** User-managed field catalog entry (global or label-attached via tag defs). */
export interface RecognizedFieldDefinitionDto {
  id: string;
  key: string;
  label: string;
  fieldType: CustomFieldType;
  sortOrder: number;
  /** When true, extract immediately after OCR (no per-field label gate). */
  extractForAllDocuments: boolean;
  /** Non-empty: extract only when label gate passes. Empty with `extractForAllDocuments` false: confidence-only gate. */
  gateLabelIds: string[];
  gateLabelMatch: RecognizedFieldLabelGateMatch;
  /** Per-field label-confidence threshold (0–1). Null = use account default when saving new fields only. */
  minLabelConfidence: number | null;
  /** When false, skip label-confidence check for this field. Null = treated as true for gated fields. */
  confidenceGateEnabled: boolean | null;
  /** When true, field appears in library filter UI (e.g. Absender). */
  showInFilter: boolean;
}

export interface ReplaceRecognizedFieldsRequest {
  fields: Array<{
    key: string;
    label: string;
    fieldType?: CustomFieldType;
    sortOrder?: number;
    extractForAllDocuments?: boolean;
    gateLabelIds?: string[];
    gateLabelMatch?: RecognizedFieldLabelGateMatch;
    minLabelConfidence?: number | null;
    confidenceGateEnabled?: boolean | null;
    showInFilter?: boolean;
  }>;
}

export type DocumentPipelineModuleId =
  | 'ocr'
  | 'label_matching'
  | 'embedding_suggestions'
  | 'global_recognized_fields'
  | 'label_attached_fields'
  | 'duplicate_detection';

export interface DocumentPipelineModuleInfoDto {
  id: DocumentPipelineModuleId;
  label: string;
  description: string;
  defaultEnabled: boolean;
  defaultOrder: number;
}

export interface ExtractedField {
  key: string;
  value: string;
  confidence?: number;
  /** Set for label-scoped custom fields (storage key remains `label:{tagId}:{key}`). */
  tagId?: string;
}

/** Normalized bounding box (0-1 relative to page width/height). */
export interface ExtractionBlock {
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  blockIndex?: number;
}

export type DocumentExtractionImageKind = 'embedded' | 'figure';

export interface DocumentExtractionImageDto {
  id: string;
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
  kind: DocumentExtractionImageKind;
  caption?: string | null;
}

/** Worker → API ingest payload (thumbnail bytes as base64). */
export interface ExtractionImageIngestDto {
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
  kind: DocumentExtractionImageKind;
  caption?: string | null;
  thumbnailPngBase64: string;
}

export interface NormalizedBBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type LayoutIrTextAlign = 'left' | 'center' | 'right' | 'justify';
export type LayoutIrFontWeight = 'normal' | 'bold';

/** Positioned text region in layout IR (line or paragraph cluster). */
export interface LayoutIrBlock {
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  fontFamily?: string;
  fontSizePt?: number;
  weight?: LayoutIrFontWeight;
  align?: LayoutIrTextAlign;
  columnIndex?: number;
  /** Index into document `extraction.blocks` for PDF ↔ layout crosslink. */
  blockIndex?: number;
  rotationDeg?: number;
  matrix?: [number, number, number, number, number, number];
  textRgb?: [number, number, number];
  textOriginX?: number;
  textOriginY?: number;
}

/** Semantic reading-order line (optional; blocks drive fidelity render). */
export interface LayoutIrLine {
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  fontFamily?: string;
  fontSizePt?: number;
  weight?: LayoutIrFontWeight;
  align?: LayoutIrTextAlign;
  blockIndex?: number;
}

export type LayoutIrVectorKind = 'rect' | 'line' | 'path';

export interface LayoutIrVector {
  kind: LayoutIrVectorKind;
  x: number;
  y: number;
  width: number;
  height: number;
  strokeWidthPt?: number;
  filled?: boolean;
  fillGray?: number;
  fillRgb?: [number, number, number];
  strokeRgb?: [number, number, number];
  pathD?: string;
}

export type LayoutIrCellRole = 'header' | 'label' | 'value';

export interface LayoutIrTableCell {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSizePt?: number;
  weight?: LayoutIrFontWeight;
  blockIndex?: number;
  cellRole?: LayoutIrCellRole;
}

export interface LayoutIrTable {
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
  columnCount: number;
  rows: LayoutIrTableCell[][];
}

export type LayoutIrWidgetKind = 'text' | 'checkbox';

export interface LayoutIrWidget {
  kind: LayoutIrWidgetKind;
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
  value?: string;
  checked?: boolean;
  fieldName?: string;
  rotationDeg?: number;
  fontSizePt?: number;
  fontFamily?: string;
  align?: LayoutIrTextAlign;
  checkMark?: string;
}

export interface LayoutIrPageSummary {
  page: number;
  widthPt: number;
  heightPt: number;
}

export interface LayoutIrPage {
  page: number;
  widthPt: number;
  heightPt: number;
  blocks: LayoutIrBlock[];
  lines?: LayoutIrLine[];
  tables?: LayoutIrTable[];
  vectors?: LayoutIrVector[];
  widgets?: LayoutIrWidget[];
}

/** Versioned layout intermediate representation for HTML and Typst rendering. */
export interface LayoutIrDocument {
  version: 1;
  pages: LayoutIrPage[];
}

export interface RepresentationUnitDto {
  unitIndex: number;
  kind: string;
  text: string;
  page?: number | null;
  x?: number | null;
  y?: number | null;
  width?: number | null;
  height?: number | null;
  charStart?: number | null;
  charEnd?: number | null;
  vectorScale: number;
  vectorInt8Base64: string;
  binaryCodeBase64: string;
}

export interface DocumentRepresentationDto {
  encoderId: string;
  encoderRevision: string;
  representationVersion: number;
  units: RepresentationUnitDto[];
  documentMeanScale: number;
  documentMeanInt8Base64: string;
  documentMaxScale: number;
  documentMaxInt8Base64: string;
}

export type {
  ExtractedFactDto,
  ExtractedFactKind,
  ExtractedFactProvenanceDto,
} from './extracted-facts.js';

export interface ExtractionResult {
  text: string;
  fields: ExtractedField[];
  /** Worker heuristic hints (also persisted as `suggestion:*` field rows when stored). */
  fieldSuggestions?: Array<{ key: string; value: string; confidence?: number }>;
  blocks?: ExtractionBlock[];
  /** Worker → API only (thumbnails as base64); stripped before persistence. */
  imageIngest?: ExtractionImageIngestDto[];
  /** Stored in DB only; never exposed on document GET. */
  markdown?: string;
  /** Persisted on extraction save; not included on document GET payloads. */
  layoutIr?: LayoutIrDocument;
  /** True when persisted layout IR exists (fetch via GET /documents/:id/layout-ir). */
  layoutIrAvailable?: boolean;
  /** Page dimensions from persisted layout IR (no block payload). */
  layoutIrPages?: LayoutIrPageSummary[];
  /** Central document representation from worker `/extract` (persisted separately). */
  documentRepresentation?: DocumentRepresentationDto;
  /** Exact fact index from worker when `exactAnswers` is enabled (persisted separately). */
  extractedFacts?: ExtractedFactDto[];
}

/** Document GET/API extraction payload (no internal worker fields). */
export interface DocumentExtractionDto {
  text: string;
  fields: ExtractedField[];
  blocks?: ExtractionBlock[];
  images?: DocumentExtractionImageDto[];
  layoutIrAvailable?: boolean;
  layoutIrPages?: LayoutIrPageSummary[];
}

export interface FolderDto {
  id: string;
  name: string;
  parentId?: string | null;
  documentCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFolderRequest {
  name: string;
  parentId?: string | null;
}

export interface UpdateFolderRequest {
  name?: string;
  parentId?: string | null;
}

export interface MoveDocumentsRequest {
  documentIds: string[];
  /** Target folder, or null for „Ohne Ordner“. */
  folderId?: string | null;
}

export interface MoveDocumentsResponse {
  affected: number;
  previousFolderIds: Array<{ documentId: string; folderId: string | null }>;
}

export type DuplicateCandidateSource = 'hash' | 'embedding' | 'smart';

export interface DuplicateCandidateDto {
  id: string;
  documentId: string;
  candidateDocumentId: string;
  candidateTitle: string;
  candidateFilename: string;
  similarity: number;
  source: DuplicateCandidateSource;
  dismissed: boolean;
}

export interface DocumentDuplicateStackSummaryDto {
  stackId: string;
  versionCount: number;
  pendingReview: boolean;
}

export interface DocumentReviewFieldSuggestionDto {
  key: string;
  displayLabel: string;
  value: string;
  confidence?: number;
}

export interface DocumentReviewQueueItemDto {
  documentId: string;
  title: string;
  filename: string;
  documentDate: string | null;
  suggestedDocumentDate: string | null;
  uploadDate: string;
  labelSuggestions: TagSuggestionDto[];
  fieldSuggestions: DocumentReviewFieldSuggestionDto[];
  duplicateStack: DocumentDuplicateStackSummaryDto | null;
}

export interface DocumentReviewQueueResponseDto {
  total: number;
  items: DocumentReviewQueueItemDto[];
}

export interface DocumentReviewQueueSummaryDto {
  pendingCount: number;
}

export interface AcceptDocumentReviewResponseDto {
  documentId: string;
  acceptedLabels: number;
  acceptedFields: number;
}

export interface AcceptDocumentReviewBatchResponseDto {
  documentsProcessed: number;
  acceptedLabels: number;
  acceptedFields: number;
}

export interface DuplicateStackMemberDto {
  documentId: string;
  role: 'primary' | 'version';
  title: string;
  filename: string;
  status: DocumentStatus;
  mimeType: string;
  similarity: number | null;
  source: DuplicateCandidateSource | null;
  candidateLinkDismissed: boolean;
}

export interface DuplicateStackDto {
  stackId: string;
  primaryDocumentId: string;
  members: DuplicateStackMemberDto[];
}

export interface DuplicateSetDocumentDto {
  documentId: string;
  title: string;
  filename: string;
  createdAt: string;
}

export interface DuplicateSetDto {
  setId: string;
  documents: DuplicateSetDocumentDto[];
  maxSimilarity: number;
  similarityPercent: number;
  bulkArchiveEligible: boolean;
  sources: DuplicateCandidateSource[];
}

export type DuplicateSetDecisionAction = 'archive' | 'dismiss';

export interface DuplicateSetDecision {
  setId: string;
  action: DuplicateSetDecisionAction;
}

export interface ApplyDuplicateSetDecisionsRequest {
  decisions: DuplicateSetDecision[];
}

export interface TagDto {
  id: string;
  name: string;
  color?: string;
  isInbox: boolean;
  matchingAlgorithm?: MatchingAlgorithm;
  match?: string;
  customFields?: TagCustomFieldDefinitionDto[];
}

export interface CorrespondentDto {
  id: string;
  name: string;
  matchingAlgorithm?: MatchingAlgorithm;
  match?: string;
}

export type TagSuggestionSource = 'rule' | 'embedding' | 'embedding_density';

export type TagSuggestionDecisionTier = 'auto_apply' | 'confirm' | 'none';

export interface TagSuggestionDto {
  tag: TagDto;
  reason: string;
  confidence?: number;
  source?: TagSuggestionSource;
  decisionTier?: TagSuggestionDecisionTier;
}

export interface ApplyLabelCorrectionRequest {
  toTagId: string;
}

export interface ApplyLabelCorrectionResponse {
  ok: true;
  correctionId: string | null;
  similarDocumentsUpdated: number;
}

export type PaperlessImportRunStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

export type PaperlessOcrMode = 'keep_paperless' | 'rerun_docuvate';

export interface PaperlessImportRunDto {
  id: string;
  installationId: string;
  status: PaperlessImportRunStatus;
  paperlessApiVersion: number | null;
  ocrMode: PaperlessOcrMode;
  includeArchivedPdf: boolean;
  progressProcessed: number;
  progressTotal: number | null;
  fatalErrorKey: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaperlessImportDryRunSummaryDto {
  documentCount: number;
  tagCount: number;
  correspondentCount: number;
  documentTypeCount: number;
  storagePathCount: number;
  customFieldCount: number;
  mappingConflicts: string[];
  paperlessApiVersion: number;
}

export interface PaperlessInstallationDto {
  displayName: string;
  baseUrl: string;
  hasStoredApiToken: boolean;
  hasStoredUsername: boolean;
  hasStoredPassword: boolean;
  keepOcrText: boolean;
  rerunOcr: boolean;
  includeArchivedPdf: boolean;
  lastSuccessfulModifiedAt: string | null;
}

export interface PaperlessImportRunErrorMessageParamsDto {
  maxMb?: number;
}

export interface PaperlessImportRunErrorDto {
  id: string;
  sourceDocumentId: string;
  sourceDocumentTitle: string | null;
  messageKey: string;
  messageDetail: string | null;
  messageParams: PaperlessImportRunErrorMessageParamsDto;
  createdAt: string;
}

export interface ChatMessageDto {
  role: 'user' | 'assistant';
  content: string;
}

export interface DocumentChatRequest {
  message: string;
  history?: ChatMessageDto[];
}

export interface DocumentChatResponse {
  reply: ChatMessageDto;
  configured: boolean;
  provider?: string;
  setupHint?: string | null;
}

export type ChatThreadScope = 'document' | 'library';

export interface DocumentChatThreadDto {
  id: string;
  title: string;
  scope: ChatThreadScope;
  documentIds: string[];
  createdAt: string;
  updatedAt: string;
  lastMessagePreview?: string | null;
  /** Set when the latest assistant turn is still generating. */
  activeGenerationStatus?: DocumentChatGenerationStatus | null;
}

export interface DocumentChatThreadListResponse {
  threads: DocumentChatThreadDto[];
}

export interface CreateDocumentChatThreadRequest {
  title?: string;
}

export type DocumentChatGenerationStatus = 'pending' | 'streaming' | 'done' | 'failed';

export type DocumentChatGenerationPhase = 'retrieving' | 'generating' | 'verifying';

export interface ChatMessageCitationDto {
  ordinal: number;
  documentId: string;
  documentTitle: string;
  page: number | null;
  charStart: number;
  charEnd: number;
  quote: string;
  blocks: ExtractionBlock[];
  bbox?: NormalizedBBox | null;
  documentImage?: DocumentExtractionImageDto | null;
}

export type DocumentChatGenerationErrorCode =
  | 'generation_timeout'
  | 'worker_unreachable'
  | 'ollama_error'
  | 'cancelled'
  | 'provider_unavailable'
  | 'unknown';

/** Written when API runs with DOCUVATE_CITED_CHAT_BENCH_STATS=1 (bench harness). */
export interface CitedChatBenchStatsDto {
  citedRejectedClaims: number;
  timingMs?: {
    embedMs: number;
    retrieveMs: number;
    rerankMs: number;
    llmMs: number;
    verifyMs: number;
    totalMs: number;
    promptChars: number;
  };
}

export interface DocumentChatMessageRecordDto extends ChatMessageDto {
  id: string;
  createdAt: string;
  updatedAt?: string;
  generationStatus?: DocumentChatGenerationStatus | null;
  generationPhase?: DocumentChatGenerationPhase | null;
  errorCode?: DocumentChatGenerationErrorCode | string | null;
  citations?: ChatMessageCitationDto[];
  citedBenchStats?: CitedChatBenchStatsDto;
}

export interface DocumentChatThreadMessagesResponse {
  messages: DocumentChatMessageRecordDto[];
}

export interface SendDocumentChatThreadMessageRequest {
  message: string;
}

export interface SendDocumentChatThreadMessageResponse extends DocumentChatResponse {
  userMessage: DocumentChatMessageRecordDto;
  assistantMessage: DocumentChatMessageRecordDto;
  /** True when the assistant reply is generated asynchronously (poll or SSE). */
  asyncGeneration?: boolean;
}

export interface DocumentChatMessageStreamEvent {
  type: 'snapshot' | 'token' | 'phase' | 'done' | 'failed' | 'cancelled';
  message: DocumentChatMessageRecordDto;
}

export interface DocumentDto {
  id: string;
  filename: string;
  title: string;
  status: DocumentStatus;
  /** Set when status is failed (extraction or enqueue error). */
  extractionFailureReason?: string | null;
  mimeType: string;
  /** Original upload size in bytes. */
  fileSizeBytes: number;
  /** Short file-type badge (DOCX, PDF, …). */
  formatBadge?: string;
  /** True when GET /documents/:id/preview serves an application/pdf body. */
  previewAvailable?: boolean;
  /** Machine ingest channel (e.g. scanner_sftp). */
  ingestSource?: string | null;
  documentDate?: string | null;
  notes?: string | null;
  folderId?: string | null;
  folder?: Pick<FolderDto, 'id' | 'name'> | null;
  tags: TagDto[];
  tagSuggestions?: TagSuggestionDto[];
  duplicateCandidateCount?: number;
  duplicateStack?: DocumentDuplicateStackSummaryDto | null;
  createdAt: string;
  updatedAt: string;
  extraction?: DocumentExtractionDto;
  /** Per catalog field: latest extraction attempt for this document (tenant-scoped). */
  recognizedFieldAttempts?: RecognizedFieldExtractionAttemptDto[];
}

export interface UpdateDocumentRequest {
  title?: string;
  documentDate?: string | null;
  notes?: string | null;
  folderId?: string | null;
  tagIds?: string[];
  extractionFields?: ExtractedField[];
  extractionBlocks?: ExtractionBlock[];
}

export interface UpdateDocumentResponse {
  document: DocumentDto;
  /** Count of field-value corrections persisted as extraction training feedback. */
  fieldCorrectionsRecorded?: number;
  /** Count of newly recorded field confirmations (confidence-only, idempotent per field). */
  fieldConfirmationsRecorded?: number;
}

/** Export / pipeline consumption of user field corrections. */
export interface ExtractionFieldCorrectionDto {
  id: string;
  documentId: string;
  fieldKey: string;
  oldValue: string;
  newValue: string;
  labelTagIds: string[];
  fieldTagId: string | null;
  source: 'user_correction';
  createdAt: string;
}

export type DocumentBulkAction =
  | { action: 'addTag'; tagId: string }
  | { action: 'removeTag'; tagId: string }
  | { action: 'setAbsender'; value: string | null }
  | { action: 'setFolder'; folderId: string | null }
  | { action: 'delete' };

export interface DocumentBulkRequest {
  ids: string[];
  bulk: DocumentBulkAction;
}

export interface CreateTagRequest {
  name: string;
  color?: string;
  isInbox?: boolean;
  matchingAlgorithm?: MatchingAlgorithm;
  match?: string;
}

export interface UpdateTagRequest {
  name?: string;
  color?: string | null;
  isInbox?: boolean;
  matchingAlgorithm?: MatchingAlgorithm;
  match?: string;
}

export type LabelRecommendationKind = 'new' | 'merge' | 'rename' | 'assign';

export type LabelRecommendationSource = 'text' | 'embedding';

export interface LabelRecommendationDocumentPreviewDto {
  id: string;
  title: string;
  filename: string;
  status?: DocumentStatus;
  documentDate?: string | null;
  /** Cosine similarity to the cluster centroid (0..1), when available. */
  similarity?: number;
}

export type LabelRecommendationsLoadState = 'ready' | 'warming';

export interface LabelRecommendationListResponse {
  items: LabelRecommendationDto[];
  state: LabelRecommendationsLoadState;
}

export interface LabelRecommendationDto {
  id: string;
  kind: LabelRecommendationKind;
  score: number;
  reason: string;
  /** Cosine similarity when recommendation is embedding-based (0..1). */
  similarity?: number;
  source?: LabelRecommendationSource;
  proposedName?: string;
  currentName?: string;
  tagId?: string;
  tagIds?: string[];
  tagNames?: string[];
  nearestTagName?: string;
  sampleDocumentIds?: string[];
  /** Resolved document summaries for assign/new recommendations (UI). */
  sampleDocuments?: LabelRecommendationDocumentPreviewDto[];
}

export type LabelMapPointKind = 'document' | 'tag';

/** Embedding-space coverage vs label centroids (see label map API). */
export type LabelMapCoverageStatus = 'explained' | 'unexplained' | 'outside' | 'unlabeled_near';

export interface LabelMapCoverageSummaryDto {
  explained: number;
  unexplained: number;
  outside: number;
  unlabeledNear: number;
  /** Cosine similarity threshold for “inside label content space”. */
  threshold: number;
  /** Share of documents whose assigned labels explain content (0–100). */
  coveredPercent: number;
  /** Documents that still need labeling attention (not explained). */
  gapCount: number;
  /** Documents where information-coverage hints an additional label may be missing (calibrated). */
  labelMissingHintCount: number;
}

export type LabelMapProjectionMethod = 'pca' | 'umap';

export interface LabelMapOverlapHighPairDto {
  tagIdA: string;
  tagIdB: string;
  tagNameA: string;
  tagNameB: string;
  similarity: number;
  mergeRecommendationId: string;
}

export interface LabelMapOverlapMatrixDto {
  tagIds: string[];
  tagNames: string[];
  similarities: number[][];
  highOverlapPairs: LabelMapOverlapHighPairDto[];
}

export interface LabelMapPointDto {
  id: string;
  kind: LabelMapPointKind;
  x: number;
  y: number;
  label: string;
  documentId?: string;
  tagId?: string;
  tagIds?: string[];
  tagNames?: string[];
  unlabeled?: boolean;
  sampleCount?: number;
  /** Present on document points when coverage was computed. */
  coverageStatus?: LabelMapCoverageStatus;
  bestAnySimilarity?: number;
  bestAssignedSimilarity?: number | null;
  nearestTagId?: string | null;
  nearestTagName?: string | null;
  /** Max cosine similarity vs centroids and labeled documents (gap ordering). */
  coverageScore?: number;
  /** Information-coverage “label missing?” hint (only when above calibrated threshold). */
  labelMissingHint?: boolean;
}

export type LabelMapEmptyReason =
  'no_extracted_documents' | 'awaiting_embeddings' | 'embedding_unavailable';

export interface LabelMapResponseDto {
  points: LabelMapPointDto[];
  documentCount: number;
  tagCount: number;
  extractedDocumentCount: number;
  emptyReason?: LabelMapEmptyReason | null;
  coverageSummary?: LabelMapCoverageSummaryDto | null;
  projectionMethod?: LabelMapProjectionMethod | null;
  overlap?: LabelMapOverlapMatrixDto | null;
}

export interface AcceptLabelRecommendationRequest {
  recommendationId: string;
  proposedName?: string;
  tagId?: string;
  keepTagId?: string;
  removeTagId?: string;
  color?: string;
  /** When accepting embedding cluster “new label” recommendations. */
  documentIds?: string[];
  /** Cluster documents to exclude from future suggestions for this label name. */
  excludedDocumentIds?: string[];
}

export interface DismissLabelRecommendationRequest {
  phrase?: string;
  /** Block each listed phrase (e.g. merge recommendations). */
  phrases?: string[];
  /** When true, add phrase(s) to the user blocklist (Settings → blocklist). */
  blockFuture?: boolean;
}

export interface DismissTagSuggestionRequest {
  /** When true, add the label name to the user blocklist for all future suggestions. */
  blockFuture?: boolean;
}

export interface LabelRecommendationBlocklistEntryDto {
  id: string;
  phrase: string;
  source: 'manual' | 'dismiss';
  createdAt: string;
}

export interface AddLabelRecommendationBlocklistRequest {
  phrase: string;
}

export interface LabelRecommendationBlocklistPatternDto {
  id: string;
  pattern: string;
  createdAt: string;
}

export interface LabelRecommendationBlocklistResponse {
  items: LabelRecommendationBlocklistEntryDto[];
  patterns: LabelRecommendationBlocklistPatternDto[];
}

export interface ProposeLabelRecommendationBlocklistPatternRequest {
  phrases: string[];
}

export interface ProposeLabelRecommendationBlocklistPatternResponse {
  configured: boolean;
  setupHint?: string;
  proposal?: {
    pattern: string;
    explanation: string;
    phrases: string[];
  };
}

export interface ConfirmLabelRecommendationBlocklistPatternRequest {
  pattern: string;
}

export interface CreateCorrespondentRequest {
  name: string;
  matchingAlgorithm?: MatchingAlgorithm;
  match?: string;
}

export interface UpdateCorrespondentRequest {
  name?: string;
  matchingAlgorithm?: MatchingAlgorithm;
  match?: string;
}

export type { ApiErrorEnvelope, ProblemDetails } from './problem-details.js';
export { PROBLEM_DETAILS_MEDIA_TYPE, PROBLEM_TYPE_ABOUT_BLANK } from './problem-details.js';
export {
  ERROR_CODES,
  NOT_FOUND_RESOURCE_CODES,
  errorCodeI18nKey,
  isErrorCode,
  notFoundCodeForResource,
  type ErrorCode,
} from './error-codes.js';

export type DocumentSortField = 'updatedAt' | 'createdAt' | 'title' | 'documentDate';
export type SortOrder = 'asc' | 'desc';

/** Default page size for GET /documents when `limit` is omitted. */
export const DOCUMENT_LIST_DEFAULT_LIMIT = 50;
/** Maximum allowed `limit` for GET /documents. */
export const DOCUMENT_LIST_MAX_LIMIT = 200;
/** Maximum document IDs per POST /documents/tag-suggestions batch. */
export const DOCUMENT_TAG_SUGGESTIONS_BATCH_MAX = 50;

export interface DocumentTagSuggestionsBatchRequestDto {
  documentIds: string[];
}

export interface DocumentTagSuggestionsBatchItemDto {
  documentId: string;
  suggestions: TagSuggestionDto[];
}

export interface DocumentTagSuggestionsBatchResponseDto {
  items: DocumentTagSuggestionsBatchItemDto[];
}

export interface DocumentListQuery {
  q?: string;
  status?: DocumentStatus;
  tagId?: string;
  /** Comma-separated in query; documents must have all listed tags. */
  tagIds?: string[];
  /** Recognized field key (without `global:` prefix). */
  recognizedFieldKey?: string;
  recognizedFieldValue?: string;
  /** Alias for list query params. */
  fieldFilterKey?: string;
  fieldFilterValue?: string;
  /** AND-combined recognized field filters (saved views + library). */
  fieldFilters?: SavedDocumentViewFieldFilterDto[];
  folderId?: string;
  unfiled?: boolean;
  inbox?: boolean;
  /** Ready documents with no non-inbox label assigned. */
  withoutNonInboxLabel?: boolean;
  /** Inclusive ISO date (YYYY-MM-DD) on document_date. */
  documentDateFrom?: string;
  /** Inclusive ISO date (YYYY-MM-DD) on document_date. */
  documentDateTo?: string;
  sort?: DocumentSortField;
  order?: SortOrder;
  /** Include open tag suggestions on each list item (library label chips). */
  includeTagSuggestions?: boolean;
  /** Page size (HTTP list only; internal repository calls omit for unpaginated reads). */
  limit?: number;
  /** Opaque keyset cursor from a previous response's `nextCursor`. */
  cursor?: string;
}

/** Slim document row for list/search responses (no extraction payload or large nested fields). */
export type DocumentListItemDto = Omit<
  DocumentDto,
  'extraction' | 'recognizedFieldAttempts' | 'tagSuggestions' | 'notes'
>;

export interface DocumentListResponseDto {
  items: DocumentListItemDto[];
  nextCursor: string | null;
  hasMore: boolean;
  /** Total rows for the current filter set; present on the first page when no `cursor` was sent. */
  total: number | null;
}

export type ExtractorEngineId = 'pipeline' | 'paddle' | 'docling' | 'pdf_native' | 'tesseract';

export interface ExtractionEngineInfo {
  id: ExtractorEngineId | string;
  label: string;
  description: string;
  available?: boolean;
  arenaEligible?: boolean;
}

export type DocumentChatProviderId =
  'mock' | 'context' | 'rag-ollama' | 'ollama' | 'donut-ml' | 'off';

export interface DocumentChatProviderInfo {
  id: DocumentChatProviderId | string;
  label: string;
  description: string;
  available: boolean;
}

export interface DocumentChatUnavailableBackendInfo {
  id: string;
  label: string;
  reason: string;
  setupHint: string;
  /** Stable code for UI i18n (e.g. model_loading, worker_offline). */
  reasonCode?: string;
}

export interface DocumentChatProvidersCatalogDto {
  selectable: DocumentChatProviderInfo[];
  unavailable: DocumentChatUnavailableBackendInfo[];
  development?: DocumentChatProviderInfo[];
  meta: {
    ollamaModel: string | null;
    ollamaConfigured: boolean;
    ollamaModelReady?: boolean;
    runsOnCpu: boolean;
  };
}

export type InferenceDeviceKind = 'cuda' | 'mps' | 'rocm' | 'cpu';

export interface HardwareCapabilitiesDto {
  device: InferenceDeviceKind | string;
  vramMb: number;
  gpuAvailable: boolean;
  capabilities: {
    heavyVision: boolean;
    largeLocalLlm: boolean;
    cpuRag: boolean;
  };
  /** Admin hint when Docker Desktop / host RAM is likely too low for Ollama + worker. */
  dockerMemoryWarning?: boolean;
  dockerMemoryHintDe?: string | null;
  dockerMemoryHintEn?: string | null;
}

export type { FeatureFlagKey, FeatureFlagsDto, RemoteConfigDto, SourceConnectorPluginId } from './feature-flags.js';
export { SOURCE_CONNECTOR_PLUGIN_IDS, isSourceConnectorPluginId } from './feature-flags.js';

export type ThemePreference = 'light' | 'dark' | 'system';
export type UiLocale = 'de' | 'en';

export interface UserSettingsDto {
  preferredExtractorEngine: ExtractorEngineId | string;
  preferredChatProvider?: DocumentChatProviderId | string | null;
  effectiveChatProvider?: DocumentChatProviderId | string;
  /** LLM provider used for document chat in the product UI (never context-only). */
  customerChatProvider?: DocumentChatProviderId | string;
  documentChatUiEnabled?: boolean;
  /** True when the customer-facing LLM chat path can run (RAG+Ollama or Donut). */
  documentChatAvailable?: boolean;
  /** ready | starting | unavailable | off — customer-facing readiness for document chat. */
  documentChatReadiness?: 'ready' | 'starting' | 'unavailable' | 'off';
  /** Customer reason code when chat is starting or unavailable (maps to settings.chatUnavailableReason.*). */
  documentChatReadinessReason?: string | null;
  documentChatOllamaModel?: string | null;
  documentChatRunsOnCpu?: boolean;
  /** Tenant flag: local Ollama LLM allowed (requires Compose chat-local or external Ollama). */
  documentChatLocalModelEnabled?: boolean;
  /** Local model loaded and ready for open-ended LLM answers. */
  documentChatLocalModelReady?: boolean;
  advancedFeaturesEnabled?: boolean;
  useArenaWinnerAsDefault: boolean;
  arenaWinnerEngine?: string | null;
  /** Min. label confidence (0–1) before gated recognized fields run for a suggested label. Assigned non-inbox labels qualify. */
  labelFieldConfidenceThreshold?: number;
  /** When true, gated catalog fields require label confidence (or assignment). */
  fieldExtractionConfidenceGateEnabled?: boolean;
  /** All must be assigned on the document (AND) before gated field extraction. */
  fieldExtractionRequiredLabelIds?: string[];
  themePreference?: ThemePreference;
  locale?: UiLocale | null;
  /** Optional OpenAI-compatible chat endpoint (Ollama remains default when unset). */
  documentChatCloudBaseUrl?: string | null;
  documentChatCloudApiKeyConfigured?: boolean;
}

export interface UpdateUserSettingsRequest {
  preferredExtractorEngine?: ExtractorEngineId | string;
  preferredChatProvider?: DocumentChatProviderId | string | null;
  useArenaWinnerAsDefault?: boolean;
  labelFieldConfidenceThreshold?: number;
  fieldExtractionConfidenceGateEnabled?: boolean;
  fieldExtractionRequiredLabelIds?: string[];
  advancedFeaturesEnabled?: boolean;
  themePreference?: ThemePreference;
  locale?: UiLocale | null;
  documentChatCloudBaseUrl?: string | null;
  /** Set to empty string to clear a stored key. */
  documentChatCloudApiKey?: string | null;
}

export interface ReplaceTagCustomFieldsRequest {
  fields: Array<{
    key: string;
    label: string;
    fieldType?: CustomFieldType;
    sortOrder?: number;
  }>;
}

export interface TagCustomFieldListResponseDto {
  items: TagCustomFieldDefinitionDto[];
  suggestions?: TagCustomFieldSuggestionDto[];
}

export interface ExtractionCompareItem {
  engine: string;
  elapsedMs: number;
  error?: string | null;
  text?: string | null;
  charCount?: number | null;
  blockCount?: number | null;
  fields?: ExtractedField[];
}

export interface ExtractionCompareResponse {
  items: ExtractionCompareItem[];
  engines?: string[];
  maxPages?: number | null;
}

export interface ExtractionArenaRatingRequest {
  winnerEngine: string;
  comparedEngines: string[];
  rating?: number;
  applyAsDefault?: boolean;
}

export type ConnectorTier = 'oss' | 'commercial';

export type ConnectorCategoryId = 'mail' | 'dms' | 'home_automation' | 'storage' | 'scanner_sftp';

export type ConnectorPluginId =
  'gmail' | 'outlook' | 'paperless' | 'home_assistant' | 'amazon_s3' | 'sftp_fetch';

export type ConnectorCapabilityRole = 'source' | 'sink';

export type ConnectorAuthStrategyKind = 'oauth2' | 'bearer' | 'basic' | 'api_key' | 'custom';

export type ConnectorAuthFieldType = 'text' | 'password' | 'url' | 'email';

export interface ConnectorAuthFieldDescriptorDto {
  key: string;
  labelKey: string;
  type: ConnectorAuthFieldType;
  required: boolean;
  secret?: boolean;
  placeholderKey?: string;
  helpKey?: string;
}

export interface ConnectorOAuthSetupDto {
  configured: boolean;
  missingEnvVars: string[];
}

export interface ConnectorAuthDescriptorDto {
  strategy: ConnectorAuthStrategyKind;
  fields: ConnectorAuthFieldDescriptorDto[];
  oauth?: ConnectorOAuthSetupDto;
}

export interface ConnectorCategoryInfoDto {
  id: ConnectorCategoryId;
  labelKey: string;
  descriptionKey: string;
}

export interface ConnectorPluginCatalogEntryDto {
  id: ConnectorPluginId;
  categoryId: ConnectorCategoryId;
  labelKey: string;
  descriptionKey: string;
  capabilities: ConnectorCapabilityRole[];
  tier: ConnectorTier;
  auth: ConnectorAuthDescriptorDto;
}

export interface ConnectorCatalogResponse {
  categories: ConnectorCategoryInfoDto[];
  plugins: ConnectorPluginCatalogEntryDto[];
  /** True when the viewer may configure server-side OAuth (instance admin). */
  viewerIsServerAdmin: boolean;
}

export interface ConnectorInstallationDto {
  id: string;
  pluginId: ConnectorPluginId;
  displayName: string;
  enabled: boolean;
  sourceScope: ConnectorSourceScopeDto;
  createdAt: string;
  updatedAt: string;
}

export interface CreateConnectorInstallationRequest {
  pluginId: ConnectorPluginId;
  displayName: string;
  credentials: Record<string, string>;
  sourceScope?: ConnectorSourceScopeDto;
}

export interface UpdateConnectorInstallationRequest {
  displayName?: string;
  sourceScope?: ConnectorSourceScopeDto;
}

export type {
  ConnectorSourceScopeDto,
  ConnectorSourceScopeMode,
  ConnectorSourceTreeNodeDto,
} from './connector-source-scope.js';

export interface ConnectorImportableItemDto {
  ref: string;
  title: string;
  mimeType: string | null;
  sizeBytes: number | null;
}

export { isPlausibleExtractedDateValue } from './extracted-field-date.js';
export {
  dedupeExtractedFields,
  omitInvalidDateExtractedFields,
  semanticFieldKey,
  type ExtractedFieldRow,
} from './extracted-field-dedupe.js';
export {
  GLOBAL_HEURISTIC_FIELD_KEYS,
  catalogDefinesSemanticKey,
  isPlainGlobalHeuristicField,
  partitionRecognizedAndHeuristicSuggestions,
  parseSuggestionStorageKey,
  suggestionStorageKey,
  type FieldSuggestionRow,
} from './global-heuristic-fields.js';
export {
  evaluateFieldExtractionGate,
  type FieldExtractionGateConfig,
  type FieldExtractionGateDocumentLabels,
  type FieldExtractionLabelMatch,
} from './field-extraction-gate.js';
export {
  RECOGNIZED_FIELD_EXTRACTION_OUTCOMES,
  type RecognizedFieldExtractionAttemptDto,
  type RecognizedFieldExtractionOutcome,
} from './field-extraction-attempt.js';

export type MlModelKind = 'ocr' | 'embedding' | 'docqa' | 'field_extractor';

export type MlModelLifecycle = 'registered' | 'canary' | 'active' | 'archived' | 'failed';

export interface MlModelFamilyDto {
  id: string;
  kind: MlModelKind;
  displayName: string;
  description: string | null;
}

export interface MlModelVersionDto {
  id: string;
  familyId: string;
  versionTag: string;
  artifactUri: string | null;
  externalRunId: string | null;
  metrics: Record<string, number>;
  lifecycle: MlModelLifecycle;
  trainingSnapshotId: string | null;
  notes: string | null;
  createdAt: string;
  promotedAt: string | null;
}

export interface MlRetrainJobDto {
  id: string;
  familyId: string;
  triggerKind: 'cron' | 'threshold' | 'manual';
  status: 'queued' | 'running' | 'succeeded' | 'failed' | 'cancelled';
  trainingSnapshotId: string | null;
  resultVersionId: string | null;
  errorMessage: string | null;
  createdAt: string;
  startedAt: string | null;
  finishedAt: string | null;
}

export interface TriggerMlRetrainRequest {
  familyId: string;
}

export interface SetMlModelLifecycleRequest {
  lifecycle: MlModelLifecycle;
}

export type GlobalSearchScopeType = 'documents' | 'folders' | 'labels' | 'settings' | 'actions';

export interface SearchHighlightSpan {
  start: number;
  end: number;
}

export interface GlobalSearchDocumentHitDto {
  type: 'document';
  id: string;
  title: string;
  filename: string;
  snippet: string;
  /** When matched via custom/recognized field leg, label shown in snippet prefix. */
  matchedFieldLabel?: string | null;
  /** Highlights in `title` (and filename when shown). */
  highlightSpans: SearchHighlightSpan[];
  /** Highlights in `snippet` (offsets relative to snippet text). */
  snippetHighlightSpans: SearchHighlightSpan[];
  labelNames: string[];
  folderPath: string | null;
  documentDate: string | null;
  updatedAt: string;
  score: number;
}

export interface GlobalSearchFolderHitDto {
  type: 'folder';
  id: string;
  name: string;
  path: string;
  documentCount: number;
  highlightSpans: SearchHighlightSpan[];
  score: number;
}

export interface GlobalSearchLabelHitDto {
  type: 'label';
  id: string;
  name: string;
  color: string | null;
  documentCount: number;
  highlightSpans: SearchHighlightSpan[];
  score: number;
}

export interface GlobalSearchSettingHitDto {
  type: 'setting';
  id: string;
  title: string;
  description: string;
  route: string;
  highlightSpans: SearchHighlightSpan[];
  score: number;
}

export interface GlobalSearchActionHitDto {
  type: 'action';
  id: string;
  title: string;
  description: string;
  route: string;
  highlightSpans: SearchHighlightSpan[];
  score: number;
}

export type GlobalSearchHitDto =
  | GlobalSearchDocumentHitDto
  | GlobalSearchFolderHitDto
  | GlobalSearchLabelHitDto
  | GlobalSearchSettingHitDto
  | GlobalSearchActionHitDto;

export interface GlobalSearchGroupDto {
  type: GlobalSearchScopeType;
  total: number;
  items: GlobalSearchHitDto[];
  showAllHref: string | null;
}

export interface GlobalSearchResponseDto {
  query: string;
  normalizedQuery: string;
  expandedTerms: string[];
  groups: GlobalSearchGroupDto[];
}

export interface GlobalSearchQuery {
  q: string;
  types?: string;
  limit?: number;
}

export type InstanceRole = 'admin' | 'member';

export interface AdminRoleDescriptionDto {
  role: InstanceRole;
  /** i18n key for a short capability summary (no raw ABAC JSON). */
  summaryKey: string;
}

export interface AdminAccessResponse {
  isAdministrator: boolean;
  role: InstanceRole;
  roleDescriptions: AdminRoleDescriptionDto[];
}

export type AdminUserAccountStatus = 'active' | 'invited' | 'suspended';

export interface AdminUserDto {
  id: string;
  name: string;
  email: string;
  role: InstanceRole;
  banned: boolean;
  banReason: string | null;
  accountStatus: AdminUserAccountStatus;
  createdAt: string;
  lastLoginAt: string | null;
}

export interface AcceptUserInvitationRequest {
  token: string;
  password: string;
}

export interface AdminUserListResponse {
  users: AdminUserDto[];
  total: number;
}

export interface InviteAdminUserRequest {
  email: string;
  name: string;
  role?: InstanceRole;
}

export interface SetAdminUserRoleRequest {
  role: InstanceRole;
}

export interface BanAdminUserRequest {
  reason?: string;
}

export {
  summarizeLabelAssignmentInventory,
  type LabelAssignmentInventory,
  type LabelDocumentInventoryResponseDto,
  type LabelInventoryDocument,
} from './label-document-inventory.js';

export type {
  SavedViewVisibility,
  SavedViewListScope,
  SavedViewViewMode,
  SavedViewFilterMode,
  LibraryTableColumnId,
  SavedDocumentViewDto,
  SavedDocumentViewListResponse,
  CreateSavedDocumentViewRequest,
  UpdateSavedDocumentViewRequest,
  ReorderSavedDocumentViewsRequest,
  DashboardWidgetType,
  DashboardWidgetDto,
  DashboardLayoutResponse,
  ReplaceDashboardLayoutRequest,
  DashboardStatisticsDto,
  InstallationDashboardDefaultResponse,
} from './workspace.js';

export type {
  SftpFetchHostProbeRequest,
  SftpFetchHostProbeResponse,
  SftpIngressAccountDto,
  SftpIngressCreateAccountRequest,
  SftpIngressCreateAccountResponseDto,
  SftpIngressEventDto,
  SftpIngressEventStatus,
  SftpIngressServerInfoDto,
} from './sftp-ingress.js';

export {
  buildDuplicateFeatureVector,
  compareDocumentTexts,
  duplicatePairDifferenceRows,
  isValueToken,
  normalizeDocumentText,
  tokenizeDocumentText,
} from './duplicate-content-compare.js';
export type {
  ContentAlignmentStats,
  DuplicateCompareDocumentInput,
  DuplicateFeatureVector,
  DuplicatePairContext,
  DuplicatePairDifferenceRow,
} from './duplicate-content-compare.js';
export {
  decideDuplicatePair,
  evaluateModelOnSamples,
  trainDefaultDuplicateClassifierModel,
  VALUE_TOKEN_DIFF_AUTO_STACK_CEILING,
} from './duplicate-classifier.js';
export type { DuplicatePairDecision } from './duplicate-classifier.js';
export {
  DUPLICATE_FEATURE_ORDER,
  binaryMetricsAtThreshold,
  calibrateThresholdForPrecision,
  featureVectorToArray,
  fitUserLogitInterceptDelta,
  predictProbability,
  trainLogisticRegression,
} from './duplicate-logistic-regression.js';
export type {
  BinaryMetrics,
  DuplicateClassifierModel,
  DuplicateTrainingSample,
} from './duplicate-logistic-regression.js';
export { DEFAULT_DUPLICATE_CLASSIFIER_MODEL } from './duplicate-default-model.js';
export { generateSyntheticDuplicateDataset } from './duplicate-synthetic-data.js';
export type { SyntheticDatasetSplit } from './duplicate-synthetic-data.js';
export {
  EXACT_FACT_MATCH_C5_SAMPLES,
  EXACT_FACT_MATCH_PRIOR_STRICT_THRESHOLD,
} from './exact-fact-match-c5.fixture.js';
export {
  EXACT_FACT_MATCH_CALIBRATION,
  EXACT_FACT_MATCH_C5_CALIBRATION_AUDIT,
  EXACT_FACT_MATCH_DEFAULT_THRESHOLD,
} from './exact-fact-match-calibration.js';
export {
  calibrateExactFactMatchThreshold,
  estimateFellegiSunterWeights,
  exactFactFullPredicateMatch,
  exactFactMatchScoreTokens,
  exactFactTokenCoverage,
  fellegiSunterExactFactMatchScore,
  normalizeExactFactMatchText,
  sigmoidMatchScore,
} from './exact-fact-match.js';
export type {
  ExactFactFellegiSunterWeights,
  ExactFactMatchCalibration,
  ExactFactMatchLabeledSample,
  ExactFactThresholdCalibrationResult,
} from './exact-fact-match.js';
export {
  duplicateSetBulkArchiveEligible,
  duplicateSetDisplaySimilarityPercent,
  duplicateSetIdFromDocumentIds,
  duplicateSetMaxSimilarityForDisplay,
  groupDuplicatePairsIntoSets,
  groupDuplicateSetsWithHashSubsets,
  parseDuplicateSetId,
} from './duplicate-set-groups.js';
export type { DuplicatePairEdge, DuplicatePairMetaEdge } from './duplicate-set-groups.js';
