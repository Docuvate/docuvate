import { applyDecorators } from '@nestjs/common';
import { ApiBearerAuth, ApiSecurity } from '@nestjs/swagger';

/** Public product API: service API key (Bearer or X-Docuvate-Api-Key). */
export function ApiDocuvateAuth(): MethodDecorator & ClassDecorator {
  return applyDecorators(ApiSecurity('apiKeyAuth'), ApiBearerAuth('bearerAuth'));
}
