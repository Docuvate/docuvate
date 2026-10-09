import type { PaperlessApiClient } from './paperless-api.client.js';

export interface PaperlessDryRunSummary {
  documentCount: number;
  tagCount: number;
  correspondentCount: number;
  documentTypeCount: number;
  storagePathCount: number;
  customFieldCount: number;
  mappingConflicts: string[];
}

export async function buildPaperlessDryRunSummary(
  client: PaperlessApiClient
): Promise<PaperlessDryRunSummary> {
  const [documents, tags, correspondents, documentTypes, storagePaths, customFields] =
    await Promise.all([
      client.listDocuments({ page: 1, pageSize: 1 }),
      client.listTags(),
      client.listCorrespondents(),
      client.listDocumentTypes(),
      client.listStoragePaths(),
      client.listCustomFields(),
    ]);

  const conflicts: string[] = [];
  const tagNames = new Map<string, number>();
  for (const tag of tags.items) {
    const key = tag.name.trim().toLowerCase();
    const seen = tagNames.get(key);
    if (seen != null && seen !== tag.id) {
      conflicts.push(`tag:${tag.name}`);
    } else {
      tagNames.set(key, tag.id);
    }
  }

  return {
    documentCount: documents.count,
    tagCount: tags.total,
    correspondentCount: correspondents.total,
    documentTypeCount: documentTypes.total,
    storagePathCount: storagePaths.total,
    customFieldCount: customFields.total,
    mappingConflicts: conflicts,
  };
}
