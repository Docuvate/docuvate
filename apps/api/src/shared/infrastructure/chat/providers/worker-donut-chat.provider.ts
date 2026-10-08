import { Injectable } from '@nestjs/common';
import { WorkerDocumentChatProvider } from './worker-document-chat.provider.js';

@Injectable()
export class WorkerDonutChatProvider extends WorkerDocumentChatProvider {
  constructor() {
    super('donut-ml');
  }
}
