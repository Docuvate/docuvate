// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { randomUUID } from 'node:crypto';

import type {
  ApplyBlockCorrectionRequest,
  ApplyBlockCorrectionResponse,
  BlockCorrectionOp,
  DocumentCorrectionDto,
  DocumentRegionBlockDto,
  DocumentRegionBlockType,
  DocumentRegionDto,
  DocumentRegionRole,
  LayoutToken,
} from '@docuvate/contracts';
import {
  canonicalRegionPayload,
  joinedTokenText,
  normalizeRect,
  snapRectToTokenHull,
  tokensInsideRect,
} from '@docuvate/contracts';
import { Inject, Injectable } from '@nestjs/common';

import { DocumentAuthorizationService } from '../../../shared/application/document-authorization.service.js';
import type { AuthorizationSubject } from '../../../shared/domain/authorization.js';
import { NotFoundError, ValidationError } from '../../../shared/domain/errors.js';
import {
  DOCUMENT_REGION_REPOSITORY,
  DOCUMENT_REPOSITORY,
  type DocumentRegionRecord,
  type DocumentRegionRepository,
  type DocumentRepository,
} from '../../../shared/domain/ports.js';
import { layoutTokensFromIr } from '../domain/layout-tokens.js';
import { isUuid } from '../domain/parse-uuid.js';

const BLOCK_OPS = new Set<BlockCorrectionOp>(['create', 'set_type', 'set_rank', 'ignore', 'remove']);
const BLOCK_TYPES = new Set<DocumentRegionBlockType>([
  'heading',
  'paragraph',
  'list',
  'key_value',
  'table',
  'header',
  'footer',
]);

function toCorrectionDto(
  input: {
    id: string;
    documentId: string;
    op: BlockCorrectionOp;
    beforeRegionId: string | null;
    afterRegionId: string | null;
    oldValue: string | null;
    newValue: string | null;
  },
  createdAt: string
): DocumentCorrectionDto {
  return {
    id: input.id,
    documentId: input.documentId,
    kind: 'block',
    status: 'active',
    op: input.op,
    fieldKey: '',
    beforeRegionId: input.beforeRegionId,
    afterRegionId: input.afterRegionId,
    oldValue: input.oldValue,
    newValue: input.newValue,
    createdAt,
  };
}

function stripSuperseded(region: DocumentRegionRecord): DocumentRegionDto {
  return {
    id: region.id,
    documentId: region.documentId,
    page: region.page,
    shape: region.shape,
    role: region.role,
    x0: region.x0,
    y0: region.y0,
    x1: region.x1,
    y1: region.y1,
    irSha256: region.irSha256,
    needsReview: region.needsReview,
    blockIndexes: region.blockIndexes,
    block: region.block,
    createdAt: region.createdAt,
  };
}

function emptyBlock(): DocumentRegionBlockDto {
  return { blockType: 'paragraph', headingLevel: null, readingRank: null };
}

function blockAttributes(block: DocumentRegionBlockDto): Record<string, string | number | boolean | null> {
  return {
    blockType: block.blockType,
    headingLevel: block.headingLevel,
    readingRank: block.readingRank,
  };
}

function cloneBlock(block: DocumentRegionBlockDto): DocumentRegionBlockDto {
  return {
    blockType: block.blockType,
    headingLevel: block.headingLevel,
    readingRank: block.readingRank,
  };
}

@Injectable()
export class ApplyBlockCorrectionUseCase {
  constructor(
    @Inject(DOCUMENT_REPOSITORY) private readonly documents: DocumentRepository,
    @Inject(DOCUMENT_REGION_REPOSITORY) private readonly regions: DocumentRegionRepository,
    private readonly authorization: DocumentAuthorizationService
  ) {}

