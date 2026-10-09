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

export interface ExtractionResult {
  text: string;
  fields: ExtractedField[];
  blocks?: ExtractionBlock[];
  /** Layout-aware Markdown when the worker produces it (plain `text` unchanged for search/embeddings). */
  markdown?: string;
  /** Persisted on extraction save; not included on document GET payloads. */
  layoutIr?: LayoutIrDocument;
  /** True when persisted layout IR exists (fetch via GET /documents/:id/layout-ir). */
  layoutIrAvailable?: boolean;
  /** Page dimensions from persisted layout IR (no block payload). */
  layoutIrPages?: LayoutIrPageSummary[];
}

export interface MappeDto {
  id: string;
  name: string;
  color?: string | null;
  documentCount?: number;
  folderCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMappeRequest {
  name: string;
  color?: string | null;
}

export interface UpdateMappeRequest {
  name?: string;
  color?: string | null;
}

export interface FolderDto {
  id: string;
  name: string;
  parentId?: string | null;
  mappeId?: string | null;
  documentCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFolderRequest {
  name: string;
  parentId?: string | null;
  mappeId?: string | null;
}

export interface UpdateFolderRequest {
  name?: string;
  parentId?: string | null;
  mappeId?: string | null;
}

export type DuplicateCandidateSource = 'hash' | 'embedding';

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

export type TagSuggestionSource = 'rule' | 'embedding';

export interface TagSuggestionDto {
  tag: TagDto;
  reason: string;
  confidence?: number;
  source?: TagSuggestionSource;
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

export type ChatThreadScope = 'document' | 'corpus';

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

export type DocumentChatGenerationPhase = 'retrieving' | 'generating';

export type DocumentChatGenerationErrorCode =
  | 'generation_timeout'
  | 'worker_unreachable'
  | 'ollama_error'
  | 'cancelled'
  | 'provider_unavailable'
  | 'unknown';

export interface DocumentChatMessageRecordDto extends ChatMessageDto {
  id: string;
  createdAt: string;
  updatedAt?: string;
  generationStatus?: DocumentChatGenerationStatus | null;
  generationPhase?: DocumentChatGenerationPhase | null;
  errorCode?: DocumentChatGenerationErrorCode | string | null;
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
  mimeType: string;
  documentDate?: string | null;
  notes?: string | null;
  folderId?: string | null;
  mappeId?: string | null;
  folder?: Pick<FolderDto, 'id' | 'name'> | null;
  correspondent?: CorrespondentDto | null;
  tags: TagDto[];
  tagSuggestions?: TagSuggestionDto[];
  duplicateCandidateCount?: number;
  duplicateStack?: DocumentDuplicateStackSummaryDto | null;
  createdAt: string;
  updatedAt: string;
  extraction?: ExtractionResult;
}

export interface UpdateDocumentRequest {
  title?: string;
  documentDate?: string | null;
  notes?: string | null;
  folderId?: string | null;
  /** Direct mappe placement (no subfolder). Mutually exclusive with folderId. */
  mappeId?: string | null;
  correspondentId?: string | null;
  tagIds?: string[];
  extractionFields?: ExtractedField[];
  extractionBlocks?: ExtractionBlock[];
}

export interface UpdateDocumentResponse {
  document: DocumentDto;
  /** Count of field-value corrections persisted as extraction training feedback. */
  fieldCorrectionsRecorded?: number;
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
  | { action: 'setCorrespondent'; correspondentId: string | null }
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
}

export type LabelMapEmptyReason =
  | 'no_extracted_documents'
  | 'awaiting_embeddings'
  | 'embedding_unavailable';

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

export interface ApiErrorEnvelope {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export type DocumentSortField = 'updatedAt' | 'createdAt' | 'title' | 'documentDate';
export type SortOrder = 'asc' | 'desc';

export interface DocumentListQuery {
  q?: string;
  status?: DocumentStatus;
  tagId?: string;
  /** Comma-separated in query; documents must have all listed tags. */
  tagIds?: string[];
  correspondentId?: string;
  folderId?: string;
  mappeId?: string;
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
}

export type ExtractorEngineId =
  | 'pipeline'
  | 'paddle'
  | 'docling'
  | 'pdf_native'
  | 'tesseract';

export interface ExtractionEngineInfo {
  id: ExtractorEngineId | string;
  label: string;
  description: string;
  available?: boolean;
  arenaEligible?: boolean;
}

export type DocumentChatProviderId =
  | 'mock'
  | 'context'
  | 'rag-ollama'
  | 'ollama'
  | 'donut-ml'
  | 'off';

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
}

export interface ReplaceTagCustomFieldsRequest {
  fields: Array<{
    key: string;
    label: string;
    fieldType?: CustomFieldType;
    sortOrder?: number;
  }>;
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

export type ConnectorCategoryId = 'mail' | 'dms' | 'home_automation' | 'storage';

export type ConnectorPluginId =
  | 'gmail'
  | 'outlook'
  | 'paperless'
  | 'home_assistant'
  | 'amazon_s3';

export type ConnectorCapabilityRole = 'source' | 'sink';

export type ConnectorAuthStrategyKind =
  | 'oauth2'
  | 'bearer'
  | 'basic'
  | 'api_key'
  | 'custom';

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
  createdAt: string;
  updatedAt: string;
}

export interface CreateConnectorInstallationRequest {
  pluginId: ConnectorPluginId;
  displayName: string;
  credentials: Record<string, string>;
}

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

export type GlobalSearchScopeType =
  | 'documents'
  | 'folders'
  | 'labels'
  | 'settings'
  | 'actions';

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
