// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Global, Module } from '@nestjs/common';
import { OpenapiDocumentService } from './openapi-document.service.js';

@Global()
@Module({
  providers: [OpenapiDocumentService],
  exports: [OpenapiDocumentService],
})
export class OpenapiInfrastructureModule {}
