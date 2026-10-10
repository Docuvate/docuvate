// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { z } from 'zod';

export const calibrationThresholdWireSchema = z.object({
  scope: z.string(),
  target_id: z.string(),
  threshold: z.number(),
  lower_bound: z.number(),
  coverage: z.number(),
});

export const classNiwStatsWireSchema = z.object({
  count: z.number().int().nonnegative(),
  sum_x: z.array(z.number()).default([]),
  sum_xx: z.array(z.array(z.number())).default([]),
  sum_x_f32: z.string().optional(),
  sum_xx_f32: z.string().optional(),
});

export const kernelStateWireSchema = z.object({
  bandwidth: z.number(),
  points: z.array(z.array(z.number())),
  label_offsets: z.array(z.array(z.number())),
});

/** Matches worker `float("-inf")` and Postgres `real` default before novelty is fit. */
export const noveltyThresholdWireSchema = z.union([
  z.number().finite(),
  z.literal(Number.NEGATIVE_INFINITY),
]);

export const embeddingDensityWorkerStateSchema = z.object({
  label_ids: z.array(z.string()),
  dim: z.number().int().nonnegative(),
  temperature: z.number(),
  class_bias: z.array(z.number()),
  novelty_threshold: noveltyThresholdWireSchema,
  /** Coarse (0.99) auto-apply tier ready (~2112 labeled documents at default split). */
  coarse_ready: z.boolean(),
  /** Per-label fine (0.95) confirm tier ready (~416 labeled documents per label). */
  fine_ready: z.record(z.string(), z.boolean()),
  label_to_group: z.record(z.string(), z.string()),
  log_priors: z.record(z.string(), z.number()),
  class_stats: z.record(z.string(), classNiwStatsWireSchema),
  coarse_thresholds: z.record(z.string(), calibrationThresholdWireSchema),
  fine_thresholds: z.record(z.string(), calibrationThresholdWireSchema),
  kernel: kernelStateWireSchema,
});

export type CalibrationThresholdWire = z.infer<typeof calibrationThresholdWireSchema>;
export type ClassNiwStatsWire = z.infer<typeof classNiwStatsWireSchema>;
export type KernelStateWire = z.infer<typeof kernelStateWireSchema>;
export type EmbeddingDensityWorkerState = z.infer<typeof embeddingDensityWorkerStateSchema>;

export const embeddingDensityClassifyWireSchema = z.object({
  decision_tier: z.string(),
  confidence: z.number(),
  label_id: z.string().nullable(),
  group_id: z.string().nullable(),
  reason: z.string(),
  log_px: z.number(),
  posterior: z.record(z.string(), z.number()),
  confirm_label_id: z.string().nullable().optional(),
  confirm_confidence: z.number().optional(),
});

export type EmbeddingDensityClassifyWire = z.infer<typeof embeddingDensityClassifyWireSchema>;

export const embeddingDensityTrainWireSchema = z.object({
  state: embeddingDensityWorkerStateSchema,
});

export function parseEmbeddingDensityWorkerState(
  value: unknown
): EmbeddingDensityWorkerState {
  return embeddingDensityWorkerStateSchema.parse(value);
}

export function parseEmbeddingDensityClassifyWire(
  value: unknown
): EmbeddingDensityClassifyWire {
  return embeddingDensityClassifyWireSchema.parse(value);
}
