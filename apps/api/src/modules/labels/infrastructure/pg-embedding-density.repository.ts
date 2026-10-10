// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { EmbeddingDensityCalibrationRunEntity } from '../../../shared/infrastructure/database/entities/embedding-density-calibration-run.entity.js';
import { EmbeddingDensityClassNiwEntity } from '../../../shared/infrastructure/database/entities/embedding-density-class-niw.entity.js';
import { EmbeddingDensityLabelGroupEntity } from '../../../shared/infrastructure/database/entities/embedding-density-label-group.entity.js';
import { EmbeddingDensityLabelGroupMemberEntity } from '../../../shared/infrastructure/database/entities/embedding-density-label-group-member.entity.js';
import { EmbeddingDensityCorrectionEntity } from '../../../shared/infrastructure/database/entities/embedding-density-correction.entity.js';
import { EmbeddingDensityCorrectionOffsetEntity } from '../../../shared/infrastructure/database/entities/embedding-density-correction-offset.entity.js';
import { EmbeddingDensityDecisionThresholdEntity } from '../../../shared/infrastructure/database/entities/embedding-density-decision-threshold.entity.js';
import { EmbeddingDensityUserStateEntity } from '../../../shared/infrastructure/database/entities/embedding-density-user-state.entity.js';
import { DocumentEmbeddingsEntity } from '../../../shared/infrastructure/database/entities/document-embeddings.entity.js';
import { TagsEntity } from '../../../shared/infrastructure/database/entities/tags.entity.js';
import {
  type EmbeddingDensityWorkerState,
  embeddingDensityWorkerStateSchema,
  type KernelStateWire,
  kernelStateWireSchema,
} from '../domain/embedding-density-worker-state.schema.js';
import {
  buildWorkerState,
  parseDocumentEmbedding,
} from './embedding-density-worker-state.mapper.js';
import { trainingExampleRawRowSchema } from '../domain/training-example-row.schema.js';
import { encodeSumXF32, encodeSumXxF32 } from '../domain/niw-stats.codec.js';
import { EMBEDDING_DENSITY_COARSE_TOP_GROUP_TARGET_ID } from '../domain/embedding-density-constants.js';

export interface EmbeddingDensityTrainingExamples {
  vectors: number[][];
  labelIds: string[];
  documentIds: string[];
  allLabelIds: string[];
}

@Injectable()
export class PgEmbeddingDensityRepository {
  constructor(
    @InjectRepository(EmbeddingDensityUserStateEntity)
    private readonly userStateRepo: Repository<EmbeddingDensityUserStateEntity>,
    @InjectRepository(EmbeddingDensityClassNiwEntity)
    private readonly classNiwRepo: Repository<EmbeddingDensityClassNiwEntity>,
    @InjectRepository(EmbeddingDensityDecisionThresholdEntity)
    private readonly thresholdRepo: Repository<EmbeddingDensityDecisionThresholdEntity>,
    @InjectRepository(EmbeddingDensityLabelGroupMemberEntity)
    private readonly groupMemberRepo: Repository<EmbeddingDensityLabelGroupMemberEntity>,
    @InjectRepository(EmbeddingDensityCorrectionEntity)
    private readonly correctionRepo: Repository<EmbeddingDensityCorrectionEntity>,
    @InjectRepository(EmbeddingDensityCorrectionOffsetEntity)
    private readonly correctionOffsetRepo: Repository<EmbeddingDensityCorrectionOffsetEntity>,
    @InjectRepository(DocumentEmbeddingsEntity)
    private readonly documentEmbeddingRepo: Repository<DocumentEmbeddingsEntity>,
    @InjectRepository(TagsEntity)
    private readonly tagsRepo: Repository<TagsEntity>,
    @InjectRepository(EmbeddingDensityCalibrationRunEntity)
    private readonly calibrationRunRepo: Repository<EmbeddingDensityCalibrationRunEntity>,
    @InjectRepository(EmbeddingDensityLabelGroupEntity)
    private readonly labelGroupRepo: Repository<EmbeddingDensityLabelGroupEntity>,
    @InjectRepository(EmbeddingDensityLabelGroupMemberEntity)
    private readonly labelGroupMemberRepo: Repository<EmbeddingDensityLabelGroupMemberEntity>
  ) {}

