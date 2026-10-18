// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { applyDecorators } from '@nestjs/common';
import { ApiBearerAuth, ApiSecurity } from '@nestjs/swagger';

/** Public product API: service API key (Bearer or X-Docuvate-Api-Key). */
export function ApiDocuvateAuth(): MethodDecorator & ClassDecorator {
  return applyDecorators(ApiSecurity('apiKeyAuth'), ApiBearerAuth('bearerAuth'));
}
