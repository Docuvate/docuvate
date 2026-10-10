// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Global, Module } from '@nestjs/common';

import { DocumentAuthorizationService } from '../../application/document-authorization.service.js';
import { AUTHORIZATION_PORT } from '../../domain/authorization.js';
import { AbacAuthorizationAdapter } from './abac-authorization.adapter.js';

@Global()
@Module({
  providers: [
    DocumentAuthorizationService,
    { provide: AUTHORIZATION_PORT, useClass: AbacAuthorizationAdapter },
  ],
  exports: [AUTHORIZATION_PORT, DocumentAuthorizationService],
})
// Nest requires a module class token; this module has no instance state.
// eslint-disable-next-line @typescript-eslint/no-extraneous-class -- Nest @Module() host
export class AuthorizationModule {}
