// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Module } from '@nestjs/common';
import { OpenapiController } from './openapi.controller.js';

@Module({
  controllers: [OpenapiController],
})
export class OpenapiModule {}
