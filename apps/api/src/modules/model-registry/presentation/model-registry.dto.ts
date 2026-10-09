// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type {
  MlModelKind,
  MlModelLifecycle,
  MlRetrainJobStatus,
  MlRetrainTriggerKind,
} from '../domain/model-registry.types.js';

export class MlModelFamilyDto {
  id!: string;
  kind!: MlModelKind;
  displayName!: string;
  description!: string | null;
}

export class MlModelVersionDto {
  id!: string;
  familyId!: string;
  versionTag!: string;
  artifactUri!: string | null;
  externalRunId!: string | null;
  metrics!: Record<string, number>;
  lifecycle!: MlModelLifecycle;
  trainingSnapshotId!: string | null;
  notes!: string | null;
  createdAt!: string;
  promotedAt!: string | null;
}

export class MlRetrainJobDto {
  id!: string;
  familyId!: string;
  triggerKind!: MlRetrainTriggerKind;
  status!: MlRetrainJobStatus;
  trainingSnapshotId!: string | null;
  resultVersionId!: string | null;
  errorMessage!: string | null;
  createdAt!: string;
  startedAt!: string | null;
  finishedAt!: string | null;
}

export class MlModelFamilyListResponseDto {
  families!: MlModelFamilyDto[];
}

export class MlModelVersionListResponseDto {
  versions!: MlModelVersionDto[];
}

export class MlRetrainJobListResponseDto {
  jobs!: MlRetrainJobDto[];
}

export class TriggerMlRetrainRequestDto {
  familyId!: string;
}

export class SetMlModelLifecycleRequestDto {
  lifecycle!: MlModelLifecycle;
}
