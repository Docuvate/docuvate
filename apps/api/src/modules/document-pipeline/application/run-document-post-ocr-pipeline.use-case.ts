// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Injectable } from '@nestjs/common';
import { DocumentPipelineRegistry } from './document-pipeline.registry.js';

@Injectable()
export class RunDocumentPostOcrPipelineUseCase {
  constructor(private readonly registry: DocumentPipelineRegistry) {}

  async execute(documentId: string, userId: string, content: string): Promise<void> {
    await this.registry.runPostOcr({ documentId, userId, content });
  }

  listModuleDescriptors() {
    return this.registry.listDescriptors();
  }
}
