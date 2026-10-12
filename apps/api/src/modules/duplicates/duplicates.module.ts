// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Module } from '@nestjs/common';

import { LabelsModule } from '../labels/labels.module.js';
import { ApplyDuplicateDetectionUseCase } from './application/apply-duplicate-detection.use-case.js';
import { DuplicateClassifierService } from './domain/duplicate-classifier.service.js';
import {
  DismissDuplicateCandidateUseCase,
  ListDuplicateCandidatesUseCase,
} from './application/duplicate-query.use-cases.js';
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

@Module({
  imports: [LabelsModule],
  providers: [
    SyncUserHashDuplicatesUseCase,
    DuplicateClassifierService,
    ApplyDuplicateDetectionUseCase,
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
  ],
  exports: [
    ApplyDuplicateDetectionUseCase,
    ListDuplicateCandidatesUseCase,
    DismissDuplicateCandidateUseCase,
    SyncDuplicateStacksUseCase,
    GetDuplicateStackUseCase,
    SetDuplicateStackPrimaryUseCase,
    ConfirmDuplicateVersionUseCase,
    ReleaseDuplicateStackMemberUseCase,
    RestoreDuplicateStackPairUseCase,
    HandleDuplicateStackDocumentDeletedUseCase,
  ],
})
// Nest requires a module class token; this module has no instance state.
// eslint-disable-next-line @typescript-eslint/no-extraneous-class -- Nest @Module() host
export class DuplicatesModule {}
