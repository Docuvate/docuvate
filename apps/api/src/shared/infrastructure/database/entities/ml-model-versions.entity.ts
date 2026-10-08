import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { MlCanaryEvaluationsEntity } from './ml-canary-evaluations.entity.js';
import { MlModelFamiliesEntity } from './ml-model-families.entity.js';
import { MlTrainingDataSnapshotsEntity } from './ml-training-data-snapshots.entity.js';
import { MlRetrainJobsEntity } from './ml-retrain-jobs.entity.js';

@Index("ml_model_versions_family_lifecycle_idx", ["familyId", "lifecycle"], {})
@Index(
  "ml_model_versions_family_id_version_tag_key",
  ["familyId", "versionTag"],
  { unique: true }
)
@Entity("ml_model_versions", { schema: "public" })
export class MlModelVersionsEntity {
  @PrimaryGeneratedColumn("uuid", { name: "id" })
  id: string;

  @Column("text", { name: "family_id", unique: true })
  familyId: string;

  @Column("text", { name: "version_tag", unique: true })
  versionTag: string;

  @Column("text", { name: "artifact_uri", nullable: true })
  artifactUri: string | null;

  @Column("text", { name: "external_run_id", nullable: true })
  externalRunId: string | null;

  @Column("jsonb", { name: "metrics", default: {} })
  metrics: object;

  @Column("text", { name: "lifecycle", default: () => "'registered'" })
  lifecycle: string;

  @Column("text", { name: "notes", nullable: true })
  notes: string | null;

  @Column("timestamp with time zone", {
    name: "created_at",
    default: () => "now()",
  })
  createdAt: Date;

  @Column("timestamp with time zone", { name: "promoted_at", nullable: true })
  promotedAt: Date | null;

  @OneToMany(
    () => MlCanaryEvaluationsEntity,
    (mlCanaryEvaluations) => mlCanaryEvaluations.baselineVersion
  )
  mlCanaryEvaluations: MlCanaryEvaluationsEntity[];

  @OneToMany(
    () => MlCanaryEvaluationsEntity,
    (mlCanaryEvaluations) => mlCanaryEvaluations.version
  )
  mlCanaryEvaluations2: MlCanaryEvaluationsEntity[];

  @ManyToOne(
    () => MlModelFamiliesEntity,
    (mlModelFamilies) => mlModelFamilies.mlModelVersions
  )
  @JoinColumn([{ name: "family_id", referencedColumnName: "id" }])
  family: MlModelFamiliesEntity;

  @ManyToOne(
    () => MlTrainingDataSnapshotsEntity,
    (mlTrainingDataSnapshots) => mlTrainingDataSnapshots.mlModelVersions
  )
  @JoinColumn([{ name: "training_snapshot_id", referencedColumnName: "id" }])
  trainingSnapshot: MlTrainingDataSnapshotsEntity;

  @OneToMany(
    () => MlRetrainJobsEntity,
    (mlRetrainJobs) => mlRetrainJobs.resultVersion
  )
  mlRetrainJobs: MlRetrainJobsEntity[];
}
