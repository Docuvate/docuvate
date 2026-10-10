// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Injectable } from '@nestjs/common';

import type { AuthorizationSubject } from '../../../shared/domain/authorization.js';
import { NotFoundError } from '../../../shared/domain/errors.js';
import {
  isRecord,
  parseBoolean,
  parseOptionalString,
  parseString,
} from '../../../shared/infrastructure/database/row-parse.js';
import { workerApiUrl } from '../../../shared/infrastructure/worker/worker-api-path.js';
import {
  fetchWorkerJson,
  mapWorkerLayoutHttpStatus,
  workerLayoutTimeoutError,
} from '../../../shared/infrastructure/worker/worker-fetch.js';
import { workerRequestHeaders } from '../../../shared/infrastructure/worker/worker-request-headers.js';
import { GetDocumentContentUseCase } from './get-document-content.use-case.js';
import { GetDocumentLayoutIrUseCase } from './get-document-layout-ir.use-case.js';
import type { LayoutTypstExportMode, LayoutTypstRenderResult } from './layout-render.types.js';

const LAYOUT_WORKER_TIMEOUT_MS = 120_000;

@Injectable()
export class GetDocumentLayoutTypstUseCase {
  constructor(
    private readonly getLayoutIr: GetDocumentLayoutIrUseCase,
    private readonly getDocumentContent: GetDocumentContentUseCase
  ) {}

  async execute(
    id: string,
    userId: string,
    subject: AuthorizationSubject,
    mode: LayoutTypstExportMode = 'exakt'
  ): Promise<LayoutTypstRenderResult> {
    const layoutIr = await this.getLayoutIr.execute(id, userId, subject);
    const { buffer } = await this.getDocumentContent.execute(id, userId, subject);
    const workerUrl = process.env.WORKER_URL ?? 'http://localhost:8000';
    const raw = await fetchWorkerJson(
      workerApiUrl(workerUrl, '/layout/render-typst'),
      {
        method: 'POST',
        headers: workerRequestHeaders(),
        body: JSON.stringify({
          layoutIr,
          originalPdfBase64: buffer.toString('base64'),
          mode,
        }),
      },
      LAYOUT_WORKER_TIMEOUT_MS,
      {
        onTimeout: workerLayoutTimeoutError,
        onHttpError: mapWorkerLayoutHttpStatus,
      }
    );
    if (!isRecord(raw)) {
      throw new NotFoundError('LayoutTypst');
    }
    const typst = parseString(raw.typst).trim();
    if (!typst) {
      throw new NotFoundError('LayoutTypst');
    }
    return {
      typst,
      exportMode: mode,
      reconstructionReliable: raw.reconstructionReliable === undefined
        ? true
        : parseBoolean(raw.reconstructionReliable),
      unreliableReason: parseOptionalString(raw.unreliableReason),
    };
  }
}
