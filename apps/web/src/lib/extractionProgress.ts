import type { DocumentDto } from '@docuvate/contracts';
import i18n from '../i18n';
import { isExtractionPending } from './documentExtractionState';

/** Pipeline has no numeric progress; stages are inferred from status + partial extraction. */
export type ExtractionProgressMode = 'staged';

export type ExtractionProgressStageId = 'queue' | 'ocr' | 'labels' | 'fields';

export interface ExtractionProgressSnapshot {
  mode: ExtractionProgressMode;
  stageId: ExtractionProgressStageId;
  stageIndex: number;
  stageCount: number;
  stageLabel: string;
  stepLabel: string;
  percent: number;
  /** True when duration of the current stage cannot be estimated (OCR). */
  indeterminate: boolean;
}

const STAGE_ORDER: ExtractionProgressStageId[] = ['queue', 'ocr', 'labels', 'fields'];

const STAGE_LABEL_KEYS: Record<ExtractionProgressStageId, string> = {
  queue: 'extraction.stage.queue',
  ocr: 'extraction.stage.ocr',
  labels: 'extraction.stage.labels',
  fields: 'extraction.stage.fields',
};

function stageLabel(stageId: ExtractionProgressStageId): string {
  return i18n.t(STAGE_LABEL_KEYS[stageId]);
}

const STAGE_PERCENT: Record<ExtractionProgressStageId, number> = {
  queue: 12,
  ocr: 38,
  labels: 68,
  fields: 88,
};

function hasOcrPayload(doc: Pick<DocumentDto, 'extraction'>): boolean {
  const text = doc.extraction?.text?.trim() ?? '';
  if (text.length > 0) return true;
  const blocks = doc.extraction?.blocks?.length ?? 0;
  if (blocks > 0) return true;
  const fields = doc.extraction?.fields?.length ?? 0;
  return fields > 0;
}

function hasLabelSignals(doc: Pick<DocumentDto, 'tags' | 'tagSuggestions'>): boolean {
  if (doc.tags.length > 0) return true;
  return (doc.tagSuggestions?.length ?? 0) > 0;
}

export function resolveExtractionProgressStage(
  doc: Pick<DocumentDto, 'status' | 'extraction' | 'tags' | 'tagSuggestions'>
): ExtractionProgressStageId | null {
  if (!isExtractionPending(doc.status)) {
    return null;
  }
  if (doc.status === 'uploaded' || doc.status === 'queued') {
    return 'queue';
  }
  if (!hasOcrPayload(doc)) {
    return 'ocr';
  }
  if (!hasLabelSignals(doc)) {
    return 'labels';
  }
  return 'fields';
}

export function extractionProgressSnapshot(
  doc: Pick<DocumentDto, 'status' | 'extraction' | 'tags' | 'tagSuggestions'>
): ExtractionProgressSnapshot | null {
  const stageId = resolveExtractionProgressStage(doc);
  if (!stageId) {
    return null;
  }
  const stageIndex = STAGE_ORDER.indexOf(stageId);
  const stageCount = STAGE_ORDER.length;
  return {
    mode: 'staged',
    stageId,
    stageIndex,
    stageCount,
    stageLabel: stageLabel(stageId),
    stepLabel: i18n.t('extraction.stepOf', {
      current: stageIndex + 1,
      total: stageCount,
    }),
    percent: STAGE_PERCENT[stageId],
    indeterminate: stageId === 'ocr',
  };
}

/** Keep displayed percent monotonic across polls (stages only move forward). */
export function monotonicExtractionPercent(
  previousMax: number,
  snapshot: ExtractionProgressSnapshot | null
): number {
  if (!snapshot) {
    return previousMax;
  }
  return Math.max(previousMax, snapshot.percent);
}
