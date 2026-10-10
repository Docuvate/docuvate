// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Injectable } from '@nestjs/common';

import type { AuthorizationSubject } from '../../../shared/domain/authorization.js';
import { workerLayoutCompareSummary } from '../../../shared/infrastructure/worker/layout-compare-worker.client.js';
import {
  layoutCompareSummaryWorkerSchema,
} from '../../../shared/infrastructure/worker/layout-compare-worker.schema.js';
import { GetDocumentContentUseCase } from './get-document-content.use-case.js';
import { GetDocumentLayoutIrUseCase } from './get-document-layout-ir.use-case.js';
import type { LayoutCompareSummaryResult } from './layout-compare.types.js';

@Injectable()
export class GetDocumentLayoutCompareSummaryUseCase {
  constructor(
    private readonly getLayoutIr: GetDocumentLayoutIrUseCase,
    private readonly getDocumentContent: GetDocumentContentUseCase
  ) {}

  async execute(
    id: string,
    userId: string,
    subject: AuthorizationSubject
  ): Promise<LayoutCompareSummaryResult> {
    const layoutIr = await this.getLayoutIr.execute(id, userId, subject);
    const { buffer } = await this.getDocumentContent.execute(id, userId, subject);
    const workerUrl = process.env.WORKER_URL ?? 'http://localhost:8000';
    const data = await workerLayoutCompareSummary(
      workerUrl,
      layoutIr,
      buffer.toString('base64'),
      layoutCompareSummaryWorkerSchema
    );
    return {
      category: data.category,
      ssimFloor: data.ssimFloor,
      pageCount: data.pageCount,
    };
  }
}