  async isCalibrationReady(userId: string): Promise<boolean> {
    const row = await this.userStateRepo.findOne({ where: { userId } });
    if (!row) {
      return false;
    }
    return row.coarseReady || (row.fineReadyTagIds?.length ?? 0) > 0;
  }

  async listUsersWithCalibrationReady(): Promise<string[]> {
    const rows = await this.userStateRepo.find({ select: ['userId', 'coarseReady', 'fineReadyTagIds'] });
    return rows
      .filter((row) => row.coarseReady || (row.fineReadyTagIds?.length ?? 0) > 0)
      .map((row) => row.userId);
  }

  async activeCalibrationExampleCount(userId: string): Promise<number | null> {
    const userState = await this.userStateRepo.findOne({ where: { userId } });
    if (!userState?.activeCalibrationRunId) {
      return null;
    }
    const run = await this.calibrationRunRepo.findOne({
      where: { id: userState.activeCalibrationRunId },
      select: ['nExamples'],
    });
    return run?.nExamples ?? null;
  }

  async loadWorkerState(userId: string, tagIds: string[]): Promise<EmbeddingDensityWorkerState | null> {
    const userState = await this.userStateRepo.findOne({ where: { userId } });
    if (!userState) {
      return null;
    }
    const classRows = await this.classNiwRepo.find({ where: { userId } });
    const thresholds = userState.activeCalibrationRunId
      ? await this.thresholdRepo.find({
          where: { calibrationRunId: userState.activeCalibrationRunId },
          relations: ['group'],
        })
      : [];
    const labelToGroup: Record<string, string> = {};
    const groupNameById = new Map<string, string>();
    if (userState.activeCalibrationRunId) {
      const groups = await this.labelGroupRepo.find({
        where: { calibrationRunId: userState.activeCalibrationRunId },
      });
      for (const group of groups) {
        groupNameById.set(group.id, group.name);
      }
      const members = await this.groupMemberRepo.find({
        where: { group: { calibrationRunId: userState.activeCalibrationRunId } },
        relations: ['group'],
      });
      for (const member of members) {
        labelToGroup[member.tagId] = member.groupId;
      }
    }
    const kernel = await this.loadKernelPayload(userId, tagIds, userState.kernelBandwidth);
    const state = buildWorkerState({
      userState,
      tagIds,
      classRows,
      thresholds,
      labelToGroup,
      kernel,
      groupNameById,
    });
    return embeddingDensityWorkerStateSchema.parse(state);
  }

  private async loadKernelPayload(
    userId: string,
    tagIds: string[],
    bandwidth: number
  ): Promise<KernelStateWire> {
    const corrections = await this.correctionRepo.find({
      where: { userId, status: 'active' },
      order: { createdAt: 'ASC' },
    });
    if (corrections.length === 0) {
      return kernelStateWireSchema.parse({
        bandwidth,
        points: [],
        label_offsets: [],
      });
    }
    const correctionIds = corrections.map((c) => c.id);
    const offsets = await this.correctionOffsetRepo.find({
      where: { correctionId: In(correctionIds) },
    });
    const documentIds = corrections.map((c) => c.documentId);
    const embeddings = await this.documentEmbeddingRepo.find({
      where: { documentId: In(documentIds) },
    });
    const embeddingByDocument = new Map(
      embeddings.map((row) => [row.documentId, parseDocumentEmbedding(row.embedding)])
    );
    const offsetsByCorrection = new Map<string, Map<string, number>>();
    for (const offset of offsets) {
      const map = offsetsByCorrection.get(offset.correctionId) ?? new Map<string, number>();
      map.set(offset.tagId, offset.offset);
      offsetsByCorrection.set(offset.correctionId, map);
    }
    const points: number[][] = [];
    const labelOffsets: number[][] = [];
    for (const correction of corrections) {
      const point = embeddingByDocument.get(correction.documentId);
      if (!point) {
        continue;
      }
      const offsetMap = offsetsByCorrection.get(correction.id) ?? new Map<string, number>();
      points.push(point);
      labelOffsets.push(tagIds.map((tagId) => offsetMap.get(tagId) ?? 0));
    }
    return kernelStateWireSchema.parse({
      bandwidth,
      points,
      label_offsets: labelOffsets,
    });
  }

