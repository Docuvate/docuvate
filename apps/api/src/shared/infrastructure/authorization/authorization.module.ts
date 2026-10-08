import { Global, Module } from '@nestjs/common';
import { AUTHORIZATION_PORT } from '../../domain/authorization.js';
import { DocumentAuthorizationService } from '../../application/document-authorization.service.js';
import { AbacAuthorizationAdapter } from './abac-authorization.adapter.js';

@Global()
@Module({
  providers: [
    DocumentAuthorizationService,
    { provide: AUTHORIZATION_PORT, useClass: AbacAuthorizationAdapter },
  ],
  exports: [AUTHORIZATION_PORT, DocumentAuthorizationService],
})
export class AuthorizationModule {}
