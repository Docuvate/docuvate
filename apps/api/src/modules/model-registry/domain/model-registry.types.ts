// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
export type MlModelKind = 'ocr' | 'embedding' | 'docqa' | 'field_extractor';

export type MlModelLifecycle = 'registered' | 'canary' | 'active' | 'archived' | 'failed';

export type MlRetrainTriggerKind = 'cron' | 'threshold' | 'manual';

export type MlRetrainJobStatus = 'queued' | 'running' | 'succeeded' | 'failed' | 'cancelled';

export interface MlModelFamilyEntity {
  id: string;
  kind: MlModelKind;
  displayName: string;
  description: string | null;
}

export interface MlModelVersionEntity {
  id: string;
  familyId: string;
  versionTag: string;
  artifactUri: string | null;
  externalRunId: string | null;
  metrics: Record<string, number>;
  lifecycle: MlModelLifecycle;
  trainingSnapshotId: string | null;
  notes: string | null;
  createdAt: Date;
  promotedAt: Date | null;
}

export interface MlRetrainJobEntity {
  id: string;
  familyId: string;
  triggerKind: MlRetrainTriggerKind;
  status: MlRetrainJobStatus;
  trainingSnapshotId: string | null;
  resultVersionId: string | null;
  errorMessage: string | null;
  createdAt: Date;
  startedAt: Date | null;
  finishedAt: Date | null;
}

export interface MlCanaryEvaluationEntity {
  id: string;
  versionId: string;
  baselineVersionId: string | null;
  metricName: string;
  baselineValue: number | null;
  candidateValue: number | null;
  maxAllowedDrop: number;
  passed: boolean;
  evaluatedAt: Date;
}
