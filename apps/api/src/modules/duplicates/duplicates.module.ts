// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Module } from '@nestjs/common';

import { FeatureFlagsModule } from '../feature-flags/feature-flags.module.js';
import { LabelsModule } from '../labels/labels.module.js';
import { SettingsModule } from '../settings/settings.module.js';
import { ApplyExactDuplicateDetectionUseCase } from './application/apply-exact-duplicate-detection.use-case.js';
import { ApplyFuzzyDuplicateDetectionUseCase } from './application/apply-fuzzy-duplicate-detection.use-case.js';
import { ScheduleDuplicateDetectionUseCase } from './application/schedule-duplicate-detection.use-case.js';
import {
  DismissDuplicateCandidateUseCase,
  ListDuplicateCandidatesUseCase,
} from './application/duplicate-query.use-cases.js';
import {
  ApplyDuplicateSetDecisionsUseCase,
  ArchiveDuplicateSetUseCase,
  DismissDuplicateSetUseCase,
  ListDuplicateSetsUseCase,
} from './application/duplicate-set.use-cases.js';
import {
  ConfirmDuplicateVersionUseCase,
  GetDuplicateStackUseCase,
  HandleDuplicateStackDocumentDeletedUseCase,
  LinkDuplicatePairUseCase,
  ReleaseDuplicateStackMemberUseCase,
  RestoreDuplicateStackPairUseCase,
  SetDuplicateStackPrimaryUseCase,
  SyncDuplicateStacksUseCase,
} from './application/duplicate-stack.use-cases.js';
import { SyncUserHashDuplicatesUseCase } from './application/sync-user-hash-duplicates.use-case.js';
import { DuplicateClassifierService } from './domain/duplicate-classifier.service.js';
import { DuplicateDetectionQueueService } from './infrastructure/duplicate-detection-queue.service.js';
import { HttpSmartDuplicatesAdapter } from './infrastructure/http-smart-duplicates.adapter.js';
import { DuplicatesController } from './presentation/duplicates.controller.js';

@Module({
  imports: [LabelsModule, FeatureFlagsModule, SettingsModule],
  controllers: [DuplicatesController],
  providers: [
    HttpSmartDuplicatesAdapter,
    SyncUserHashDuplicatesUseCase,
    DuplicateClassifierService,
    ApplyExactDuplicateDetectionUseCase,
    ApplyFuzzyDuplicateDetectionUseCase,
    ScheduleDuplicateDetectionUseCase,
    DuplicateDetectionQueueService,
    ListDuplicateCandidatesUseCase,
    DismissDuplicateCandidateUseCase,
    SyncDuplicateStacksUseCase,
    LinkDuplicatePairUseCase,
    GetDuplicateStackUseCase,
    SetDuplicateStackPrimaryUseCase,
    ConfirmDuplicateVersionUseCase,
    ReleaseDuplicateStackMemberUseCase,
    RestoreDuplicateStackPairUseCase,
    HandleDuplicateStackDocumentDeletedUseCase,
    ListDuplicateSetsUseCase,
    ApplyDuplicateSetDecisionsUseCase,
    ArchiveDuplicateSetUseCase,
    DismissDuplicateSetUseCase,
  ],
  exports: [
    ApplyExactDuplicateDetectionUseCase,
    ApplyFuzzyDuplicateDetectionUseCase,
    ScheduleDuplicateDetectionUseCase,
    ListDuplicateCandidatesUseCase,
    DismissDuplicateCandidateUseCase,
    SyncDuplicateStacksUseCase,
    GetDuplicateStackUseCase,
    SetDuplicateStackPrimaryUseCase,
    ConfirmDuplicateVersionUseCase,
    ReleaseDuplicateStackMemberUseCase,
    RestoreDuplicateStackPairUseCase,
    HandleDuplicateStackDocumentDeletedUseCase,
    ListDuplicateSetsUseCase,
    ApplyDuplicateSetDecisionsUseCase,
    ArchiveDuplicateSetUseCase,
    DismissDuplicateSetUseCase,
  ],
})
// Nest requires a module class token; this module has no instance state.
// eslint-disable-next-line @typescript-eslint/no-extraneous-class -- Nest @Module() host
export class DuplicatesModule {}
