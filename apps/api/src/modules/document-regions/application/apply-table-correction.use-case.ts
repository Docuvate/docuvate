// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { randomUUID } from 'node:crypto';

import type {
  ApplyTableCorrectionRequest,
  ApplyTableCorrectionResponse,
  DocumentCorrectionDto,
  DocumentRegionDto,
  DocumentRegionTableDto,
  LayoutToken,
  TableCorrectionOp,
} from '@docuvate/contracts';
import {
  canonicalRegionPayload,
  inferTableGrid,
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

const TABLE_OPS = new Set<TableCorrectionOp>(['create', 'set_headers', 'edit_cell', 'remove']);

function toCorrectionDto(
  input: {
    id: string;
    documentId: string;
    op: TableCorrectionOp;
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
    kind: 'table',
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
    table: region.table,
    createdAt: region.createdAt,
  };
}

function tableAttributes(table: DocumentRegionTableDto): Record<string, string | number | boolean | null> {
  const cells = [...table.cells]
    .sort((left, right) => (left.row === right.row ? left.col - right.col : left.row - right.row))
    .map((cell) => `${String(cell.row)},${String(cell.col)}:${cell.text}`)
    .join('|');
  return {
    tableType: table.tableType,
    headerRows: table.headerRows,
    headerCols: table.headerCols,
    cells,
  };
}

function cloneTable(table: DocumentRegionTableDto): DocumentRegionTableDto {
  return {
    tableType: table.tableType,
    headerRows: table.headerRows,
    headerCols: table.headerCols,
    rules: table.rules.map((rule) => ({ ...rule })),
    merges: table.merges.map((merge) => ({ ...merge })),
    cells: table.cells.map((cell) => ({ ...cell })),
  };
}

function emptyTable(): DocumentRegionTableDto {
  return {
    tableType: 'other',
    headerRows: 0,
    headerCols: 0,
    rules: [],
    merges: [],
    cells: [],
  };
}

@Injectable()
export class ApplyTableCorrectionUseCase {
  constructor(
    @Inject(DOCUMENT_REPOSITORY) private readonly documents: DocumentRepository,
    @Inject(DOCUMENT_REGION_REPOSITORY) private readonly regions: DocumentRegionRepository,
    private readonly authorization: DocumentAuthorizationService
  ) {}

  async execute(
    documentId: string,
    userId: string,
    subject: AuthorizationSubject,
    body: ApplyTableCorrectionRequest
  ): Promise<ApplyTableCorrectionResponse> {
    if (!isUuid(body.id)) {
      throw new ValidationError('documents.correctionIdInvalid');
    }
    if (!TABLE_OPS.has(body.op)) {
      throw new ValidationError('documents.correctionOpInvalid');
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
    if (existing && existing.role !== 'table') {
      throw new ValidationError('documents.tableRegionRequired');
    }

    const resolved = this.resolveSelection(body, existing, tokens);
    const nextTable = this.nextTable(body, existing, resolved.tokens, resolved.rect);
    const beforePayload = existing
      ? canonicalRegionPayload({
          role: 'table',
          page: existing.page,
          rect: { x0: existing.x0, y0: existing.y0, x1: existing.x1, y1: existing.y1 },
          blockIndexes: existing.blockIndexes,
          attributes: tableAttributes(existing.table ?? emptyTable()),
        })
      : canonicalRegionPayload({
          role: 'table',
          page: 1,
          rect: { x0: 0, y0: 0, x1: 0.001, y1: 0.001 },
          blockIndexes: [],
          attributes: tableAttributes(emptyTable()),
        });
    const afterPayload =
      body.op === 'remove'
        ? canonicalRegionPayload({
            role: 'table',
            page: existing?.page ?? 1,
            rect: existing
              ? { x0: existing.x0, y0: existing.y0, x1: existing.x1, y1: existing.y1 }
              : { x0: 0, y0: 0, x1: 0.001, y1: 0.001 },
            blockIndexes: [],
            attributes: tableAttributes(emptyTable()),
          })
        : canonicalRegionPayload({
            role: 'table',
            page: resolved.page,
            rect: resolved.rect,
            blockIndexes: resolved.tokens.map((token) => token.blockIndex),
            attributes: tableAttributes(nextTable),
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
        role: 'table',
        x0: resolved.rect.x0,
        y0: resolved.rect.y0,
        x1: resolved.rect.x1,
        y1: resolved.rect.y1,
        irSha256: snapshot.irSha256,
        blockIndexes: resolved.tokens.map((token) => token.blockIndex),
        boundText: joinedTokenText(resolved.tokens),
        table: nextTable,
      });
      if (existing) {
        await this.regions.supersedeRegion(existing.id, afterRegion.id);
      }
    } else if (existing) {
      await this.regions.supersedeRegion(existing.id, null);
    }

    const oldValue = existing ? JSON.stringify(tableAttributes(existing.table ?? emptyTable())) : null;
    const newValue = body.op === 'remove' ? null : JSON.stringify(tableAttributes(nextTable));
    const inserted = await this.regions.insertTableCorrection({
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
    body: ApplyTableCorrectionRequest,
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
    if (body.op === 'set_headers' || body.op === 'edit_cell' || body.op === 'remove') {
      return { page: 1, rect: { x0: 0, y0: 0, x1: 0.001, y1: 0.001 }, tokens: [] };
    }
    throw new ValidationError('documents.selectionRequired');
  }

  private nextTable(
    body: ApplyTableCorrectionRequest,
    existing: DocumentRegionRecord | null,
    tokens: LayoutToken[],
    rect: { x0: number; y0: number; x1: number; y1: number }
  ): DocumentRegionTableDto {
    if (body.op === 'create' || !existing?.table) {
      const inferred = inferTableGrid(tokens, rect);
      return {
        tableType: body.tableType ?? (inferred.headerRows > 0 ? 'line_items' : 'other'),
        headerRows: body.headerRows ?? inferred.headerRows,
        headerCols: body.headerCols ?? inferred.headerCols,
        rules: inferred.rules,
        merges: [],
        cells: inferred.cells,
      };
    }
    const next = cloneTable(existing.table);
    if (body.tableType) {
      next.tableType = body.tableType;
    }
    if (body.op === 'set_headers') {
      if (body.headerRows != null) {
        next.headerRows = Math.max(0, body.headerRows);
      }
      if (body.headerCols != null) {
        next.headerCols = Math.max(0, body.headerCols);
      }
    }
    if (body.op === 'edit_cell' && body.cell) {
      const match = next.cells.find(
        (cell) => cell.row === body.cell?.row && cell.col === body.cell.col
      );
      if (match) {
        match.text = body.cell.text;
      } else {
        next.cells.push({ row: body.cell.row, col: body.cell.col, text: body.cell.text });
      }
    }
    return next;
  }
}
