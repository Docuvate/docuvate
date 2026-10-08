import { Injectable } from '@nestjs/common';
import type { OpenAPIObject } from '@nestjs/swagger/dist/interfaces/open-api-spec.interface.js';

@Injectable()
export class OpenapiDocumentService {
  private document: OpenAPIObject | null = null;

  setDocument(document: OpenAPIObject): void {
    this.document = document;
  }

  getDocument(): OpenAPIObject {
    if (!this.document) {
      throw new Error('OpenAPI document not initialized');
    }
    return this.document;
  }
}
