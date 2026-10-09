// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Module } from '@nestjs/common';
import { LabelsModule } from '../labels/labels.module.js';
import { ApplyDuplicateDetectionUseCase } from './application/apply-duplicate-detection.use-case.js';
import { SyncUserHashDuplicatesUseCase } from './application/sync-user-hash-duplicates.use-case.js';
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
  SetDuplicateStackPrimaryUseCase,
  SyncDuplicateStacksUseCase,
} from './application/duplicate-stack.use-cases.js';

@Module({
  imports: [LabelsModule],
  providers: [
    SyncUserHashDuplicatesUseCase,
    ApplyDuplicateDetectionUseCase,
    ListDuplicateCandidatesUseCase,
    DismissDuplicateCandidateUseCase,
    SyncDuplicateStacksUseCase,
    LinkDuplicatePairUseCase,
    GetDuplicateStackUseCase,
    SetDuplicateStackPrimaryUseCase,
    ConfirmDuplicateVersionUseCase,
    ReleaseDuplicateStackMemberUseCase,
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
    HandleDuplicateStackDocumentDeletedUseCase,
  ],
})
export class DuplicatesModule {}
