// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Injectable } from '@nestjs/common';
import type { AuthorizationSubject } from '../../../shared/domain/authorization.js';
import { GetDocumentContentUseCase } from './get-document-content.use-case.js';
import { GetDocumentLayoutIrUseCase } from './get-document-layout-ir.use-case.js';
import type { LayoutCompareMetricsResult } from './layout-compare.types.js';
import { workerApiUrl } from '../../../shared/infrastructure/worker/worker-api-path.js';
import {
  fetchWorkerJson,
  mapWorkerLayoutHttpStatus,
  workerLayoutTimeoutError,
} from '../../../shared/infrastructure/worker/worker-fetch.js';
import { workerRequestHeaders } from '../../../shared/infrastructure/worker/worker-request-headers.js';

const LAYOUT_COMPARE_TIMEOUT_MS = 180_000;

interface WorkerCompareMetricsResponse {
  category: string;
  ssimFloor: number;
  pages: Array<{
    pageNumber: number;
    ssim: number | null;
    inkDeviation: number | null;
    pageReliable: boolean;
    error: string | null;
  }>;
}

@Injectable()
export class GetDocumentLayoutCompareMetricsUseCase {
  constructor(
    private readonly getLayoutIr: GetDocumentLayoutIrUseCase,
    private readonly getDocumentContent: GetDocumentContentUseCase
  ) {}

  async execute(
    id: string,
    userId: string,
    subject: AuthorizationSubject
  ): Promise<LayoutCompareMetricsResult> {
    const layoutIr = await this.getLayoutIr.execute(id, userId, subject);
    const { buffer } = await this.getDocumentContent.execute(id, userId, subject);
    const workerUrl = process.env['WORKER_URL'] ?? 'http://localhost:8000';
    const data = await fetchWorkerJson<WorkerCompareMetricsResponse>(
      workerApiUrl(workerUrl, '/layout/compare-metrics'),
      {
        method: 'POST',
        headers: workerRequestHeaders(),
        body: JSON.stringify({
          layoutIr,
          originalPdfBase64: buffer.toString('base64'),
        }),
      },
      LAYOUT_COMPARE_TIMEOUT_MS,
      {
        onTimeout: workerLayoutTimeoutError,
        onHttpError: mapWorkerLayoutHttpStatus,
      }
    );
    return {
      category: data.category,
      ssimFloor: data.ssimFloor,
      pages: data.pages.map((row) => ({
        pageNumber: row.pageNumber,
        ssim: row.ssim,
        inkDeviation: row.inkDeviation,
        pageReliable: row.pageReliable,
        error: row.error,
      })),
    };
  }
}