  async execute(
    documentId: string,
    userId: string,
    subject: AuthorizationSubject,
    body: ApplyBlockCorrectionRequest
  ): Promise<ApplyBlockCorrectionResponse> {
    if (!isUuid(body.id)) {
      throw new ValidationError('documents.correctionIdInvalid');
    }
    if (!BLOCK_OPS.has(body.op)) {
      throw new ValidationError('documents.correctionOpInvalid');
    }
    if (body.blockType && !BLOCK_TYPES.has(body.blockType)) {
      throw new ValidationError('documents.blockTypeInvalid');
    }
    const doc = await this.documents.findByIdForUser(documentId, userId);
    if (!doc) {
      throw new NotFoundError('Document');
    }
    await this.authorization.assert(subject, 'document:write', doc);

    const snapshot = await this.regions.findLayoutIrSnapshot(documentId, userId);
    const tokens = snapshot ? layoutTokensFromIr(snapshot.ir) : [];
    const existing = body.beforeRegionId
      ? await this.regions.findRegionById(documentId, body.beforeRegionId)
      : null;
    if (existing && existing.role !== 'block' && existing.role !== 'ignore') {
      throw new ValidationError('documents.blockRegionRequired');
    }

    const resolved = this.resolveSelection(body, existing, tokens);
    if (body.op === 'create' && resolved.tokens.length === 0) {
      throw new ValidationError('documents.blockRegionEmpty');
    }
    const nextBlock = this.nextBlock(body, existing);
    const nextRole: DocumentRegionRole = body.op === 'ignore' ? 'ignore' : 'block';
    const beforePayload = existing
      ? canonicalRegionPayload({
          role: existing.role,
          page: existing.page,
          rect: { x0: existing.x0, y0: existing.y0, x1: existing.x1, y1: existing.y1 },
          blockIndexes: existing.blockIndexes,
          attributes: blockAttributes(existing.block ?? emptyBlock()),
        })
      : canonicalRegionPayload({
          role: 'block',
          page: 1,
          rect: { x0: 0, y0: 0, x1: 0.001, y1: 0.001 },
          blockIndexes: [],
          attributes: blockAttributes(emptyBlock()),
        });
    const afterPayload =
      body.op === 'remove'
        ? canonicalRegionPayload({
            role: 'block',
            page: existing?.page ?? 1,
            rect: existing
              ? { x0: existing.x0, y0: existing.y0, x1: existing.x1, y1: existing.y1 }
              : { x0: 0, y0: 0, x1: 0.001, y1: 0.001 },
            blockIndexes: [],
            attributes: blockAttributes(emptyBlock()),
          })
        : canonicalRegionPayload({
            role: nextRole,
            page: resolved.page,
            rect: resolved.rect,
            blockIndexes: resolved.tokens.map((token) => token.blockIndex),
            attributes: blockAttributes(nextBlock),
          });
    if (beforePayload === afterPayload) {
      return { noChange: true, correction: null, region: existing ? stripSuperseded(existing) : null };
    }

    let afterRegion: DocumentRegionRecord | null = null;
    if (body.op !== 'remove') {
      if (!snapshot) {
        throw new ValidationError('documents.layoutIrMissing');
      }
      afterRegion = await this.regions.insertRegion({
        id: randomUUID(),
        documentId,
        page: resolved.page,
        shape: body.shape === 'polygon' ? 'polygon' : 'rect',
        role: nextRole,
        x0: resolved.rect.x0,
        y0: resolved.rect.y0,
        x1: resolved.rect.x1,
        y1: resolved.rect.y1,
        irSha256: snapshot.irSha256,
        blockIndexes: resolved.tokens.map((token) => token.blockIndex),
        boundText: joinedTokenText(resolved.tokens),
        block: nextBlock,
      });
      if (existing) {
        await this.regions.supersedeRegion(existing.id, afterRegion.id);
      }
    } else if (existing) {
      await this.regions.supersedeRegion(existing.id, null);
    }

    const oldValue = existing ? JSON.stringify(blockAttributes(existing.block ?? emptyBlock())) : null;
    const newValue = body.op === 'remove' ? null : JSON.stringify(blockAttributes(nextBlock));
    const inserted = await this.regions.insertBlockCorrection({
      id: body.id,
      userId,
      documentId,
      op: body.op,
      beforeRegionId: existing?.id ?? null,
      afterRegionId: afterRegion?.id ?? null,
      oldValue,
      newValue,
    });
    if (!inserted) {
      const replay = body.beforeRegionId
        ? await this.regions.findRegionById(documentId, body.beforeRegionId)
        : afterRegion;
      return {
        noChange: false,
        correction: toCorrectionDto(
          {
            id: body.id,
            documentId,
            op: body.op,
            beforeRegionId: existing?.id ?? null,
            afterRegionId: afterRegion?.id ?? replay?.id ?? null,
            oldValue,
            newValue,
          },
          new Date().toISOString()
        ),
        region: replay ? stripSuperseded(replay) : afterRegion ? stripSuperseded(afterRegion) : null,
      };
    }

    const region = afterRegion
      ? stripSuperseded(afterRegion)
      : body.op === 'remove'
        ? null
        : existing
          ? stripSuperseded(existing)
          : null;
    return {
      noChange: false,
      correction: toCorrectionDto(
        {
          id: body.id,
          documentId,
          op: body.op,
          beforeRegionId: existing?.id ?? null,
          afterRegionId: afterRegion?.id ?? null,
          oldValue,
          newValue,
        },
        new Date().toISOString()
      ),
      region,
    };
  }

