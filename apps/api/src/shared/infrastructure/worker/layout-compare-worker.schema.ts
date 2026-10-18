// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { z } from 'zod';

export const layoutCompareSummaryWorkerSchema = z.object({
  category: z.string(),
  ssimFloor: z.number(),
  pageCount: z.number().int().positive(),
});

export const layoutComparePageMetricWorkerSchema = z.object({
  pageNumber: z.number().int().positive(),
  ssim: z.number().nullable(),
  inkDeviation: z.number().nullable(),
  pageReliable: z.boolean(),
  errorCode: z.string().nullable(),
});

export const layoutCompareMetricsWorkerSchema = z.object({
  category: z.string(),
  ssimFloor: z.number(),
  pageCount: z.number().int().positive(),
  pages: z.array(layoutComparePageMetricWorkerSchema),
});

export const layoutComparePageWorkerSchema = z.object({
  pageNumber: z.number().int().positive(),
  ssim: z.number().nullable(),
  inkDeviation: z.number().nullable(),
  ssimFloor: z.number(),
  pageReliable: z.boolean(),
  widthPx: z.number().int().nonnegative(),
  heightPx: z.number().int().nonnegative(),
  originalPngBase64: z.string(),
  reconstructionPngBase64: z.string(),
  heatmapPngBase64: z.string().nullable(),
  errorCode: z.string().nullable(),
});

export type LayoutCompareSummaryWorker = z.infer<typeof layoutCompareSummaryWorkerSchema>;
export type LayoutCompareMetricsWorker = z.infer<typeof layoutCompareMetricsWorkerSchema>;
export type LayoutComparePageWorker = z.infer<typeof layoutComparePageWorkerSchema>;
