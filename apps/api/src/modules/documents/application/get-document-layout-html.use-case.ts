import { Injectable } from '@nestjs/common';
import { NotFoundError } from '../../../shared/domain/errors.js';
import type { AuthorizationSubject } from '../../../shared/domain/authorization.js';
import { GetDocumentLayoutIrUseCase } from './get-document-layout-ir.use-case.js';
import { workerApiUrl } from '../../../shared/infrastructure/worker/worker-api-path.js';
import {
  fetchWorkerJson,
  mapWorkerLayoutHttpStatus,
  workerLayoutTimeoutError,
} from '../../../shared/infrastructure/worker/worker-fetch.js';
import { workerRequestHeaders } from '../../../shared/infrastructure/worker/worker-request-headers.js';

const LAYOUT_WORKER_TIMEOUT_MS = 120_000;

@Injectable()
export class GetDocumentLayoutHtmlUseCase {
  constructor(private readonly getLayoutIr: GetDocumentLayoutIrUseCase) {}

  async execute(
    id: string,
    userId: string,
    subject: AuthorizationSubject
  ): Promise<string> {
    const layoutIr = await this.getLayoutIr.execute(id, userId, subject);
    const workerUrl = process.env['WORKER_URL'] ?? 'http://localhost:8000';
    const data = await fetchWorkerJson<{ html?: string }>(
      workerApiUrl(workerUrl, '/layout/render-html'),
      {
        method: 'POST',
        headers: workerRequestHeaders(),
        body: JSON.stringify({ layoutIr }),
      },
      LAYOUT_WORKER_TIMEOUT_MS,
      {
        onTimeout: workerLayoutTimeoutError,
        onHttpError: mapWorkerLayoutHttpStatus,
      }
    );
    if (!data.html) {
      throw new NotFoundError('LayoutHtml');
    }
    return data.html;
  }
}