  async persistWorkerState(userId: string, state: EmbeddingDensityWorkerState): Promise<void> {
    const parsed = embeddingDensityWorkerStateSchema.parse(state);
    await this.userStateRepo.upsert(
      {
        userId,
        temperature: parsed.temperature,
        noveltyLogThreshold: parsed.novelty_threshold,
        coarseReady: parsed.coarse_ready,
        fineReadyTagIds: Object.entries(parsed.fine_ready)
          .filter(([, ready]) => ready)
          .map(([tagId]) => tagId),
        classBias: parsed.class_bias,
        kernelBandwidth: parsed.kernel.bandwidth,
      },
      ['userId']
    );
    for (const [tagId, stats] of Object.entries(parsed.class_stats)) {
      const sumXF32 =
        stats.sum_x_f32 !== undefined
          ? Buffer.from(stats.sum_x_f32, 'base64')
          : encodeSumXF32(stats.sum_x);
      const dim = sumXF32.byteLength / 4;
      const sumXxF32 =
        stats.sum_xx_f32 !== undefined
          ? Buffer.from(stats.sum_xx_f32, 'base64')
          : encodeSumXxF32(stats.sum_xx.length > 0 ? stats.sum_xx : Array.from({ length: dim }, () => []));
      await this.classNiwRepo.upsert(
        {
          userId,
          tagId,
          sampleCount: stats.count,
          sumX: null,
          sumXx: null,
          sumXF32,
          sumXxF32,
        },
        ['userId', 'tagId']
      );
    }
  }

  async persistCalibrationBundle(
    userId: string,
    state: EmbeddingDensityWorkerState,
    meta: { nDocuments: number; nExamples: number; delta: number }
  ): Promise<void> {
    const parsed = embeddingDensityWorkerStateSchema.parse(state);
    await this.userStateRepo.manager.transaction(async (em) => {
      const run = em.create(EmbeddingDensityCalibrationRunEntity, {
        userId,
        modelVersionId: null,
        nDocuments: meta.nDocuments,
        nExamples: meta.nExamples,
        delta: meta.delta,
      });
      const savedRun = await em.save(run);

      const groupIdByTag = new Map<string, string>();
      if (parsed.coarse_thresholds[EMBEDDING_DENSITY_COARSE_TOP_GROUP_TARGET_ID]) {
        const topGroup = em.create(EmbeddingDensityLabelGroupEntity, {
          userId,
          calibrationRunId: savedRun.id,
          name: EMBEDDING_DENSITY_COARSE_TOP_GROUP_TARGET_ID,
        });
        const savedTop = await em.save(topGroup);
        groupIdByTag.set(EMBEDDING_DENSITY_COARSE_TOP_GROUP_TARGET_ID, savedTop.id);
      }
      for (const tagId of parsed.label_ids) {
        const group = em.create(EmbeddingDensityLabelGroupEntity, {
          userId,
          calibrationRunId: savedRun.id,
          name: tagId,
        });
        const savedGroup = await em.save(group);
        groupIdByTag.set(tagId, savedGroup.id);
        const member = em.create(EmbeddingDensityLabelGroupMemberEntity, {
          groupId: savedGroup.id,
          tagId,
        });
        await em.save(member);
      }

      for (const [gid, thr] of Object.entries(parsed.coarse_thresholds)) {
        const groupId = groupIdByTag.get(gid) ?? gid;
        const row = em.create(EmbeddingDensityDecisionThresholdEntity, {
          calibrationRunId: savedRun.id,
          scope: 'coarse',
          tagId: null,
          groupId,
          threshold: thr.threshold,
          lowerBound: thr.lower_bound,
        });
        await em.save(row);
      }
      for (const [tagId, thr] of Object.entries(parsed.fine_thresholds)) {
        const row = em.create(EmbeddingDensityDecisionThresholdEntity, {
          calibrationRunId: savedRun.id,
          scope: 'fine',
          tagId,
          groupId: null,
          threshold: thr.threshold,
          lowerBound: thr.lower_bound,
        });
        await em.save(row);
      }

      await em.upsert(
        EmbeddingDensityUserStateEntity,
        {
          userId,
          temperature: parsed.temperature,
          noveltyLogThreshold: parsed.novelty_threshold,
          coarseReady: parsed.coarse_ready,
          fineReadyTagIds: Object.entries(parsed.fine_ready)
            .filter(([, ready]) => ready)
            .map(([tagId]) => tagId),
          classBias: parsed.class_bias,
          kernelBandwidth: parsed.kernel.bandwidth,
          activeCalibrationRunId: savedRun.id,
        },
        ['userId']
      );
    });

    await this.persistWorkerState(userId, parsed);
  }

