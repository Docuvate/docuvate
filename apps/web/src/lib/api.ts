import type {
  CorrespondentDto,
  CreateCorrespondentRequest,
  CreateTagRequest,
  DocumentBulkRequest,
  CreateDocumentChatThreadRequest,
  DocumentChatMessageRecordDto,
  DocumentChatRequest,
  DocumentChatResponse,
  DocumentChatThreadDto,
  DocumentChatThreadListResponse,
  DocumentChatThreadMessagesResponse,
  SendDocumentChatThreadMessageRequest,
  SendDocumentChatThreadMessageResponse,
  DocumentDto,
  DocumentListQuery,
  DuplicateCandidateDto,
  DuplicateStackDto,
  CreateFolderRequest,
  CreateMappeRequest,
  FolderDto,
  MappeDto,
  UpdateMappeRequest,
  LabelMapResponseDto,
  LabelRecommendationDto,
  LabelRecommendationBlocklistEntryDto,
  LabelRecommendationBlocklistPatternDto,
  LabelRecommendationBlocklistResponse,
  AcceptLabelRecommendationRequest,
  DismissLabelRecommendationRequest,
  AddLabelRecommendationBlocklistRequest,
  ProposeLabelRecommendationBlocklistPatternRequest,
  ProposeLabelRecommendationBlocklistPatternResponse,
  ConfirmLabelRecommendationBlocklistPatternRequest,
  TagDto,
  UpdateFolderRequest,
  UpdateCorrespondentRequest,
  ReplaceTagCustomFieldsRequest,
  ReplaceRecognizedFieldsRequest,
  RecognizedFieldDefinitionDto,
  TagCustomFieldDefinitionDto,
  UpdateDocumentRequest,
  UpdateDocumentResponse,
  UpdateTagRequest,
  DocumentChatProvidersCatalogDto,
  HardwareCapabilitiesDto,
  UpdateUserSettingsRequest,
  UserSettingsDto,
  ExtractionCompareResponse,
  ExtractionEngineInfo,
  ExtractionArenaRatingRequest,
  ConnectorCatalogResponse,
  ConnectorInstallationDto,
  CreateConnectorInstallationRequest,
} from '@docuvate/contracts';
import { throwApiRequestError } from './apiErrors';

function resolveApiBaseUrl(): string {
  const configured =
    import.meta.env.VITE_API_URL ??
    (import.meta.env.PROD ? '/api' : 'http://localhost:3001');
  const normalized = configured.replace(/\/$/, '');
  if (normalized.endsWith('/v1')) {
    return normalized;
  }
  return `${normalized}/v1`;
}

const baseURL = resolveApiBaseUrl();

export function apiBaseUrl(): string {
  return baseURL;
}

export function authHeaders(): Record<string, string> {
  return {};
}

async function request<T>(path: string, init?: RequestInit & { timeoutMs?: number }): Promise<T> {
  const { timeoutMs, ...fetchInit } = init ?? {};
  const headers = new Headers(fetchInit.headers);
  if (fetchInit.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  const signal =
    timeoutMs != null && timeoutMs > 0
      ? AbortSignal.timeout(timeoutMs)
      : fetchInit.signal;
  const response = await fetch(`${baseURL}${path}`, {
    ...fetchInit,
    credentials: 'include',
    headers,
    signal,
  });
  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as Record<string, unknown>;
    throwApiRequestError(response.status, body);
  }
  if (response.status === 204) {
    return undefined as T;
  }
  return response.json() as Promise<T>;
}

function queryString(params: Record<string, string | undefined>): string {
  const q = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') q.set(key, value);
  }
  const s = q.toString();
  return s ? `?${s}` : '';
}

export function documentContentUrl(id: string, download = false): string {
  return `${baseURL}/documents/${id}/content${download ? '?download=1' : ''}`;
}

export async function fetchDocumentContentBlob(id: string): Promise<Blob> {
  const response = await fetch(`${baseURL}/documents/${id}/content`, {
    credentials: 'include',
  });
  if (!response.ok) throw new Error('Vorschau konnte nicht geladen werden');
  return response.blob();
}

