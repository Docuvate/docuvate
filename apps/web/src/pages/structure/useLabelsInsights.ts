// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import {
  type LabelAssignmentInventory,
  type LabelMapCoverageSummaryDto,
  type LabelMapEmptyReason,
  type LabelRecommendationDto,
} from '@docuvate/contracts';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { prepareLabelQueue } from '../../components/labels/labelsQueue';
import {
  acceptLabelRecommendation,
  deleteTag,
  dismissLabelRecommendation,
  getDocumentReviewQueueSummary,
  getLabelDocumentInventorySummary,
  getLabelMap,
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
  const [coverageSummary, setCoverageSummary] = useState<LabelMapCoverageSummaryDto | null>(null);
  const [mapEmptyReason, setMapEmptyReason] = useState<LabelMapEmptyReason | null>(null);
  const [extractedDocumentCount, setExtractedDocumentCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [recommendationsError, setRecommendationsError] = useState<string | null>(null);
  const [recommendationsWarming, setRecommendationsWarming] = useState(false);
  const [documentReviewPendingCount, setDocumentReviewPendingCount] = useState(0);

  const [documentCountByTagId, setDocumentCountByTagId] = useState<Record<string, number>>({});
  const [labelInventory, setLabelInventory] = useState<LabelAssignmentInventory>({
    total: 0,
    labeled: 0,
    unlabeled: 0,
  });

  const queueItems = useMemo(
    () => prepareLabelQueue(recommendations, []),
    [recommendations]
  );

  const warmPollDelayMsRef = useRef(4_000);
  const warmPollTimeoutRef = useRef<number | null>(null);

  const clearWarmPoll = useCallback(() => {
    if (warmPollTimeoutRef.current !== null) {
      window.clearTimeout(warmPollTimeoutRef.current);
      warmPollTimeoutRef.current = null;
    }
    warmPollDelayMsRef.current = 4_000;
  }, []);

  useEffect(() => () => {
    clearWarmPoll();
  }, [clearWarmPoll]);

  const load = useCallback(async (options?: LoadOptions) => {
    if (!options?.silent) {
      setLoading(true);
    }
    setError(null);
    setRecommendationsError(null);
    try {
      const recsPromise = listLabelRecommendations()
        .then((recs) => {
          setRecommendations(recs.items);
          const warming = recs.state === 'warming';
          setRecommendationsWarming(warming);
          setRecommendationsError(null);
          if (warming) {
            if (warmPollTimeoutRef.current !== null) {
              window.clearTimeout(warmPollTimeoutRef.current);
            }
            const delayMs = warmPollDelayMsRef.current;
            warmPollTimeoutRef.current = window.setTimeout(() => {
              warmPollTimeoutRef.current = null;
              void load({ silent: true });
            }, delayMs);
            warmPollDelayMsRef.current = Math.min(30_000, delayMs * 2);
          } else {
            clearWarmPoll();
          }
        })
        .catch((err: unknown) => {
          setRecommendations([]);
          setRecommendationsWarming(false);
          setRecommendationsError(formatUserFacingError(err, 'errors.recommendationsLoadFailed'));
        });

      const summaryPromise = getLabelDocumentInventorySummary()
        .then((summary) => {
          setDocumentCountByTagId(summary.documentCountByTagId);
          setLabelInventory(summary.inventory);
        })
        .catch(() => {
          setDocumentCountByTagId({});
          setLabelInventory({ total: 0, labeled: 0, unlabeled: 0 });
        });

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

      await Promise.all([recsPromise, summaryPromise, mapPromise, reviewPromise]);
    } finally {
      if (!options?.silent) {
        setLoading(false);
      }
    }
  }, [clearWarmPoll]);

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
    recommendationsError,
    recommendationsWarming,
    documentReviewPendingCount,
    load,
    accept,
    dismiss,
  };
}
