import { Global, Module } from '@nestjs/common';
import { AuthGuard } from './auth.guard.js';
import { ServiceApiKeyRegistry } from './service-api-key.registry.js';

@Global()
@Module({
  providers: [ServiceApiKeyRegistry, AuthGuard],
  exports: [ServiceApiKeyRegistry, AuthGuard],
})
export class AuthModule {}
