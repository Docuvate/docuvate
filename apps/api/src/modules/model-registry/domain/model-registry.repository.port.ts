import type {
  MlCanaryEvaluationEntity,
  MlModelFamilyEntity,
  MlModelLifecycle,
  MlModelVersionEntity,
  MlRetrainJobEntity,
  MlRetrainJobStatus,
  MlRetrainTriggerKind,
} from './model-registry.types.js';

export interface ModelRegistryRepository {
  listFamilies(): Promise<MlModelFamilyEntity[]>;
  findFamilyById(familyId: string): Promise<MlModelFamilyEntity | null>;
  listVersionsForFamily(familyId: string): Promise<MlModelVersionEntity[]>;
  findVersionById(versionId: string): Promise<MlModelVersionEntity | null>;
  getActiveVersionForFamily(familyId: string): Promise<MlModelVersionEntity | null>;
  setVersionLifecycle(versionId: string, lifecycle: MlModelLifecycle): Promise<MlModelVersionEntity>;
  archiveActiveForFamily(familyId: string, exceptVersionId: string): Promise<void>;
  insertCanaryEvaluation(row: Omit<MlCanaryEvaluationEntity, 'id' | 'evaluatedAt'>): Promise<MlCanaryEvaluationEntity>;
  listRecentJobs(familyId: string, limit: number): Promise<MlRetrainJobEntity[]>;
  createRetrainJob(familyId: string, triggerKind: MlRetrainTriggerKind): Promise<MlRetrainJobEntity>;
  updateRetrainJob(
    jobId: string,
    patch: Partial<
      Pick<
        MlRetrainJobEntity,
        'status' | 'trainingSnapshotId' | 'resultVersionId' | 'errorMessage' | 'startedAt' | 'finishedAt'
      >
    >
  ): Promise<MlRetrainJobEntity>;
  countCorrectionsSince(since: Date | null): Promise<number>;
  lastSnapshotWatermarkForFamily(familyId: string): Promise<Date | null>;
  insertTrainingSnapshot(input: {
    familyId: string;
    datasetVersion: string;
    sourceWatermark: Date | null;
    rowCount: number;
    storageUri: string | null;
    metadata: Record<string, unknown>;
  }): Promise<{ id: string }>;
  registerModelVersion(input: {
    familyId: string;
    versionTag: string;
    artifactUri: string | null;
    externalRunId: string | null;
    metrics: Record<string, number>;
    trainingSnapshotId: string;
    notes: string | null;
  }): Promise<MlModelVersionEntity>;
}

export const MODEL_REGISTRY_REPOSITORY = Symbol('MODEL_REGISTRY_REPOSITORY');
