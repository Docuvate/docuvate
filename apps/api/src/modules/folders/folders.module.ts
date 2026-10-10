// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Module } from '@nestjs/common';

import {
  CreateFolderUseCase,
  DeleteFolderUseCase,
  ListFoldersUseCase,
  UpdateFolderUseCase,
} from './application/folder.use-cases.js';
import { FoldersController } from './presentation/folders.controller.js';

@Module({
  controllers: [FoldersController],
  providers: [ListFoldersUseCase, CreateFolderUseCase, UpdateFolderUseCase, DeleteFolderUseCase],
})
// Nest requires a module class token; this module has no instance state.
// eslint-disable-next-line @typescript-eslint/no-extraneous-class -- Nest @Module() host
export class FoldersModule {}
