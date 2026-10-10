// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Global, Module } from '@nestjs/common';

import { OpenapiDocumentService } from './openapi-document.service.js';

@Global()
@Module({
  providers: [OpenapiDocumentService],
  exports: [OpenapiDocumentService],
})
// Nest requires a module class token; this module has no instance state.
// eslint-disable-next-line @typescript-eslint/no-extraneous-class -- Nest @Module() host
export class OpenapiInfrastructureModule {}
