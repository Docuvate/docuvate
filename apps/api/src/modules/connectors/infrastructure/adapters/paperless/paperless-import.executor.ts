import { createHash } from 'node:crypto';
import { Inject, Injectable, Logger } from '@nestjs/common';
import type { ExtractedField, MatchingAlgorithm } from '@docuvate/contracts';
import {
  CLOCK,
  DOCUMENT_REPOSITORY,
  FOLDER_REPOSITORY,
  ID_GENERATOR,
  OBJECT_STORAGE,
  TAXONOMY_REPOSITORY,
  type Clock,
  type DocumentRepository,
  type FolderRepository,
  type IdGenerator,
  type ObjectStorage,
  type TaxonomyRepository,
} from '../../../../../shared/domain/ports.js';
import { ApplyDuplicateDetectionUseCase } from '../../../../duplicates/application/apply-duplicate-detection.use-case.js';
import { QueueExtractionUseCase } from '../../../../documents/application/queue-extraction.use-case.js';
import { RunDocumentPostOcrPipelineUseCase } from '../../../../document-pipeline/application/run-document-post-ocr-pipeline.use-case.js';
import { SyncDocumentSearchIndexUseCase } from '../../../../search/application/sync-document-search-index.use-case.js';
import type { ConnectorConfigurationInput } from '../../../domain/connector.types.js';
import {
  PaperlessApiClient,
  detectPaperlessApiVersion,
  resolvePaperlessCredentials,
} from './paperless-api.client.js';
import type { PaperlessDocument, PaperlessCustomField } from './paperless-api.types.js';
import {
  formatPaperlessCustomFieldValue,
  mapPaperlessCustomFieldType,
  mergePaperlessNotes,
  paperlessCustomFieldStorageKey,
  paperlessDocumentChecksum,
  type PaperlessOcrMode,
} from './paperless-field-mapping.js';
import { buildPaperlessDryRunSummary } from './paperless-import.dry-run.js';
import type { ConnectorImportRunRow } from './paperless-import.repository.js';
import { PaperlessImportRepository } from './paperless-import.repository.js';

function mapMatchingAlgorithm(value: number): MatchingAlgorithm {
  switch (value) {
    case 1:
      return 'any';
    case 2:
      return 'all';
    case 3:
      return 'exact';
    case 4:
      return 'regex';
    default:
      return 'none';
  }
}

function parseCustomFieldEntries(
  doc: PaperlessDocument
): Array<{ fieldId: number; value: unknown }> {
  const raw = doc.custom_fields;
  if (Array.isArray(raw)) {
    return raw.map((row) => ({ fieldId: Number(row.field), value: row.value }));
  }
  if (raw && typeof raw === 'object') {
    return Object.entries(raw).map(([fieldId, value]) => ({
      fieldId: Number(fieldId),
      value,
    }));
  }
  return [];
}

@Injectable()
export class PaperlessImportExecutor {
  private readonly logger = new Logger(PaperlessImportExecutor.name);

  constructor(
    private readonly imports: PaperlessImportRepository,
    @Inject(DOCUMENT_REPOSITORY) private readonly documents: DocumentRepository,
    @Inject(TAXONOMY_REPOSITORY) private readonly taxonomy: TaxonomyRepository,
    @Inject(FOLDER_REPOSITORY) private readonly folders: FolderRepository,
    @Inject(OBJECT_STORAGE) private readonly storage: ObjectStorage,
    @Inject(ID_GENERATOR) private readonly ids: IdGenerator,
    @Inject(CLOCK) private readonly clock: Clock,
    private readonly queueExtraction: QueueExtractionUseCase,
    private readonly postOcrPipeline: RunDocumentPostOcrPipelineUseCase,
    private readonly syncSearchIndex: SyncDocumentSearchIndexUseCase,
    private readonly applyDuplicateDetection: ApplyDuplicateDetectionUseCase
  ) {}

