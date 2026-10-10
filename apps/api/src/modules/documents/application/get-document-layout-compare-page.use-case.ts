// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Injectable } from '@nestjs/common';
import type { AuthorizationSubject } from '../../../shared/domain/authorization.js';
import { GetDocumentContentUseCase } from './get-document-content.use-case.js';
import { GetDocumentLayoutIrUseCase } from './get-document-layout-ir.use-case.js';
import type { LayoutComparePageResult } from './layout-compare.types.js';
import { workerApiUrl } from '../../../shared/infrastructure/worker/worker-api-path.js';
import {
  fetchWorkerJson,
  mapWorkerLayoutHttpStatus,
  workerLayoutTimeoutError,
} from '../../../shared/infrastructure/worker/worker-fetch.js';
import { workerRequestHeaders } from '../../../shared/infrastructure/worker/worker-request-headers.js';

const LAYOUT_COMPARE_TIMEOUT_MS = 180_000;

interface WorkerComparePageResponse {
  pageNumber: number;
  ssim: number;
  inkDeviation: number;
  ssimFloor: number;
  pageReliable: boolean;
  widthPx: number;
  heightPx: number;
  originalPngBase64: string;
  reconstructionPngBase64: string;
  heatmapPngBase64: string | null;
  error: string | null;
}

@Injectable()
export class GetDocumentLayoutComparePageUseCase {
  constructor(
    private readonly getLayoutIr: GetDocumentLayoutIrUseCase,
    private readonly getDocumentContent: GetDocumentContentUseCase
  ) {}

  async execute(
    id: string,
    userId: string,
    subject: AuthorizationSubject,
    pageNumber: number,
    includeHeatmap: boolean
  ): Promise<LayoutComparePageResult> {
    const layoutIr = await this.getLayoutIr.execute(id, userId, subject);
    const { buffer } = await this.getDocumentContent.execute(id, userId, subject);
    const workerUrl = process.env['WORKER_URL'] ?? 'http://localhost:8000';
    const data = await fetchWorkerJson<WorkerComparePageResponse>(
      workerApiUrl(workerUrl, '/layout/compare-page'),
      {
        method: 'POST',
        headers: workerRequestHeaders(),
        body: JSON.stringify({
          layoutIr,
          originalPdfBase64: buffer.toString('base64'),
          pageNumber,
          includeHeatmap,
        }),
      },
      LAYOUT_COMPARE_TIMEOUT_MS,
      {
        onTimeout: workerLayoutTimeoutError,
        onHttpError: mapWorkerLayoutHttpStatus,
      }
    );
    return {
      pageNumber: data.pageNumber,
      ssim: data.ssim,
      inkDeviation: data.inkDeviation,
      ssimFloor: data.ssimFloor,
      pageReliable: data.pageReliable,
      widthPx: data.widthPx,
      heightPx: data.heightPx,
      originalPngBase64: data.originalPngBase64,
      reconstructionPngBase64: data.reconstructionPngBase64,
      heatmapPngBase64: data.heatmapPngBase64,
      error: data.error,
    };
  }
}