  private resolveSelection(
    body: ApplyBlockCorrectionRequest,
    existing: DocumentRegionRecord | null,
    tokens: LayoutToken[]
  ): { page: number; rect: { x0: number; y0: number; x1: number; y1: number }; tokens: LayoutToken[] } {
    const page = body.page ?? existing?.page ?? 1;
    const pageTokens = tokens.filter((token) => token.page === page);
    if (body.blockIndexes && body.blockIndexes.length > 0) {
      const selected = pageTokens.filter((token) => body.blockIndexes?.includes(token.blockIndex));
      const hull = snapRectToTokenHull(selected);
      if (hull) {
        return { page, rect: hull, tokens: selected };
      }
    }
    const drawn = normalizeRect({
      x0: body.x0 ?? existing?.x0 ?? 0,
      y0: body.y0 ?? existing?.y0 ?? 0,
      x1: body.x1 ?? existing?.x1 ?? 0,
      y1: body.y1 ?? existing?.y1 ?? 0,
    });
    if (drawn) {
      const selected = tokensInsideRect(pageTokens, drawn);
      const snapped = snapRectToTokenHull(selected) ?? drawn;
      return { page, rect: snapped, tokens: selected };
    }
    if (existing) {
      return {
        page: existing.page,
        rect: { x0: existing.x0, y0: existing.y0, x1: existing.x1, y1: existing.y1 },
        tokens: pageTokens.filter((token) => existing.blockIndexes.includes(token.blockIndex)),
      };
    }
    if (body.op === 'set_type' || body.op === 'set_rank' || body.op === 'ignore' || body.op === 'remove') {
      return { page: 1, rect: { x0: 0, y0: 0, x1: 0.001, y1: 0.001 }, tokens: [] };
    }
    throw new ValidationError('documents.selectionRequired');
  }

  private nextBlock(
    body: ApplyBlockCorrectionRequest,
    existing: DocumentRegionRecord | null
  ): DocumentRegionBlockDto {
    const next = existing?.block ? cloneBlock(existing.block) : emptyBlock();
    if (body.blockType) {
      next.blockType = body.blockType;
      next.headingLevel = body.blockType === 'heading' ? (body.headingLevel ?? 1) : null;
    } else if (body.headingLevel != null && next.blockType === 'heading') {
      next.headingLevel = body.headingLevel;
    }
    if (body.readingRank != null) {
      next.readingRank = body.readingRank;
    } else if (body.op === 'create' && next.readingRank == null) {
      next.readingRank = 1;
    }
    return next;
  }
}
