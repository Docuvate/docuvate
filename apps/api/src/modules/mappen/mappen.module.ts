// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Module } from '@nestjs/common';

import {
  CreateMappeUseCase,
  DeleteMappeUseCase,
  ListMappenUseCase,
  UpdateMappeUseCase,
} from './application/mappe.use-cases.js';
import { MappenController } from './presentation/mappen.controller.js';

@Module({
  controllers: [MappenController],
  providers: [ListMappenUseCase, CreateMappeUseCase, UpdateMappeUseCase, DeleteMappeUseCase],
})
// Nest requires a module class token; this module has no instance state.
// eslint-disable-next-line @typescript-eslint/no-extraneous-class -- Nest @Module() host
export class MappenModule {}
