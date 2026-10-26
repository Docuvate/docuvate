// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Module } from '@nestjs/common';

import { DatabaseMigrationReadinessService } from './database-migration-readiness.service.js';
import { HealthController } from './health.controller.js';

@Module({
  controllers: [HealthController],
  providers: [DatabaseMigrationReadinessService],
})
// Nest requires a module class token; this module has no instance state.
// eslint-disable-next-line @typescript-eslint/no-extraneous-class -- Nest @Module() host
export class HealthModule {}
