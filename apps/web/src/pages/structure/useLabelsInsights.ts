// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import {
  type DocumentDto,
  type LabelAssignmentInventory,
  type LabelMapCoverageSummaryDto,
  type LabelMapEmptyReason,
  type LabelRecommendationDto,
  summarizeLabelAssignmentInventory,
} from '@docuvate/contracts';
import { useCallback, useMemo, useState } from 'react';

import { prepareLabelQueue } from '../../components/labels/labelsQueue';
import {
  acceptLabelRecommendation,
  deleteTag,
  dismissLabelRecommendation,
  getDocumentReviewQueueSummary,
  getLabelMap,
  listDocuments,
  listLabelRecommendations,
  removeDocumentTag,
} from '../../lib/api';
import { formatUserFacingError } from '../../lib/apiErrors';

function dismissPhrase(item: LabelRecommendationDto): string | undefined {
  if (item.kind === 'assign') {
    return item.nearestTagName ?? item.tagNames?.[0];
  }
  if (item.kind === 'new') {
    return item.proposedName;
  }
  if (item.kind === 'rename') {
    return item.proposedName ?? item.currentName;
  }
  return undefined;
}

function dismissPhrases(item: LabelRecommendationDto): string[] | undefined {
  if (item.kind === 'merge' && item.tagNames?.length) {
    return item.tagNames;
  }
  return undefined;
}

function countDocumentsByTag(documents: DocumentDto[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const doc of documents) {
    for (const tag of doc.tags) {
      if (tag.isInbox) continue;
      counts[tag.id] = (counts[tag.id] ?? 0) + 1;
    }
  }
  return counts;
}

interface LoadOptions {
  silent?: boolean;
}

export interface LabelRecommendationAcceptOptions {
  documentIds: string[];
  excludedDocumentIds: string[];
}

export interface LabelInsightsSaveSuccessOptions {
  message?: string;
  undo?: () => void | Promise<void>;
}

