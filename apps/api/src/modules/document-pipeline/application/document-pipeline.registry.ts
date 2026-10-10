// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Injectable } from '@nestjs/common';

import type {
  DocumentPipelineContext,
  DocumentPipelineModule,
  DocumentPipelineModuleDescriptor,
  DocumentPipelineModuleId,
} from '../domain/document-pipeline.types.js';

@Injectable()
export class DocumentPipelineRegistry {
  private readonly modules: DocumentPipelineModule[] = [];

  register(module: DocumentPipelineModule): void {
    this.modules.push(module);
  }

  listDescriptors(): DocumentPipelineModuleDescriptor[] {
    return [...this.modules]
      .map((m) => m.descriptor)
      .sort((a, b) => a.defaultOrder - b.defaultOrder);
  }

  async runPostOcr(context: DocumentPipelineContext): Promise<void> {
    const ordered = [...this.modules].sort(
      (a, b) => a.descriptor.defaultOrder - b.descriptor.defaultOrder
    );
    for (const module of ordered) {
      if (!module.descriptor.defaultEnabled) {
        continue;
      }
      await module.run(context);
    }
  }

  getModule(id: DocumentPipelineModuleId): DocumentPipelineModule | undefined {
    return this.modules.find((m) => m.descriptor.id === id);
  }
}