  async dryRun(
    installationId: string,
    userId: string,
    credentials: ConnectorConfigurationInput
  ): Promise<Record<string, unknown>> {
    const resolved = await resolvePaperlessCredentials(credentials);
    const apiVersion = await detectPaperlessApiVersion(resolved);
    const client = new PaperlessApiClient(resolved, apiVersion);
    const summary = await buildPaperlessDryRunSummary(client);
    return { ...summary, paperlessApiVersion: apiVersion };
  }

  async runImportJob(run: ConnectorImportRunRow, credentials: ConnectorConfigurationInput): Promise<void> {
    const resolved = await resolvePaperlessCredentials(credentials);
    const apiVersion =
      run.paperlessApiVersion ?? (await detectPaperlessApiVersion(resolved));
    const client = new PaperlessApiClient(resolved, apiVersion);

    const firstPage = await client.listDocuments({ page: 1, pageSize: 1 });
    await this.imports.markRunRunning(run.id, apiVersion, firstPage.count);

    const customFieldDefs = (await client.listCustomFields()).items;
    const customFieldById = new Map(customFieldDefs.map((field) => [field.id, field]));

    await this.syncTaxonomyEntities(run.installationId, run.userId, resolved);

    let page = run.resumePage;
    let processed = run.progressProcessed;
    let modifiedCursor = run.resumeModifiedCursor;
    const modifiedGtFilter = run.incrementalModifiedGt?.toISOString();

    while (true) {
      const pageResult = await client.listDocuments({
        page,
        pageSize: 50,
        modifiedGt: modifiedGtFilter,
      });
      if (pageResult.results.length === 0) {
        break;
      }
      for (const row of pageResult.results) {
        try {
          await this.importOneDocument({
            run,
            client,
            doc: row,
            customFieldById,
          });
        } catch (err: unknown) {
          const detail = err instanceof Error ? err.message : String(err);
          const messageKey =
            detail === 'PAPERLESS_DOWNLOAD_TOO_LARGE'
              ? 'connectors.paperlessImport.documentTooLarge'
              : 'connectors.paperlessImport.documentFailed';
          await this.imports.addRunError(
            run.id,
            String(row.id),
            messageKey,
            detail.slice(0, 500)
          );
        }
        processed += 1;
        modifiedCursor = new Date(row.modified);
        await this.imports.updateRunProgress(run.id, {
          progressProcessed: processed,
          resumePage: page,
          resumeModifiedCursor: modifiedCursor,
        });
        await this.rateLimitPause();
      }
      if (!pageResult.next) {
        break;
      }
      page += 1;
    }

    await this.imports.completeRun(run.id, run.installationId, 'completed');
  }