export async function listDocuments(filters: DocumentListQuery = {}): Promise<DocumentDto[]> {
  const qs = queryString({
    q: filters.q,
    status: filters.status,
    tagId: filters.tagId,
    tags: filters.tagIds?.length ? filters.tagIds.join(',') : undefined,
    correspondentId: filters.correspondentId,
    inbox: filters.inbox ? 'true' : undefined,
    folderId: filters.folderId,
    mappeId: filters.mappeId,
    unfiled: filters.unfiled ? 'true' : undefined,
    withoutNonInboxLabel: filters.withoutNonInboxLabel ? 'true' : undefined,
    sort: filters.sort,
    order: filters.order,
  });
  const data = await request<{ items: DocumentDto[] }>(`/documents${qs}`);
  return data.items;
}

export async function getDocument(id: string): Promise<DocumentDto> {
  return request<DocumentDto>(`/documents/${id}`);
}

export async function updateDocument(
  id: string,
  body: UpdateDocumentRequest
): Promise<UpdateDocumentResponse> {
  return request(`/documents/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export async function deleteDocument(id: string): Promise<void> {
  await request(`/documents/${id}`, { method: 'DELETE' });
}

export async function requeueDocumentExtraction(documentId: string): Promise<void> {
  await request(`/documents/${documentId}/extraction/requeue`, { method: 'POST' });
}

export async function bulkDocuments(body: DocumentBulkRequest): Promise<{ affected: number }> {
  return request(`/documents/bulk`, { method: 'POST', body: JSON.stringify(body) });
}

export async function uploadDocument(
  file: File,
  placement?: { folderId?: string; mappeId?: string }
): Promise<DocumentDto> {
  const form = new FormData();
  form.append('file', file);
  const params = new URLSearchParams();
  if (placement?.folderId) params.set('folderId', placement.folderId);
  if (placement?.mappeId) params.set('mappeId', placement.mappeId);
  const qs = params.toString();
  const response = await fetch(`${baseURL}/documents${qs ? `?${qs}` : ''}`, {
    method: 'POST',
    body: form,
    credentials: 'include',
  });
  if (!response.ok) {
    const errBody = (await response.json().catch(() => ({}))) as Record<string, unknown>;
    throwApiRequestError(response.status, errBody);
  }
  return response.json() as Promise<DocumentDto>;
}

export async function listTags(): Promise<TagDto[]> {
  const data = await request<{ items: TagDto[] }>('/tags');
  return data.items;
}

export async function createTag(body: CreateTagRequest): Promise<TagDto> {
  return request<TagDto>('/tags', { method: 'POST', body: JSON.stringify(body) });
}

export async function updateTag(id: string, body: UpdateTagRequest): Promise<TagDto> {
  return request<TagDto>(`/tags/${id}`, { method: 'PATCH', body: JSON.stringify(body) });
}

export async function deleteTag(id: string): Promise<void> {
  await request(`/tags/${id}`, { method: 'DELETE' });
}

export async function listLabelRecommendations(): Promise<LabelRecommendationDto[]> {
  const data = await request<{ items: LabelRecommendationDto[] }>('/labels/recommendations');
  return data.items;
}

export async function getLabelMap(): Promise<LabelMapResponseDto> {
  return request<LabelMapResponseDto>('/labels/map');
}

export async function acceptLabelRecommendation(
  recommendationId: string,
  body: Omit<AcceptLabelRecommendationRequest, 'recommendationId'> = {}
): Promise<{ tagId: string; action: string }> {
  return request(`/labels/recommendations/${encodeURIComponent(recommendationId)}/accept`, {
    method: 'POST',
    body: JSON.stringify({ ...body, recommendationId }),
  });
}

export async function dismissLabelRecommendation(
  recommendationId: string,
  body: DismissLabelRecommendationRequest = {}
): Promise<void> {
  await request(`/labels/recommendations/${encodeURIComponent(recommendationId)}/dismiss`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function listLabelRecommendationBlocklist(): Promise<LabelRecommendationBlocklistResponse> {
  return request<LabelRecommendationBlocklistResponse>('/labels/recommendation-blocklist');
}

export async function proposeLabelRecommendationBlocklistPattern(
  phrases: string[]
): Promise<ProposeLabelRecommendationBlocklistPatternResponse> {
  const body: ProposeLabelRecommendationBlocklistPatternRequest = { phrases };
  return request<ProposeLabelRecommendationBlocklistPatternResponse>(
    '/labels/recommendation-blocklist/propose-pattern',
    { method: 'POST', body: JSON.stringify(body) }
  );
}

export async function confirmLabelRecommendationBlocklistPattern(
  pattern: string
): Promise<LabelRecommendationBlocklistPatternDto> {
  const body: ConfirmLabelRecommendationBlocklistPatternRequest = { pattern };
  return request<LabelRecommendationBlocklistPatternDto>(
    '/labels/recommendation-blocklist/patterns',
    { method: 'POST', body: JSON.stringify(body) }
  );
}

export async function removeLabelRecommendationBlocklistPattern(id: string): Promise<void> {
  await request(`/labels/recommendation-blocklist/patterns/${id}`, { method: 'DELETE' });
}

export async function addLabelRecommendationBlocklist(
  phrase: string
): Promise<LabelRecommendationBlocklistEntryDto> {
  const body: AddLabelRecommendationBlocklistRequest = { phrase };
  return request<LabelRecommendationBlocklistEntryDto>('/labels/recommendation-blocklist', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function removeLabelRecommendationBlocklist(id: string): Promise<void> {
  await request(`/labels/recommendation-blocklist/${id}`, { method: 'DELETE' });
}

export async function listCorrespondents(): Promise<CorrespondentDto[]> {
  const data = await request<{ items: CorrespondentDto[] }>('/correspondents');
  return data.items;
}

export async function createCorrespondent(body: CreateCorrespondentRequest): Promise<CorrespondentDto> {
  return request<CorrespondentDto>('/correspondents', { method: 'POST', body: JSON.stringify(body) });
}

export async function updateCorrespondent(
  id: string,
  body: UpdateCorrespondentRequest
): Promise<CorrespondentDto> {
  return request<CorrespondentDto>(`/correspondents/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export async function deleteCorrespondent(id: string): Promise<void> {
  await request(`/correspondents/${id}`, { method: 'DELETE' });
}

export async function listRecognizedFields(): Promise<RecognizedFieldDefinitionDto[]> {
  const data = await request<{ items: RecognizedFieldDefinitionDto[] }>('/recognized-fields');
  return data.items;
}

export async function replaceRecognizedFields(
  body: ReplaceRecognizedFieldsRequest
): Promise<RecognizedFieldDefinitionDto[]> {
  const data = await request<{ items: RecognizedFieldDefinitionDto[] }>('/recognized-fields', {
    method: 'PUT',
    body: JSON.stringify(body),
  });
  return data.items;
}

export async function replaceTagCustomFields(
  tagId: string,
  body: ReplaceTagCustomFieldsRequest
): Promise<TagCustomFieldDefinitionDto[]> {
  const data = await request<{ items: TagCustomFieldDefinitionDto[] }>(
    `/tags/${tagId}/custom-fields`,
    { method: 'PUT', body: JSON.stringify(body) }
  );
  return data.items;
}

async function mutateDocumentTags(
  documentId: string,
  path: string,
  method: 'POST' | 'DELETE'
): Promise<DocumentDto> {
  await request(`${path}`, { method });
  return getDocument(documentId);
}

export function assignDocumentTag(documentId: string, tagId: string): Promise<DocumentDto> {
  return mutateDocumentTags(documentId, `/documents/${documentId}/tags/${tagId}`, 'POST');
}

export function removeDocumentTag(documentId: string, tagId: string): Promise<DocumentDto> {
  return mutateDocumentTags(documentId, `/documents/${documentId}/tags/${tagId}`, 'DELETE');
}

export async function listMappen(): Promise<MappeDto[]> {
  const data = await request<{ items: MappeDto[] }>('/mappen');
  return data.items;
}

export async function createMappe(body: CreateMappeRequest): Promise<MappeDto> {
  return request<MappeDto>('/mappen', { method: 'POST', body: JSON.stringify(body) });
}

export async function updateMappe(id: string, body: UpdateMappeRequest): Promise<MappeDto> {
  return request<MappeDto>(`/mappen/${id}`, { method: 'PATCH', body: JSON.stringify(body) });
}

export async function deleteMappe(id: string): Promise<void> {
  await request(`/mappen/${id}`, { method: 'DELETE' });
}

export async function listFolders(): Promise<FolderDto[]> {
  const data = await request<{ items: FolderDto[] }>('/folders');
  return data.items;
}

export async function createFolder(body: CreateFolderRequest): Promise<FolderDto> {
  return request<FolderDto>('/folders', { method: 'POST', body: JSON.stringify(body) });
}

export async function updateFolder(id: string, body: UpdateFolderRequest): Promise<FolderDto> {
  return request<FolderDto>(`/folders/${id}`, { method: 'PATCH', body: JSON.stringify(body) });
}

export async function deleteFolder(id: string): Promise<void> {
  await request(`/folders/${id}`, { method: 'DELETE' });
}

export async function listDuplicateCandidates(
  documentId: string
): Promise<DuplicateCandidateDto[]> {
  const data = await request<{ items: DuplicateCandidateDto[] }>(
    `/documents/${documentId}/duplicate-candidates`
  );
  return data.items;
}

export async function dismissDuplicateCandidate(
  documentId: string,
  candidateId: string
): Promise<void> {
  await request(`/documents/${documentId}/duplicate-candidates/${candidateId}/dismiss`, {
    method: 'POST',
  });
}

export async function getDuplicateStack(documentId: string): Promise<DuplicateStackDto | null> {
  const data = await request<{ stack: DuplicateStackDto | null }>(
    `/documents/${documentId}/duplicate-stack`
  );
  return data.stack;
}

export async function setDuplicateStackPrimary(
  primaryContextDocumentId: string,
  stackId: string,
  documentId: string
): Promise<DuplicateStackDto | null> {
  const data = await request<{ stack: DuplicateStackDto | null }>(
    `/documents/${primaryContextDocumentId}/duplicate-stack/set-primary`,
    {
      method: 'POST',
      body: JSON.stringify({ stackId, documentId }),
    }
  );
  return data.stack;
}

export async function keepDuplicateStackVersion(
  primaryDocumentId: string,
  versionDocumentId: string
): Promise<DuplicateStackDto | null> {
  const data = await request<{ stack: DuplicateStackDto | null }>(
    `/documents/${primaryDocumentId}/duplicate-stack/keep-version`,
    {
      method: 'POST',
      body: JSON.stringify({ versionDocumentId }),
    }
  );
  return data.stack;
}

export async function markDuplicateStackNotDuplicate(
  primaryDocumentId: string,
  otherDocumentId: string
): Promise<void> {
  await request(`/documents/${primaryDocumentId}/duplicate-stack/not-duplicate`, {
    method: 'POST',
    body: JSON.stringify({ otherDocumentId }),
  });
}

export async function sendDocumentChat(
  documentId: string,
  body: DocumentChatRequest
): Promise<DocumentChatResponse> {
  return request(`/documents/${documentId}/chat`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function listDocumentChatThreads(
  documentId: string
): Promise<DocumentChatThreadDto[]> {
  const data = await request<DocumentChatThreadListResponse>(
    `/documents/${documentId}/chat/threads`
  );
  return data.threads;
}

export async function createDocumentChatThread(
  documentId: string,
  body: CreateDocumentChatThreadRequest = {}
): Promise<DocumentChatThreadDto> {
  const data = await request<{ thread: DocumentChatThreadDto }>(
    `/documents/${documentId}/chat/threads`,
    {
      method: 'POST',
      body: JSON.stringify(body),
    }
  );
  return data.thread;
}

export async function listDocumentChatThreadMessages(
  documentId: string,
  threadId: string
): Promise<DocumentChatMessageRecordDto[]> {
  const data = await request<DocumentChatThreadMessagesResponse>(
    `/documents/${documentId}/chat/threads/${threadId}/messages`
  );
  return data.messages;
}

export async function sendDocumentChatThreadMessage(
  documentId: string,
  threadId: string,
  body: SendDocumentChatThreadMessageRequest
): Promise<SendDocumentChatThreadMessageResponse> {
  return request<SendDocumentChatThreadMessageResponse>(
    `/documents/${documentId}/chat/threads/${threadId}/messages`,
    {
      method: 'POST',
      body: JSON.stringify(body),
    }
  );
}

export async function cancelDocumentChatMessage(
  documentId: string,
  threadId: string,
  messageId: string
): Promise<void> {
  await request<{ ok: boolean }>(
    `/documents/${documentId}/chat/threads/${threadId}/messages/${messageId}/cancel`,
    { method: 'POST' }
  );
}

export async function retryDocumentChatMessage(
  documentId: string,
  threadId: string,
  messageId: string
): Promise<DocumentChatMessageRecordDto> {
  const data = await request<{ message: DocumentChatMessageRecordDto }>(
    `/documents/${documentId}/chat/threads/${threadId}/messages/${messageId}/retry`,
    { method: 'POST' }
  );
  return data.message;
}

export async function getUserSettings(): Promise<UserSettingsDto> {
  return request<UserSettingsDto>('/settings');
}

export async function updateUserSettings(
  body: UpdateUserSettingsRequest
): Promise<UserSettingsDto> {
  return request<UserSettingsDto>('/settings', {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export async function listExtractionEngines(): Promise<ExtractionEngineInfo[]> {
  const data = await request<{ engines: ExtractionEngineInfo[] }>('/settings/extraction-engines');
  return data.engines;
}

export async function getDocumentChatProvidersCatalog(): Promise<DocumentChatProvidersCatalogDto> {
  return request<DocumentChatProvidersCatalogDto>('/settings/chat-providers');
}

export async function getHardwareCapabilities(): Promise<HardwareCapabilitiesDto> {
  return request<HardwareCapabilitiesDto>('/settings/hardware');
}

export async function getConnectorCatalog(): Promise<ConnectorCatalogResponse> {
  return request<ConnectorCatalogResponse>('/connectors/catalog');
}

export async function listConnectorInstallations(): Promise<ConnectorInstallationDto[]> {
  const data = await request<{ installations: ConnectorInstallationDto[] }>(
    '/connectors/installations'
  );
  return data.installations;
}

export async function createConnectorInstallation(
  body: CreateConnectorInstallationRequest
): Promise<ConnectorInstallationDto> {
  return request<ConnectorInstallationDto>('/connectors/installations', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function deleteConnectorInstallation(installationId: string): Promise<void> {
  await request<void>(`/connectors/installations/${encodeURIComponent(installationId)}`, {
    method: 'DELETE',
  });
}

export async function startConnectorOAuth(
  pluginId: 'gmail' | 'outlook',
  body: { displayName: string; accountHint?: string }
): Promise<{ authorizationUrl: string }> {
  return request<{ authorizationUrl: string }>(
    `/connectors/oauth/${encodeURIComponent(pluginId)}/start`,
    {
      method: 'POST',
      body: JSON.stringify(body),
    }
  );
}

export async function compareDocumentExtraction(
  documentId: string,
  body: { engines?: string[]; maxPages?: number }
): Promise<ExtractionCompareResponse> {
  return request<ExtractionCompareResponse>(`/documents/${documentId}/extraction/compare`, {
    method: 'POST',
    body: JSON.stringify(body),
    timeoutMs: 180_000,
  });
}

export async function submitExtractionArenaRating(
  documentId: string,
  body: ExtractionArenaRatingRequest
): Promise<void> {
  await request(`/documents/${documentId}/extraction/arena-rating`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export { baseURL };
