// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type {
  MlModelFamilyEntity,
  MlModelVersionEntity,
  MlRetrainJobEntity,
} from '../domain/model-registry.types.js';
import type { MlModelFamilyDto, MlModelVersionDto, MlRetrainJobDto } from './model-registry.dto.js';

export function toFamilyDto(entity: MlModelFamilyEntity): MlModelFamilyDto {
  return {
    id: entity.id,
    kind: entity.kind,
    displayName: entity.displayName,
    description: entity.description,
  };
}

export function toVersionDto(entity: MlModelVersionEntity): MlModelVersionDto {
  return {
    id: entity.id,
    familyId: entity.familyId,
    versionTag: entity.versionTag,
    artifactUri: entity.artifactUri,
    externalRunId: entity.externalRunId,
    metrics: entity.metrics,
    lifecycle: entity.lifecycle,
    trainingSnapshotId: entity.trainingSnapshotId,
    notes: entity.notes,
    createdAt: entity.createdAt.toISOString(),
    promotedAt: entity.promotedAt?.toISOString() ?? null,
  };
}

export function toJobDto(entity: MlRetrainJobEntity): MlRetrainJobDto {
  return {
    id: entity.id,
    familyId: entity.familyId,
    triggerKind: entity.triggerKind,
    status: entity.status,
    trainingSnapshotId: entity.trainingSnapshotId,
    resultVersionId: entity.resultVersionId,
    errorMessage: entity.errorMessage,
    createdAt: entity.createdAt.toISOString(),
    startedAt: entity.startedAt?.toISOString() ?? null,
    finishedAt: entity.finishedAt?.toISOString() ?? null,
  };
}
