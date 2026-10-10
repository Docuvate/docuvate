// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Injectable } from '@nestjs/common';
import type { AuthorizationSubject } from '../../../shared/domain/authorization.js';
import { ValidationError } from '../../../shared/domain/errors.js';
import { GetDocumentContentUseCase } from './get-document-content.use-case.js';
import { GetDocumentLayoutIrUseCase } from './get-document-layout-ir.use-case.js';
import {
  LAYOUT_COMPARE_MAX_METRICS_BATCH,
  layoutComparePageNumbersInRange,
} from './layout-compare.constants.js';
import type { LayoutCompareMetricsResult } from './layout-compare.types.js';
import { workerLayoutCompareMetrics } from '../../../shared/infrastructure/worker/layout-compare-worker.client.js';
import { layoutCompareMetricsWorkerSchema } from '../../../shared/infrastructure/worker/layout-compare-worker.schema.js';

@Injectable()
export class GetDocumentLayoutCompareMetricsUseCase {
  constructor(
    private readonly getLayoutIr: GetDocumentLayoutIrUseCase,
    private readonly getDocumentContent: GetDocumentContentUseCase
  ) {}

  async execute(
    id: string,
    userId: string,
    subject: AuthorizationSubject,
    from?: number,
    to?: number
  ): Promise<LayoutCompareMetricsResult> {
    const layoutIr = await this.getLayoutIr.execute(id, userId, subject);
    const pageCount = layoutIr.pages.length;
    const pageNumbers = layoutComparePageNumbersInRange(pageCount, from, to);
    if (pageNumbers.length === 0) {
      throw new ValidationError('Ungültiger Seitenbereich für Layout-Vergleich.');
    }
    if (pageNumbers.length > LAYOUT_COMPARE_MAX_METRICS_BATCH) {
      throw new ValidationError('Zu viele Seiten in einer Metrik-Anfrage.');
    }
    const { buffer } = await this.getDocumentContent.execute(id, userId, subject);
    const workerUrl = process.env['WORKER_URL'] ?? 'http://localhost:8000';
    const data = await workerLayoutCompareMetrics(
      workerUrl,
      layoutIr,
      buffer.toString('base64'),
      pageNumbers,
      layoutCompareMetricsWorkerSchema
    );
    return {
      category: data.category,
      ssimFloor: data.ssimFloor,
      pageCount: data.pageCount,
      pages: data.pages.map((row) => ({
        pageNumber: row.pageNumber,
        ssim: row.ssim,
        inkDeviation: row.inkDeviation,
        pageReliable: row.pageReliable,
        errorCode: row.errorCode,
      })),
    };
  }
}
