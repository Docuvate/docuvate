// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { z } from 'zod';
import type { EmbeddingDensityClassNiwEntity } from '../../../shared/infrastructure/database/entities/embedding-density-class-niw.entity.js';
import type { EmbeddingDensityDecisionThresholdEntity } from '../../../shared/infrastructure/database/entities/embedding-density-decision-threshold.entity.js';
import type { EmbeddingDensityUserStateEntity } from '../../../shared/infrastructure/database/entities/embedding-density-user-state.entity.js';
import { EMBEDDING_DENSITY_COARSE_TOP_GROUP_TARGET_ID } from '../domain/embedding-density-constants.js';
import {
  type CalibrationThresholdWire,
  type ClassNiwStatsWire,
  type EmbeddingDensityWorkerState,
  type KernelStateWire,
  calibrationThresholdWireSchema,
  classNiwStatsWireSchema,
  kernelStateWireSchema,
} from '../domain/embedding-density-worker-state.schema.js';

const embeddingVectorSchema = z.array(z.number());

export function classNiwEntityToWire(row: EmbeddingDensityClassNiwEntity): {
  tagId: string;
  stats: ClassNiwStatsWire;
} {
  if (row.sumXF32 && row.sumXxF32) {
    const stats = classNiwStatsWireSchema.parse({
      count: row.sampleCount,
      sum_x: [],
      sum_xx: [],
      sum_x_f32: row.sumXF32.toString('base64'),
      sum_xx_f32: row.sumXxF32.toString('base64'),
    });
    return { tagId: row.tagId, stats };
  }
  const stats = classNiwStatsWireSchema.parse({
    count: row.sampleCount,
    sum_x: row.sumX ?? [],
    sum_xx: row.sumXx ?? [],
  });
  return { tagId: row.tagId, stats };
}

export function thresholdEntityToWire(
  row: EmbeddingDensityDecisionThresholdEntity,
  groupNameById: Map<string, string>
): { key: string; payload: CalibrationThresholdWire; scope: string } {
  let targetId: string | null = null;
  if (row.scope === 'coarse') {
    const groupName = row.groupId ? groupNameById.get(row.groupId) : undefined;
    targetId =
      groupName === EMBEDDING_DENSITY_COARSE_TOP_GROUP_TARGET_ID
        ? EMBEDDING_DENSITY_COARSE_TOP_GROUP_TARGET_ID
        : row.groupId;
  } else {
    targetId = row.tagId;
  }
  if (!targetId) {
    throw new Error('Decision threshold row missing target id');
  }
  const payload = calibrationThresholdWireSchema.parse({
    scope: row.scope,
    target_id: targetId,
    threshold: row.threshold,
    lower_bound: row.lowerBound,
    coverage: 0,
  });
  return { key: targetId, payload, scope: row.scope };
}

export function buildWorkerState(params: {
  userState: EmbeddingDensityUserStateEntity;
  tagIds: string[];
  classRows: EmbeddingDensityClassNiwEntity[];
  thresholds: EmbeddingDensityDecisionThresholdEntity[];
  labelToGroup: Record<string, string>;
  kernel: KernelStateWire;
  groupNameById: Map<string, string>;
}): EmbeddingDensityWorkerState {
  const classStats: Record<string, ClassNiwStatsWire> = {};
  let dim = 0;
  for (const row of params.classRows) {
    const mapped = classNiwEntityToWire(row);
    classStats[mapped.tagId] = mapped.stats;
    dim = mapped.stats.sum_x.length;
  }
  const coarse: Record<string, CalibrationThresholdWire> = {};
  const fine: Record<string, CalibrationThresholdWire> = {};
  for (const thr of params.thresholds) {
    const mapped = thresholdEntityToWire(thr, params.groupNameById);
    if (mapped.scope === 'coarse') {
      coarse[mapped.key] = mapped.payload;
    } else {
      fine[mapped.key] = mapped.payload;
    }
  }
  const labelToGroup = { ...params.labelToGroup };
  for (const tagId of params.tagIds) {
    labelToGroup[tagId] ??= tagId;
  }
  const classBias = embeddingVectorSchema.parse(params.userState.classBias);
  return {
    label_ids: params.tagIds,
    dim,
    temperature: params.userState.temperature,
    class_bias: classBias,
    novelty_threshold: params.userState.noveltyLogThreshold,
    coarse_ready: params.userState.coarseReady,
    fine_ready: Object.fromEntries(
      params.tagIds.map((tagId) => [
        tagId,
        (params.userState.fineReadyTagIds ?? []).includes(tagId),
      ])
    ),
    label_to_group: labelToGroup,
    log_priors: Object.fromEntries(params.tagIds.map((id) => [id, -Math.log(params.tagIds.length)])),
    class_stats: classStats,
    coarse_thresholds: coarse,
    fine_thresholds: fine,
    kernel: params.kernel,
  };
}

export function parseDocumentEmbedding(value: unknown): number[] {
  return embeddingVectorSchema.parse(value);
}
