import { Module } from '@nestjs/common';
import { MappenController } from './presentation/mappen.controller.js';
import {
  CreateMappeUseCase,
  DeleteMappeUseCase,
  ListMappenUseCase,
  UpdateMappeUseCase,
} from './application/mappe.use-cases.js';

@Module({
  controllers: [MappenController],
  providers: [
    ListMappenUseCase,
    CreateMappeUseCase,
    UpdateMappeUseCase,
    DeleteMappeUseCase,
  ],
})
export class MappenModule {}
