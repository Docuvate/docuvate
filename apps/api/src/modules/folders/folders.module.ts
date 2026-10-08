import { Module } from '@nestjs/common';
import { FoldersController } from './presentation/folders.controller.js';
import {
  CreateFolderUseCase,
  DeleteFolderUseCase,
  ListFoldersUseCase,
  UpdateFolderUseCase,
} from './application/folder.use-cases.js';

@Module({
  controllers: [FoldersController],
  providers: [
    ListFoldersUseCase,
    CreateFolderUseCase,
    UpdateFolderUseCase,
    DeleteFolderUseCase,
  ],
})
export class FoldersModule {}