  async persistCorrection(
    userId: string,
    documentId: string,
    fromTagId: string | null,
    toTagId: string,
    createdBy: string,
    state: EmbeddingDensityWorkerState,
    tagIds: string[]
  ): Promise<void> {
    const parsed = embeddingDensityWorkerStateSchema.parse(state);
    const points = parsed.kernel.points;
    const offsets = parsed.kernel.label_offsets;
    if (points.length === 0 || offsets.length === 0) {
      return;
    }
    const point = points[points.length - 1];
    const offsetVec = offsets[offsets.length - 1];
    const correction = this.correctionRepo.create({
      userId,
      documentId,
      fromTagId,
      toTagId,
      modelVersionId: null,
      createdBy,
      status: 'active',
    });
    const saved = await this.correctionRepo.save(correction);
    for (let i = 0; i < tagIds.length; i++) {
      const tagId = tagIds[i];
      const value = offsetVec[i] ?? 0;
      if (value === 0) {
        continue;
      }
      await this.correctionOffsetRepo.save(
        this.correctionOffsetRepo.create({
          correctionId: saved.id,
          tagId,
          offset: value,
        })
      );
    }
    await this.userStateRepo.update(
      { userId },
      { kernelBandwidth: parsed.kernel.bandwidth, temperature: parsed.temperature }
    );
    void point;
  }

  async listTrainingExamples(userId: string): Promise<EmbeddingDensityTrainingExamples> {
    const tags = await this.tagsRepo.find({
      where: { userId, isInbox: false },
      select: ['id'],
    });
    const allLabelIds = tags.map((tag) => tag.id);
    const rows = await this.documentEmbeddingRepo
      .createQueryBuilder('de')
      .innerJoin('de.document', 'document')
      .innerJoin('document.tags', 'tag')
      .where('document.userId = :userId', { userId })
      .andWhere('tag.isInbox = :inbox', { inbox: false })
      .select('de.embedding', 'embedding')
      .addSelect('tag.id', 'tagId')
      .addSelect('document.id', 'documentId')
      .getRawMany();

    const vectors: number[][] = [];
    const labelIds: string[] = [];
    const documentIds: string[] = [];
    for (const raw of rows) {
      const row = trainingExampleRawRowSchema.parse(raw);
      vectors.push(parseDocumentEmbedding(row.embedding));
      labelIds.push(row.tagId);
      documentIds.push(row.documentId);
    }
    return { vectors, labelIds, documentIds, allLabelIds };
  }
}
