import type {
  CustomFieldType,
  DocumentBulkAction,
  DocumentListQuery,
  DuplicateCandidateSource,
  ExtractionBlock,
  ExtractionResult,
  ExtractedField,
  MatchingAlgorithm,
} from '@docuvate/contracts';
import type { DocumentEntity, DocumentStatus } from '../../modules/documents/domain/document.entity.js';
import type {
  CorrespondentEntity,
  TagEntity,
  TagSuggestionEntity,
} from '../../modules/taxonomy/domain/taxonomy.entity.js';

export interface Clock {
  now(): Date;
}

export interface IdGenerator {
  generate(): string;
}

export interface UnitOfWork {
  withTransaction<T>(fn: () => Promise<T>): Promise<T>;
}

export interface DocumentUpdatePatch {
  title?: string;
  documentDate?: Date | null;
  notes?: string | null;
  folderId?: string | null;
  mappeId?: string | null;
  correspondentId?: string | null;
  tagIds?: string[];
  extractionFields?: ExtractedField[];
  extractionBlocks?: ExtractionBlock[];
}

export interface DocumentRepository {
  create(doc: DocumentEntity): Promise<DocumentEntity>;
  findById(id: string): Promise<DocumentEntity | null>;
  findByIdForUser(id: string, userId: string): Promise<DocumentEntity | null>;
  listForUser(userId: string, filters?: DocumentListQuery): Promise<DocumentEntity[]>;
  updateStatus(id: string, status: DocumentStatus): Promise<void>;
  saveExtraction(id: string, result: ExtractionResult): Promise<void>;
  updateForUser(id: string, userId: string, patch: DocumentUpdatePatch): Promise<DocumentEntity>;
  deleteForUser(id: string, userId: string): Promise<DocumentEntity>;
  setTagsForDocument(documentId: string, tagIds: string[]): Promise<void>;
  addTagToDocuments(userId: string, documentIds: string[], tagId: string): Promise<number>;
  removeTagFromDocuments(userId: string, documentIds: string[], tagId: string): Promise<number>;
  setCorrespondentForDocuments(
    userId: string,
    documentIds: string[],
    correspondentId: string | null
  ): Promise<number>;
  deleteDocuments(userId: string, documentIds: string[]): Promise<DocumentEntity[]>;
  setContentHash(id: string, hash: string): Promise<void>;
  setFolderForDocuments(
    userId: string,
    documentIds: string[],
    folderId: string | null
  ): Promise<number>;
}

export interface TagWriteOptions {
  color?: string | null;
  isInbox?: boolean;
  matchingAlgorithm?: MatchingAlgorithm;
  match?: string;
}

export interface TaxonomyRepository {
  listTags(userId: string): Promise<TagEntity[]>;
  findTagByIdForUser(id: string, userId: string): Promise<TagEntity | null>;
  createTag(userId: string, name: string, options?: TagWriteOptions): Promise<TagEntity>;
  updateTag(id: string, userId: string, patch: TagWriteOptions & { name?: string }): Promise<TagEntity>;
  deleteTag(id: string, userId: string): Promise<void>;
  mergeTags(userId: string, keepTagId: string, removeTagId: string): Promise<void>;
  ensureInboxTag(userId: string): Promise<TagEntity>;

  listCorrespondents(userId: string): Promise<CorrespondentEntity[]>;
  findCorrespondentByIdForUser(id: string, userId: string): Promise<CorrespondentEntity | null>;
  createCorrespondent(
    userId: string,
    name: string,
    matchingAlgorithm?: MatchingAlgorithm,
    match?: string
  ): Promise<CorrespondentEntity>;
  updateCorrespondent(
    id: string,
    userId: string,
    patch: { name?: string; matchingAlgorithm?: MatchingAlgorithm; match?: string }
  ): Promise<CorrespondentEntity>;
  deleteCorrespondent(id: string, userId: string): Promise<void>;

  listTagsForDocument(documentId: string): Promise<TagEntity[]>;
  assignTagToDocument(documentId: string, tagId: string): Promise<void>;
  removeTagFromDocument(documentId: string, tagId: string): Promise<void>;
  clearInboxTagForDocument(documentId: string, userId: string): Promise<void>;

  listSuggestions(documentId: string, userId: string): Promise<TagSuggestionEntity[]>;
  upsertSuggestion(
    documentId: string,
    tagId: string,
    reason: string,
    options?: { source?: 'rule' | 'embedding'; confidence?: number }
  ): Promise<void>;
  dismissSuggestion(documentId: string, tagId: string): Promise<void>;
  clearSuggestion(documentId: string, tagId: string): Promise<void>;

