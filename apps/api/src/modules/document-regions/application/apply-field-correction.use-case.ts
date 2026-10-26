// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { randomUUID } from 'node:crypto';

import type {
  ApplyFieldCorrectionRequest,
  ApplyFieldCorrectionResponse,
  DocumentCorrectionDto,
  DocumentRegionDto,
  ExtractedField,
  FieldCorrectionOp,
  FieldCorrectionScope,
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
  EXTRACTION_FIELD_FEEDBACK_REPOSITORY,
  type ExtractionFieldFeedbackRepository,
} from '../../../shared/domain/ports.js';
import { layoutTokensFromIr } from '../domain/layout-tokens.js';
import { isUuid } from '../domain/parse-uuid.js';

const FIELD_OPS = new Set<FieldCorrectionOp>(['create', 'reanchor', 'edit_value', 'remove']);
const SCOPES = new Set<FieldCorrectionScope>(['document', 'label', 'always']);

function normalizeFieldKey(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) {
    return '';
  }
  if (trimmed.includes(':')) {
    return trimmed;
  }
  return `global:${trimmed}`;
}

function toCorrectionDto(
  input: {
    id: string;
    documentId: string;
    op: FieldCorrectionOp;
    fieldKey: string;
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
    kind: 'field',
    status: 'active',
    op: input.op,
    fieldKey: input.fieldKey,
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
    field: region.field,
    createdAt: region.createdAt,
  };
}

@Injectable()
export class ApplyFieldCorrectionUseCase {
  constructor(
    @Inject(DOCUMENT_REPOSITORY) private readonly documents: DocumentRepository,
    @Inject(DOCUMENT_REGION_REPOSITORY) private readonly regions: DocumentRegionRepository,
    @Inject(EXTRACTION_FIELD_FEEDBACK_REPOSITORY)
    private readonly feedback: ExtractionFieldFeedbackRepository,
    private readonly authorization: DocumentAuthorizationService
  ) {}

