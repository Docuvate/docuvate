// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Injectable } from '@nestjs/common';

import { WorkerDocumentChatProvider } from './worker-document-chat.provider.js';

@Injectable()
export class WorkerContextChatProvider extends WorkerDocumentChatProvider {
  constructor() {
    super('context');
  }
}