  private async rateLimitPause(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 150));
  }

  private async importOneDocument(input: {
    run: ConnectorImportRunRow;
    client: PaperlessApiClient;
    doc: PaperlessDocument;
    customFieldById: Map<number, PaperlessCustomField>;
  }): Promise<void> {
    const { run, client, doc, customFieldById } = input;
    const checksum = paperlessDocumentChecksum(doc);
    const sourceModified = new Date(doc.modified);
    const existing = await this.imports.findSourceLink(run.installationId, String(doc.id));
    if (
      existing &&
      existing.contentChecksum === checksum &&
      existing.sourceModifiedAt.getTime() === sourceModified.getTime()
    ) {
      return;
    }

    const fullDoc = doc.content != null ? doc : await client.getDocument(doc.id);
    if (existing && existing.contentChecksum === checksum) {
      await this.updateLinkedDocumentMetadata(run, fullDoc, customFieldById);
      await this.imports.upsertSourceLink({
        installationId: run.installationId,
        sourceDocumentId: String(doc.id),
        documentId: existing.documentId,
        contentChecksum: checksum,
        sourceModifiedAt: sourceModified,
      });
      return;
    }

    const fileBuffer = await client.downloadDocument(doc.id, true);
    if (fileBuffer.length === 0) {
      throw new Error('PAPERLESS_DOWNLOAD_FAILED');
    }

    const contentHash = createHash('sha256').update(fileBuffer).digest('hex');
    const filename = fullDoc.original_file_name?.trim() || `${fullDoc.title || doc.id}.bin`;
    const mimeType = fullDoc.mime_type ?? 'application/octet-stream';
    const notes = mergePaperlessNotes(fullDoc.notes);
    const tagIds = await this.resolveTagIds(run, fullDoc);
    const correspondentId = await this.resolveCorrespondentId(run, fullDoc.correspondent);
    const folderId = await this.resolveFolderId(run, fullDoc.storage_path);
    const customFields = await this.buildCustomFields(
      run,
      fullDoc,
      customFieldById,
      run.userId
    );

    let documentId = existing?.documentId;
    if (!documentId) {
      documentId = this.ids.generate();
      const storageKey = `users/${run.userId}/${documentId}/${filename}`;
      await this.storage.putObject(storageKey, fileBuffer, mimeType);
      const inboxTag = await this.taxonomy.ensureInboxTag(run.userId);
      const now = this.clock.now();
      const tagIdList = [...new Set([inboxTag.id, ...tagIds])];
      await this.documents.create({
        id: documentId,
        userId: run.userId,
        filename,
        title: fullDoc.title?.trim() || filename,
        mimeType,
        storageKey,
        status: 'uploaded',
        documentDate: fullDoc.created ? new Date(fullDoc.created) : null,
        notes,
        folderId,
        mappeId: null,
        correspondent: null,
        tags: [inboxTag],
        createdAt: now,
        updatedAt: now,
      });
      await this.documents.setTagsForDocument(documentId, tagIdList);
      if (correspondentId) {
        await this.documents.updateForUser(documentId, run.userId, { correspondentId });
      }
      await this.documents.setContentHash(documentId, contentHash);
      await this.applyDuplicateDetection.execute(documentId, run.userId, contentHash);
    } else {
      const docEntity = await this.documents.findByIdForUser(documentId, run.userId);
      if (!docEntity) {
        throw new Error('DOCUMENT_MISSING');
      }
      await this.storage.putObject(docEntity.storageKey, fileBuffer, mimeType);
      await this.documents.setContentHash(documentId, contentHash);
      await this.documents.updateForUser(documentId, run.userId, {
        title: fullDoc.title?.trim() || filename,
        documentDate: fullDoc.created ? new Date(fullDoc.created) : null,
        notes,
        folderId,
        correspondentId,
        tagIds: [...new Set([(await this.taxonomy.ensureInboxTag(run.userId)).id, ...tagIds])],
        extractionFields: customFields,
      });
    }

    if (run.includeArchivedPdf) {
      try {
        const archived = await client.downloadDocument(doc.id, false);
        if (archived.length > 0) {
          const archivedKey = `users/${run.userId}/${documentId}/paperless-archive.pdf`;
          await this.storage.putObject(archivedKey, archived, 'application/pdf');
          await this.imports.setDocumentArchivedStorageKey(documentId, archivedKey);
        }
      } catch {
        // Archived PDF is optional; ignore failures.
      }
    }

    await this.applyOcrPipeline(run.ocrMode, documentId, run.userId, fullDoc.content ?? '', customFields);

    await this.imports.upsertSourceLink({
      installationId: run.installationId,
      sourceDocumentId: String(doc.id),
      documentId,
      contentChecksum: checksum,
      sourceModifiedAt: new Date(fullDoc.modified),
    });
  }

  private async updateLinkedDocumentMetadata(
    run: ConnectorImportRunRow,
    fullDoc: PaperlessDocument,
    customFieldById: Map<number, PaperlessCustomField>
  ): Promise<void> {
    const existing = await this.imports.findSourceLink(run.installationId, String(fullDoc.id));
    if (!existing) {
      return;
    }
    const documentId = existing.documentId;
    const notes = mergePaperlessNotes(fullDoc.notes);
    const tagIds = await this.resolveTagIds(run, fullDoc);
    const correspondentId = await this.resolveCorrespondentId(run, fullDoc.correspondent);
    const folderId = await this.resolveFolderId(run, fullDoc.storage_path);
    const customFields = await this.buildCustomFields(
      run,
      fullDoc,
      customFieldById,
      run.userId
    );
    const filename = fullDoc.original_file_name?.trim() || `${fullDoc.title || fullDoc.id}.bin`;
    await this.documents.updateForUser(documentId, run.userId, {
      title: fullDoc.title?.trim() || filename,
      documentDate: fullDoc.created ? new Date(fullDoc.created) : null,
      notes,
      folderId,
      correspondentId,
      tagIds: [...new Set([(await this.taxonomy.ensureInboxTag(run.userId)).id, ...tagIds])],
      extractionFields: customFields,
    });
    await this.applyOcrPipeline(run.ocrMode, documentId, run.userId, fullDoc.content ?? '', customFields);
  }

  private async applyOcrPipeline(
    ocrMode: PaperlessOcrMode,
    documentId: string,
    userId: string,
    paperlessText: string,
    fields: ExtractedField[]
  ): Promise<void> {
    if (ocrMode === 'rerun_docuvate') {
      await this.queueExtraction.execute(documentId, userId);
      return;
    }
    const text = paperlessText.trim();
    await this.documents.saveExtraction(documentId, { text, fields, blocks: [] });
    const doc = await this.documents.findByIdForUser(documentId, userId);
    if (doc) {
      await this.syncSearchIndex.execute(userId, documentId, {
        text,
        title: doc.title,
        filename: doc.filename,
      });
    }
    await this.documents.updateStatus(documentId, 'ready');
    if (text.length > 0) {
      await this.postOcrPipeline.execute(documentId, userId, text);
    }
  }

  private async resolveTagIds(run: ConnectorImportRunRow, doc: PaperlessDocument): Promise<string[]> {
    const ids: string[] = [];
    for (const tagId of doc.tags ?? []) {
      const local = await this.imports.findEntityLink(run.installationId, 'tag', tagId);
      if (local) {
        ids.push(local);
      }
    }
    if (doc.document_type != null) {
      const typeTag = await this.imports.findEntityLink(
        run.installationId,
        'document_type',
        doc.document_type
      );
      if (typeTag) {
        ids.push(typeTag);
      }
    }
    return ids;
  }

  private resolveCorrespondentId(
    run: ConnectorImportRunRow,
    correspondentId: number | null
  ): Promise<string | null> {
    if (correspondentId == null) {
      return Promise.resolve(null);
    }
    return this.imports.findEntityLink(run.installationId, 'correspondent', correspondentId);
  }

  private resolveFolderId(
    run: ConnectorImportRunRow,
    storagePathId: number | null
  ): Promise<string | null> {
    if (storagePathId == null) {
      return Promise.resolve(null);
    }
    return this.imports.findEntityLink(run.installationId, 'storage_path', storagePathId);
  }

  private async buildCustomFields(
    run: ConnectorImportRunRow,
    doc: PaperlessDocument,
    defs: Map<number, PaperlessCustomField>,
    userId: string
  ): Promise<ExtractedField[]> {
    const fields: ExtractedField[] = [];
    for (const entry of parseCustomFieldEntries(doc)) {
      const def = defs.get(entry.fieldId);
      if (!def) {
        continue;
      }
      await this.ensureRecognizedField(run, def, userId);
      const storageKey = paperlessCustomFieldStorageKey(def.id, def.name);
      const value = formatPaperlessCustomFieldValue(def.data_type, entry.value);
      fields.push({ key: storageKey, value });
    }
    return fields;
  }

  private async ensureRecognizedField(
    run: ConnectorImportRunRow,
    def: PaperlessCustomField,
    userId: string
  ): Promise<string> {
    const existing = await this.imports.findEntityLink(run.installationId, 'custom_field', def.id);
    if (existing) {
      return existing;
    }
    const key = paperlessCustomFieldStorageKey(def.id, def.name).replace(/^global:/, '');
    const fieldId = await this.imports.ensureRecognizedFieldDefinition(userId, {
      key,
      label: def.name,
      fieldType: mapPaperlessCustomFieldType(def.data_type),
      sortOrder: def.id,
    });
    await this.imports.upsertEntityLink(run.installationId, 'custom_field', def.id, fieldId);
    return fieldId;
  }

  async syncTaxonomyEntities(
    installationId: string,
    userId: string,
    credentials: ConnectorConfigurationInput
  ): Promise<void> {
    const resolved = await resolvePaperlessCredentials(credentials);
    const apiVersion = await detectPaperlessApiVersion(resolved);
    const client = new PaperlessApiClient(resolved, apiVersion);

    const tags = await client.listTags();
    for (const tag of tags.items) {
      const localId = await this.ensureTag(userId, tag);
      await this.imports.upsertEntityLink(installationId, 'tag', tag.id, localId);
    }

    const correspondents = await client.listCorrespondents();
    for (const row of correspondents.items) {
      const localId = await this.ensureCorrespondent(userId, row);
      await this.imports.upsertEntityLink(installationId, 'correspondent', row.id, localId);
    }

    const types = await client.listDocumentTypes();
    for (const row of types.items) {
      const localId = await this.ensureDocumentTypeTag(userId, row);
      await this.imports.upsertEntityLink(installationId, 'document_type', row.id, localId);
    }

    const paths = await client.listStoragePaths();
    for (const row of paths.items) {
      const localId = await this.ensureStorageFolder(userId, row);
      await this.imports.upsertEntityLink(installationId, 'storage_path', row.id, localId);
    }
  }

  private async ensureTag(
    userId: string,
    tag: { id: number; name: string; color: string; matching_algorithm: number; match: string }
  ): Promise<string> {
    const linked = await this.findTagByName(userId, tag.name);
    if (linked) {
      return linked;
    }
    const created = await this.taxonomy.createTag(userId, tag.name, {
      color: tag.color,
      matchingAlgorithm: mapMatchingAlgorithm(tag.matching_algorithm),
      match: tag.match,
    });
    return created.id;
  }

  private async ensureDocumentTypeTag(
    userId: string,
    row: { id: number; name: string; matching_algorithm: number; match: string }
  ): Promise<string> {
    const name = row.name.trim();
    const linked = await this.findTagByName(userId, name);
    if (linked) {
      return linked;
    }
    const created = await this.taxonomy.createTag(userId, name, {
      matchingAlgorithm: mapMatchingAlgorithm(row.matching_algorithm),
      match: row.match,
    });
    return created.id;
  }

  private async ensureCorrespondent(
    userId: string,
    row: { id: number; name: string; matching_algorithm: number; match: string }
  ): Promise<string> {
    const list = await this.taxonomy.listCorrespondents(userId);
    const found = list.find((c) => c.name.localeCompare(row.name, undefined, { sensitivity: 'accent' }) === 0);
    if (found) {
      return found.id;
    }
    const created = await this.taxonomy.createCorrespondent(
      userId,
      row.name,
      mapMatchingAlgorithm(row.matching_algorithm),
      row.match
    );
    return created.id;
  }

  private async ensureStorageFolder(
    userId: string,
    row: { id: number; name: string; path: string }
  ): Promise<string> {
    const folders = await this.folders.listForUser(userId);
    const name = row.name.trim() || row.path.trim() || `Paperless ${row.id}`;
    const found = folders.find((f) => f.name === name && f.parentId == null);
    if (found) {
      return found.id;
    }
    const folderId = this.ids.generate();
    await this.folders.create(folderId, userId, name, null, null);
    return folderId;
  }

  private async findTagByName(userId: string, name: string): Promise<string | null> {
    const tags = await this.taxonomy.listTags(userId);
    const found = tags.find((t) => t.name.localeCompare(name, undefined, { sensitivity: 'accent' }) === 0);
    return found?.id ?? null;
  }
}
