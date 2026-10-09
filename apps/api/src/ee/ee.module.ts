// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-EE

import { Global, Module } from '@nestjs/common';
import { EnterpriseLicenseService } from './enterprise-license.service.js';

@Global()
@Module({
  providers: [EnterpriseLicenseService],
  exports: [EnterpriseLicenseService],
})
export class EeModule {}
