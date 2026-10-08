import { Injectable } from '@nestjs/common';
import { WorkerDocumentChatProvider } from './worker-document-chat.provider.js';

@Injectable()
export class WorkerContextChatProvider extends WorkerDocumentChatProvider {
  constructor() {
    super('context');
  }
}