  async execute(
    documentId: string,
    userId: string,
    subject: AuthorizationSubject,
    body: ApplyFieldCorrectionRequest
  ): Promise<ApplyFieldCorrectionResponse> {
    if (!isUuid(body.id)) {
      throw new ValidationError('documents.correctionIdInvalid');
    }
    if (!FIELD_OPS.has(body.op)) {
      throw new ValidationError('documents.correctionOpInvalid');
    }
    const fieldKey = normalizeFieldKey(body.fieldKey);
    if (!fieldKey) {
      throw new ValidationError('documents.fieldKeyRequired');
    }
    const scope = body.scope ?? 'document';
    if (!SCOPES.has(scope)) {
      throw new ValidationError('documents.correctionScopeInvalid');
    }
    if (scope === 'label' && !body.tagId) {
      throw new ValidationError('documents.correctionTagRequired');
    }
    const doc = await this.documents.findByIdForUser(documentId, userId);
    if (!doc) {
      throw new NotFoundError('Document');
    }
    await this.authorization.assert(subject, 'document:write', doc);

    const snapshot = await this.regions.findLayoutIrSnapshot(documentId, userId);
    const tokens = snapshot ? layoutTokensFromIr(snapshot.ir) : [];
    const existing = await this.regions.findActiveFieldRegion(documentId, fieldKey);
    const currentFields = doc.extraction?.fields ?? [];
    const currentField = currentFields.find((field) => field.key === fieldKey);
    const currentValue = currentField?.value ?? '';

    const resolved = this.resolveSelection(body, existing, tokens);
    const nextValue = this.nextValue(body, resolved.tokens, currentValue);
    const beforePayload = existing
      ? canonicalRegionPayload({
          role: 'field',
          page: existing.page,
          rect: { x0: existing.x0, y0: existing.y0, x1: existing.x1, y1: existing.y1 },
          blockIndexes: existing.blockIndexes,
          fieldKey,
          valueOverride: existing.field?.valueOverride ?? currentValue,
        })
      : canonicalRegionPayload({
          role: 'field',
          page: 1,
          rect: { x0: 0, y0: 0, x1: 0.001, y1: 0.001 },
          blockIndexes: [],
          fieldKey,
          valueOverride: currentValue,
        });
    const afterPayload =
      body.op === 'remove'
        ? canonicalRegionPayload({
            role: 'field',
            page: existing?.page ?? 1,
            rect: existing
              ? { x0: existing.x0, y0: existing.y0, x1: existing.x1, y1: existing.y1 }
              : { x0: 0, y0: 0, x1: 0.001, y1: 0.001 },
            blockIndexes: [],
            fieldKey,
            valueOverride: null,
          })
        : canonicalRegionPayload({
            role: 'field',
            page: resolved.page,
            rect: resolved.rect,
            blockIndexes: resolved.tokens.map((token) => token.blockIndex),
            fieldKey,
            valueOverride: nextValue,
          });
    if (beforePayload === afterPayload) {
      return { noChange: true, correction: null, region: existing ? stripSuperseded(existing) : null };
    }

    const valueChanged = currentValue.trim() !== nextValue.trim();
    const geometryChanged =
      body.op === 'create' ||
      body.op === 'reanchor' ||
      body.op === 'remove' ||
      (existing != null &&
        (existing.page !== resolved.page ||
          existing.blockIndexes.join(',') !==
            resolved.tokens.map((token) => token.blockIndex).join(',')));

    let afterRegion: DocumentRegionRecord | null = null;
    if (body.op !== 'remove' && (geometryChanged || !existing)) {
      if (!snapshot) {
        throw new ValidationError('documents.layoutIrMissing');
      }
      afterRegion = await this.regions.insertRegion({
        id: randomUUID(),
        documentId,
        page: resolved.page,
        shape: body.shape === 'polygon' ? 'polygon' : 'rect',
        role: 'field',
        x0: resolved.rect.x0,
        y0: resolved.rect.y0,
        x1: resolved.rect.x1,
        y1: resolved.rect.y1,
        irSha256: snapshot.irSha256,
        blockIndexes: resolved.tokens.map((token) => token.blockIndex),
        fieldKey,
        valueOverride: valueChanged ? nextValue : null,
      });
      if (existing) {
        await this.regions.supersedeRegion(existing.id, afterRegion.id);
      }
      await this.regions.replaceFieldTokenSpans(
        documentId,
        fieldKey,
        resolved.tokens.map((token) => token.blockIndex)
      );
    } else if (body.op === 'remove' && existing) {
      await this.regions.supersedeRegion(existing.id, null);
      await this.regions.replaceFieldTokenSpans(documentId, fieldKey, []);
    }

    const inserted = await this.regions.insertFieldCorrection({
      id: body.id,
      userId,
      documentId,
      op: body.op,
      fieldKey,
      beforeRegionId: existing?.id ?? null,
      afterRegionId: afterRegion?.id ?? null,
      oldValue: valueChanged ? currentValue : null,
      newValue: valueChanged ? nextValue : null,
      scope,
      tagId: scope === 'label' ? (body.tagId ?? null) : null,
    });
    if (!inserted) {
      const replay = await this.regions.findActiveFieldRegion(documentId, fieldKey);
      return {
        noChange: false,
        correction: toCorrectionDto(
          {
            id: body.id,
            documentId,
            op: body.op,
            fieldKey,
            beforeRegionId: existing?.id ?? null,
            afterRegionId: afterRegion?.id ?? replay?.id ?? null,
            oldValue: valueChanged ? currentValue : null,
            newValue: valueChanged ? nextValue : null,
          },
          new Date().toISOString()
        ),
        region: replay ? stripSuperseded(replay) : afterRegion ? stripSuperseded(afterRegion) : null,
      };
    }

    if (valueChanged && body.op !== 'remove') {
      await this.feedback.insertCorrectionsIdempotent(userId, [
        {
          documentId,
          fieldKey,
          oldValue: currentValue,
          newValue: nextValue,
          labelTagIds: [],
          fieldTagId: currentField?.tagId ?? null,
        },
      ]);
    }

    const nextFields = this.mergeFields(currentFields, fieldKey, nextValue, body.op === 'remove');
    await this.documents.updateForUser(documentId, userId, { extractionFields: nextFields });

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
          fieldKey,
          beforeRegionId: existing?.id ?? null,
          afterRegionId: afterRegion?.id ?? null,
          oldValue: valueChanged ? currentValue : null,
          newValue: valueChanged ? nextValue : null,
        },
        new Date().toISOString()
      ),
      region,
    };
  }

  private resolveSelection(
    body: ApplyFieldCorrectionRequest,
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
    if (body.op === 'edit_value' || body.op === 'remove') {
      return { page: 1, rect: { x0: 0, y0: 0, x1: 0.001, y1: 0.001 }, tokens: [] };
    }
    throw new ValidationError('documents.selectionRequired');
  }

  private nextValue(
    body: ApplyFieldCorrectionRequest,
    tokens: LayoutToken[],
    currentValue: string
  ): string {
    if (body.op === 'remove') {
      return currentValue;
    }
    if (body.valueOverride != null) {
      return body.valueOverride;
    }
    const fromTokens = joinedTokenText(tokens);
    return fromTokens || currentValue;
  }

  private mergeFields(
    fields: ExtractedField[],
    fieldKey: string,
    value: string,
    removed: boolean
  ): ExtractedField[] {
    if (removed) {
      return fields.filter((field) => field.key !== fieldKey);
    }
    const next: ExtractedField[] = [];
    let found = false;
    for (const field of fields) {
      if (field.key === fieldKey) {
        next.push({ ...field, value, confidence: 1 });
        found = true;
      } else {
        next.push(field);
      }
    }
    if (!found) {
      next.push({ key: fieldKey, value, confidence: 1 });
    }
    return next;
  }
}