  setCorrespondentForDocument(documentId: string, correspondentId: string | null): Promise<void>;
}

/** S3-compatible object storage (MinIO today; SeaweedFS or other backends via adapter). */
export interface ObjectStorage {
  putObject(key: string, data: Buffer, mimeType: string): Promise<void>;
  getObject(key: string): Promise<Buffer>;
  deleteObject(key: string): Promise<void>;
}

export interface ExtractionExtractOptions {
  engine?: string;
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

export interface ExtractionPort {
  extract(
    buffer: Buffer,
    mimeType: string,
    options?: ExtractionExtractOptions
  ): Promise<ExtractionResult>;
  listEngines(): Promise<
    Array<{
      id: string;
      label: string;
      description: string;
      available?: boolean;
      arenaEligible?: boolean;
    }>
  >;
  compare(
    buffer: Buffer,
    mimeType: string,
    engines: string[],
    maxPages?: number | null
  ): Promise<{ items: ExtractionCompareItem[]; engines: string[] }>;
}

export interface UserPreferencesEntity {
  userId: string;
  preferredExtractorEngine: string;
  preferredChatProvider: string | null;
  useArenaWinnerAsDefault: boolean;
  arenaWinnerEngine: string | null;
  labelFieldConfidenceThreshold: number;
  /** Learned cosine threshold for Labelraum “near unlabeled” and assign recommendations. */
  labelNearSimilarityThreshold: number;
  /** When true, gated catalog fields need label confidence or assignment (see threshold). */
  fieldExtractionConfidenceGateEnabled: boolean;
  /** All must be assigned on the document before gated extraction (AND). */
  fieldExtractionRequiredLabelIds: string[];
  advancedFeaturesEnabled: boolean;
  themePreference: 'light' | 'dark' | 'system';
  locale: 'de' | 'en' | null;
  updatedAt: Date;
}

export interface UserPreferencesRepository {
  getForUser(userId: string): Promise<UserPreferencesEntity>;
  upsert(
    userId: string,
    patch: {
      preferredExtractorEngine?: string;
      preferredChatProvider?: string | null;
      useArenaWinnerAsDefault?: boolean;
      arenaWinnerEngine?: string | null;
      labelFieldConfidenceThreshold?: number;
      labelNearSimilarityThreshold?: number;
      fieldExtractionConfidenceGateEnabled?: boolean;
      fieldExtractionRequiredLabelIds?: string[];
      advancedFeaturesEnabled?: boolean;
      themePreference?: 'light' | 'dark' | 'system';
      locale?: 'de' | 'en' | null;
    }
  ): Promise<UserPreferencesEntity>;
  recordArenaRating(input: {
    userId: string;
    documentId: string | null;
    winnerEngine: string;
    comparedEngines: string[];
    rating?: number | null;
    source?: 'manual' | 'sample';
    compareSnapshot?: Record<string, unknown> | null;
  }): Promise<void>;
}

export const USER_PREFERENCES_REPOSITORY = Symbol('USER_PREFERENCES_REPOSITORY');

export interface ExtractionFieldCorrectionRecord {
  id: string;
  userId: string;
  documentId: string;
  fieldKey: string;
  oldValue: string;
  newValue: string;
  labelTagIds: string[];
  fieldTagId: string | null;
  source: 'user_correction';
  createdAt: Date;
}

export interface ExtractionFieldFeedbackRepository {
  insertMany(
    userId: string,
    rows: Array<{
      documentId: string;
      fieldKey: string;
      oldValue: string;
      newValue: string;
      labelTagIds: string[];
      fieldTagId: string | null;
    }>
  ): Promise<number>;
  listForUser(
    userId: string,
    options?: { limit?: number; afterCreatedAt?: Date; afterId?: string }
  ): Promise<ExtractionFieldCorrectionRecord[]>;
}

export const EXTRACTION_FIELD_FEEDBACK_REPOSITORY = Symbol(
  'EXTRACTION_FIELD_FEEDBACK_REPOSITORY'
);

export interface TagCustomFieldRecord {
  id: string;
  tagId: string;
  userId: string;
  key: string;
  label: string;
  fieldType: CustomFieldType;
  sortOrder: number;
}

export interface TagCustomFieldRepository {
  listForTag(tagId: string, userId: string): Promise<TagCustomFieldRecord[]>;
  listForUser(userId: string): Promise<TagCustomFieldRecord[]>;
  replaceForTag(
    tagId: string,
    userId: string,
    fields: Array<{
      key: string;
      label: string;
      fieldType: CustomFieldType;
      sortOrder: number;
    }>
  ): Promise<TagCustomFieldRecord[]>;
}

export const TAG_CUSTOM_FIELD_REPOSITORY = Symbol('TAG_CUSTOM_FIELD_REPOSITORY');

export interface RecognizedFieldRecord {
  id: string;
  userId: string;
  key: string;
  label: string;
  fieldType: CustomFieldType;
  sortOrder: number;
  extractForAllDocuments: boolean;
  gateLabelIds: string[];
  gateLabelMatch: 'any' | 'all';
  minLabelConfidence: number | null;
  confidenceGateEnabled: boolean | null;
}

export interface RecognizedFieldRepository {
  listForUser(userId: string): Promise<RecognizedFieldRecord[]>;
  replaceForUser(
    userId: string,
    fields: Array<{
      key: string;
      label: string;
      fieldType: CustomFieldType;
      sortOrder: number;
      extractForAllDocuments: boolean;
      gateLabelIds: string[];
      gateLabelMatch: 'any' | 'all';
      minLabelConfidence: number | null;
      confidenceGateEnabled: boolean | null;
    }>
  ): Promise<RecognizedFieldRecord[]>;
}

export const RECOGNIZED_FIELD_REPOSITORY = Symbol('RECOGNIZED_FIELD_REPOSITORY');

export interface LabelFieldDefinitionInput {
  key: string;
  label: string;
  fieldType: CustomFieldType;
}

export interface LabelFieldExtractionPort {
  extractLabelFields(
    text: string,
    tagName: string,
    fields: LabelFieldDefinitionInput[]
  ): Promise<ExtractedField[]>;
}

export const LABEL_FIELD_EXTRACTION_PORT = Symbol('LABEL_FIELD_EXTRACTION_PORT');

export interface EmbeddingPort {
  embedTexts(texts: string[]): Promise<{ model: string; embeddings: number[][] }>;
}

export interface DocumentEmbeddingReference {
  documentId: string;
  tagIds: string[];
  embedding: number[];
}

export interface TagCentroidRecord {
  tagId: string;
  sampleCount: number;
  centroid: number[];
}

export interface UserDocumentEmbeddingRow {
  documentId: string;
  title: string;
  filename: string;
  embedding: number[];
  nonInboxTagIds: string[];
}

export interface LabelRecommendationBlocklistEntry {
  id: string;
  phrase: string;
  source: 'manual' | 'dismiss';
  createdAt: Date;
}

export interface LabelRecommendationBlocklistPattern {
  id: string;
  pattern: string;
  createdAt: Date;
}

export interface LabelEmbeddingRepository {
  saveDocumentEmbedding(
    documentId: string,
    userId: string,
    model: string,
    embedding: number[]
  ): Promise<void>;
  getDocumentEmbedding(documentId: string): Promise<number[] | null>;
  countExtractedDocumentsForMap(userId: string): Promise<number>;
  listDocumentIdsMissingEmbeddings(userId: string, limit: number): Promise<string[]>;
  listDocumentEmbeddingsForUser(userId: string): Promise<UserDocumentEmbeddingRow[]>;
  listLabeledDocumentEmbeddings(
    userId: string,
    excludeDocumentId: string
  ): Promise<DocumentEmbeddingReference[]>;
  getTagCentroids(userId: string): Promise<TagCentroidRecord[]>;
  listDismissedRecommendationKeys(userId: string): Promise<string[]>;
  dismissRecommendation(userId: string, recommendationKey: string): Promise<void>;
  listRecommendationBlocklist(userId: string): Promise<LabelRecommendationBlocklistEntry[]>;
  addRecommendationBlocklist(
    userId: string,
    phrase: string,
    source: 'manual' | 'dismiss'
  ): Promise<LabelRecommendationBlocklistEntry>;
  removeRecommendationBlocklist(userId: string, entryId: string): Promise<void>;
  listRecommendationBlocklistPatterns(userId: string): Promise<LabelRecommendationBlocklistPattern[]>;
  addRecommendationBlocklistPattern(
    userId: string,
    pattern: string
  ): Promise<LabelRecommendationBlocklistPattern>;
  removeRecommendationBlocklistPattern(userId: string, patternId: string): Promise<void>;
  saveTagCentroid(
    tagId: string,
    userId: string,
    model: string,
    sampleCount: number,
    centroid: number[]
  ): Promise<void>;
  recordFeedback(
    userId: string,
    documentId: string,
    tagId: string,
    action: 'accept' | 'reject'
  ): Promise<void>;
  countRejectionsForTag(userId: string, tagId: string): Promise<number>;
}

export interface SearchPort {
  search(userId: string, query: string, filters?: Omit<DocumentListQuery, 'q'>): Promise<DocumentEntity[]>;
}

export interface PaperlessImportPort {
  importFromPaperless(): Promise<never>;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface DocumentChatContext {
  title: string;
  filename: string;
  text: string;
  fields: ExtractedField[];
}

export interface DocumentChatFilePayload {
  buffer: Buffer;
  mimeType: string;
}

export interface DocumentChatPort {
  chat(
    message: string,
    history: ChatMessage[],
    context: DocumentChatContext,
    options?: {
      providerId?: string;
      file?: DocumentChatFilePayload;
    }
  ): Promise<{
    reply: ChatMessage;
    configured: boolean;
    provider?: string;
    setupHint?: string;
  }>;
}

export type ChatThreadScope = 'document' | 'corpus';

export interface DocumentChatThreadEntity {
  id: string;
  userId: string;
  title: string;
  scope: ChatThreadScope;
  documentIds: string[];
  createdAt: Date;
  updatedAt: Date;
  lastMessagePreview?: string | null;
  activeGenerationStatus?: DocumentChatGenerationStatus | null;
}

export type DocumentChatGenerationStatus = 'pending' | 'streaming' | 'done' | 'failed';

export type DocumentChatGenerationPhase = 'retrieving' | 'generating';

export interface DocumentChatMessageEntity {
  id: string;
  threadId: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: Date;
  updatedAt: Date;
  generationStatus?: DocumentChatGenerationStatus | null;
  generationPhase?: DocumentChatGenerationPhase | null;
  errorCode?: string | null;
  errorDetail?: string | null;
}

export interface DocumentChatMessageGenerationPatch {
  content?: string;
  generationStatus?: DocumentChatGenerationStatus | null;
  generationPhase?: DocumentChatGenerationPhase | null;
  errorCode?: string | null;
  errorDetail?: string | null;
}

export interface DocumentChatThreadRepository {
  listThreadsForDocument(documentId: string, userId: string): Promise<DocumentChatThreadEntity[]>;
  createThread(
    userId: string,
    documentIds: string[],
    options?: { title?: string; scope?: ChatThreadScope }
  ): Promise<DocumentChatThreadEntity>;
  findThreadForUser(threadId: string, userId: string): Promise<DocumentChatThreadEntity | null>;
  assertThreadLinkedToDocument(
    threadId: string,
    documentId: string,
    userId: string
  ): Promise<DocumentChatThreadEntity>;
  listMessages(threadId: string, userId: string): Promise<DocumentChatMessageEntity[]>;
  findMessageForUser(messageId: string, userId: string): Promise<DocumentChatMessageEntity | null>;
  appendMessage(
    threadId: string,
    role: 'user' | 'assistant',
    content: string,
    options?: {
      generationStatus?: DocumentChatGenerationStatus;
      generationPhase?: DocumentChatGenerationPhase;
    }
  ): Promise<DocumentChatMessageEntity>;
  updateMessageGeneration(
    messageId: string,
    patch: DocumentChatMessageGenerationPatch
  ): Promise<DocumentChatMessageEntity>;
  resetMessageForRetry(messageId: string): Promise<DocumentChatMessageEntity>;
  touchThread(threadId: string): Promise<void>;
  updateTitleIfDefault(threadId: string, title: string): Promise<void>;
}

export interface IdentityProviderPort {
  getAuthorizationUrl(): Promise<string>;
  handleCallback(): Promise<never>;
  linkExternalIdentity(): Promise<never>;
}

export interface MappeEntity {
  id: string;
  userId: string;
  name: string;
  color: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface MappeListItem extends MappeEntity {
  documentCount: number;
  folderCount: number;
}

export interface MappeRepository {
  listForUser(userId: string): Promise<MappeListItem[]>;
  findByIdForUser(id: string, userId: string): Promise<MappeEntity | null>;
  create(
    id: string,
    userId: string,
    name: string,
    color: string | null
  ): Promise<MappeEntity>;
  update(
    id: string,
    userId: string,
    patch: { name?: string; color?: string | null }
  ): Promise<MappeEntity>;
  delete(id: string, userId: string): Promise<void>;
}

export interface FolderEntity {
  id: string;
  userId: string;
  name: string;
  parentId: string | null;
  mappeId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface FolderListItem extends FolderEntity {
  documentCount: number;
}

export interface FolderRepository {
  listForUser(userId: string): Promise<FolderListItem[]>;
  findByIdForUser(id: string, userId: string): Promise<FolderEntity | null>;
  create(
    id: string,
    userId: string,
    name: string,
    parentId: string | null,
    mappeId: string | null
  ): Promise<FolderEntity>;
  update(
    id: string,
    userId: string,
    patch: { name?: string; parentId?: string | null; mappeId?: string | null }
  ): Promise<FolderEntity>;
  delete(id: string, userId: string): Promise<void>;
}

export interface DuplicateCandidateEntity {
  id: string;
  userId: string;
  documentId: string;
  candidateDocumentId: string;
  candidateTitle: string;
  candidateFilename: string;
  similarity: number;
  source: DuplicateCandidateSource;
  dismissed: boolean;
}

export interface DuplicateRepository {
  upsertCandidate(
    userId: string,
    documentId: string,
    candidateDocumentId: string,
    similarity: number,
    source: DuplicateCandidateSource
  ): Promise<void>;
  listForDocument(documentId: string, userId: string): Promise<DuplicateCandidateEntity[]>;
  dismiss(documentId: string, candidateDocumentId: string, userId: string): Promise<void>;
  isPairDismissed(
    userId: string,
    documentId: string,
    candidateDocumentId: string
  ): Promise<boolean>;
  countPendingByDocumentIds(
    userId: string,
    documentIds: string[]
  ): Promise<Map<string, number>>;
  findDocumentIdsByHash(
    userId: string,
    hash: string,
    excludeDocumentId: string
  ): Promise<string[]>;
  listDocumentEmbeddings(
    userId: string,
    excludeDocumentId: string
  ): Promise<
    {
      documentId: string;
      embedding: number[];
      filename: string;
      title: string;
      documentDate: Date | null;
      extractedText: string | null;
      extractedFields: unknown;
    }[]
  >;
  listPendingPairs(userId: string): Promise<{ documentId: string; candidateDocumentId: string }[]>;
  listDocumentIdsBySharedHash(userId: string): Promise<string[][]>;
}

export interface DuplicateStackSummary {
  stackId: string;
  versionCount: number;
  pendingReview: boolean;
}

export interface DuplicateStackMemberRow {
  stackId: string;
  documentId: string;
  role: 'primary' | 'version';
  title: string;
  filename: string;
  status: DocumentStatus;
  mimeType: string;
  joinedAt: Date;
}

export interface DuplicateStackRepository {
  syncFromPendingCandidates(userId: string): Promise<void>;
  linkPair(userId: string, documentIdA: string, documentIdB: string): Promise<void>;
  getMembership(
    documentId: string,
    userId: string
  ): Promise<{ stackId: string; role: 'primary' | 'version' } | null>;
  listMembers(stackId: string, userId: string): Promise<DuplicateStackMemberRow[]>;
  summariesForPrimaryDocuments(
    userId: string,
    documentIds: string[]
  ): Promise<Map<string, DuplicateStackSummary>>;
  setPrimary(userId: string, stackId: string, documentId: string): Promise<void>;
  removeMember(userId: string, documentId: string): Promise<void>;
  handleDocumentDeleted(userId: string, documentId: string): Promise<void>;
}

export type { DocumentBulkAction };

export const CLOCK = Symbol('CLOCK');
export const ID_GENERATOR = Symbol('ID_GENERATOR');
export const DOCUMENT_REPOSITORY = Symbol('DOCUMENT_REPOSITORY');
export const TAXONOMY_REPOSITORY = Symbol('TAXONOMY_REPOSITORY');
export const OBJECT_STORAGE = Symbol('OBJECT_STORAGE');
export const EXTRACTION_PORT = Symbol('EXTRACTION_PORT');
export const EMBEDDING_PORT = Symbol('EMBEDDING_PORT');
export const LABEL_EMBEDDING_REPOSITORY = Symbol('LABEL_EMBEDDING_REPOSITORY');
export const SEARCH_PORT = Symbol('SEARCH_PORT');
export const DOCUMENT_CHAT_PORT = Symbol('DOCUMENT_CHAT_PORT');
export const DOCUMENT_CHAT_THREAD_REPOSITORY = Symbol('DOCUMENT_CHAT_THREAD_REPOSITORY');
export const MAPPE_REPOSITORY = Symbol('MAPPE_REPOSITORY');
export const FOLDER_REPOSITORY = Symbol('FOLDER_REPOSITORY');
export const DUPLICATE_REPOSITORY = Symbol('DUPLICATE_REPOSITORY');
export const DUPLICATE_STACK_REPOSITORY = Symbol('DUPLICATE_STACK_REPOSITORY');
export const DOCUMENT_FIELD_VALUE_SYNC = Symbol('DOCUMENT_FIELD_VALUE_SYNC');

export interface DocumentFieldValueSyncPort {
  replaceForDocument(userId: string, documentId: string, fields: ExtractedField[]): Promise<void>;
}