export function useLabelsInsights(
  onReloadTags: (options?: LoadOptions) => Promise<void>,
  hooks?: { onSaveSuccess?: (options?: LabelInsightsSaveSuccessOptions) => void }
) {
  const [recommendations, setRecommendations] = useState<LabelRecommendationDto[]>([]);
  const [documents, setDocuments] = useState<DocumentDto[]>([]);
  const [coverageSummary, setCoverageSummary] = useState<LabelMapCoverageSummaryDto | null>(null);
  const [mapEmptyReason, setMapEmptyReason] = useState<LabelMapEmptyReason | null>(null);
  const [extractedDocumentCount, setExtractedDocumentCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [documentReviewPendingCount, setDocumentReviewPendingCount] = useState(0);

  const documentCountByTagId = useMemo(() => countDocumentsByTag(documents), [documents]);

  const labelInventory = useMemo(
    (): LabelAssignmentInventory => summarizeLabelAssignmentInventory(documents),
    [documents]
  );

  const queueItems = useMemo(
    () => prepareLabelQueue(recommendations, documents),
    [recommendations, documents]
  );

  const load = useCallback(async (options?: LoadOptions) => {
    if (!options?.silent) {
      setLoading(true);
    }
    setError(null);
    try {
      const recsPromise = listLabelRecommendations()
        .then((recs) => {
          setRecommendations(recs);
        })
        .catch((err: unknown) => {
          setError(formatUserFacingError(err, 'errors.recommendationsLoadFailed'));
        });

      const docsPromise = listDocuments({ status: 'ready' })
        .then(setDocuments)
        .catch(() => { setDocuments([]); });

      const mapPromise = getLabelMap()
        .then((map) => {
          setCoverageSummary(map.coverageSummary ?? null);
          setMapEmptyReason(map.emptyReason ?? null);
          setExtractedDocumentCount(map.extractedDocumentCount);
        })
        .catch((err: unknown) => {
          setCoverageSummary(null);
          setMapEmptyReason(null);
          setExtractedDocumentCount(0);
          setError((prev) => prev ?? formatUserFacingError(err, 'errors.labelsInsightsLoadFailed'));
        });

      const reviewPromise = getDocumentReviewQueueSummary()
        .then((summary) => {
          setDocumentReviewPendingCount(summary.pendingCount);
        })
        .catch(() => {
          setDocumentReviewPendingCount(0);
        });

      await Promise.all([recsPromise, docsPromise, mapPromise, reviewPromise]);
    } finally {
      if (!options?.silent) {
        setLoading(false);
      }
    }
  }, []);

  const accept = useCallback(
    async (item: LabelRecommendationDto, options?: LabelRecommendationAcceptOptions) => {
      setBusyId(item.id);
      setError(null);
      setRecommendations((prev) => prev.filter((r) => r.id !== item.id));
      try {
        const assignedDocumentIds = options?.documentIds ?? item.sampleDocumentIds ?? [];
        const assignedTagId = item.tagId;
        let createdTagId: string | null = null;
        if (item.kind === 'assign' && item.tagId) {
          const fallbackIds = item.sampleDocumentIds ?? [];
          await acceptLabelRecommendation(item.id, {
            tagId: item.tagId,
            documentIds: options?.documentIds ?? fallbackIds,
            excludedDocumentIds: options?.excludedDocumentIds,
          });
        } else if (item.kind === 'new') {
          const fallbackIds = item.sampleDocumentIds ?? [];
          const result = await acceptLabelRecommendation(item.id, {
            proposedName: item.proposedName,
            documentIds: options?.documentIds ?? fallbackIds,
            excludedDocumentIds: options?.excludedDocumentIds,
          });
          createdTagId = result.tagId;
        } else if (item.kind === 'merge' && item.tagIds?.length === 2) {
          await acceptLabelRecommendation(item.id, {
            keepTagId: item.tagIds[0],
            removeTagId: item.tagIds[1],
          });
        } else if (item.kind === 'rename') {
          await acceptLabelRecommendation(item.id, {
            tagId: item.tagId,
            proposedName: item.proposedName,
          });
        }
        await Promise.all([onReloadTags({ silent: true }), load({ silent: true })]);
        if (item.kind === 'assign' && assignedTagId && assignedDocumentIds.length > 0) {
          const tagId = assignedTagId;
          const docIds = [...assignedDocumentIds];
          hooks?.onSaveSuccess?.({
            undo: () => {
              void Promise.all(docIds.map((documentId) => removeDocumentTag(documentId, tagId))).then(
                () => Promise.all([onReloadTags({ silent: true }), load({ silent: true })])
              );
            },
          });
        } else if (item.kind === 'new' && createdTagId) {
          const tagId = createdTagId;
          hooks?.onSaveSuccess?.({
            undo: () => {
              void deleteTag(tagId).then(() =>
                Promise.all([onReloadTags({ silent: true }), load({ silent: true })])
              );
            },
          });
        } else if (item.kind === 'new') {
          hooks?.onSaveSuccess?.({});
        } else {
          hooks?.onSaveSuccess?.({});
        }
      } catch (err) {
        setError(formatUserFacingError(err, 'errors.actionFailed'));
        void load({ silent: true });
      } finally {
        setBusyId(null);
      }
    },
    [hooks, load, onReloadTags]
  );

  const dismiss = useCallback(async (item: LabelRecommendationDto, scope: 'local' | 'global') => {
    setBusyId(item.id);
    setRecommendations((prev) => prev.filter((r) => r.id !== item.id));
    try {
      await dismissLabelRecommendation(item.id, {
        blockFuture: scope === 'global',
        phrase: dismissPhrase(item),
        phrases: dismissPhrases(item),
      });
    } catch (err) {
      setError(formatUserFacingError(err, 'errors.dismissFailed'));
      void load({ silent: true });
    } finally {
      setBusyId(null);
    }
  }, [load]);

  return {
    queueItems,
    documentCountByTagId,
    labelInventory,
    coverageSummary,
    mapEmptyReason,
    extractedDocumentCount,
    loading,
    busyId,
    error,
    documentReviewPendingCount,
    load,
    accept,
    dismiss,
  };
}
