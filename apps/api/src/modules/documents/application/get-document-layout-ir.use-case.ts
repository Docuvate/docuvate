// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type {
  LayoutIrBlock,
  LayoutIrDocument,
  LayoutIrPage,
  LayoutIrTable,
  LayoutIrTableCell,
} from '@docuvate/contracts';
import { Inject, Injectable } from '@nestjs/common';

import { DocumentAuthorizationService } from '../../../shared/application/document-authorization.service.js';
import type { AuthorizationSubject } from '../../../shared/domain/authorization.js';
import { NotFoundError } from '../../../shared/domain/errors.js';
import { DOCUMENT_REPOSITORY, type DocumentRepository } from '../../../shared/domain/ports.js';
import { isRecord, parseNumber } from '../../../shared/infrastructure/database/row-parse.js';

function isLayoutIrBlock(value: unknown): value is LayoutIrBlock {
  if (!isRecord(value)) {
    return false;
  }
  return (
    typeof value.page === 'number' &&
    typeof value.x === 'number' &&
    typeof value.y === 'number' &&
    typeof value.width === 'number' &&
    typeof value.height === 'number' &&
    typeof value.text === 'string'
  );
}

function isLayoutIrTableCell(value: unknown): value is LayoutIrTableCell {
  if (!isRecord(value)) {
    return false;
  }
  return (
    typeof value.text === 'string' &&
    typeof value.x === 'number' &&
    typeof value.y === 'number' &&
    typeof value.width === 'number' &&
    typeof value.height === 'number'
  );
}

function parseLayoutIrTableRows(value: unknown): LayoutIrTableCell[][] {
  if (!Array.isArray(value)) {
    return [];
  }
  const rows: LayoutIrTableCell[][] = [];
  for (const row of value) {
    if (!Array.isArray(row)) {
      continue;
    }
    const cells: LayoutIrTableCell[] = [];
    for (const cell of row) {
      if (isLayoutIrTableCell(cell)) {
        cells.push(cell);
      }
    }
    if (cells.length > 0) {
      rows.push(cells);
    }
  }
  return rows;
}

function parseLayoutIrTables(value: unknown): LayoutIrTable[] {
  if (!Array.isArray(value)) {
    return [];
  }
  const tables: LayoutIrTable[] = [];
  for (const item of value) {
    if (!isRecord(item)) {
      continue;
    }
    const rows = parseLayoutIrTableRows(item.rows);
    if (rows.length === 0) {
      continue;
    }
    const page = parseNumber(item.page, -1);
    const x = parseNumber(item.x, -1);
    const y = parseNumber(item.y, -1);
    const width = parseNumber(item.width, -1);
    const height = parseNumber(item.height, -1);
    const columnCount = parseNumber(item.columnCount, -1);
    if (page < 0 || x < 0 || y < 0 || width <= 0 || height <= 0 || columnCount <= 0) {
      continue;
    }
    tables.push({
      page,
      x,
      y,
      width,
      height,
      columnCount,
      rows,
    });
  }
  return tables;
}

function parseLayoutIrBlocks(value: unknown): LayoutIrBlock[] {
  if (!Array.isArray(value)) {
    return [];
  }
  const blocks: LayoutIrBlock[] = [];
  for (const item of value) {
    if (isLayoutIrBlock(item)) {
      blocks.push(item);
    }
  }
  return blocks;
}

function parseLayoutIrPage(raw: unknown): LayoutIrPage | null {
  if (!isRecord(raw)) {
    return null;
  }
  const page = parseNumber(raw.page, -1);
  const widthPt = parseNumber(raw.widthPt, -1);
  const heightPt = parseNumber(raw.heightPt, -1);
  if (page < 0 || widthPt <= 0 || heightPt <= 0) {
    return null;
  }
  const blocks = parseLayoutIrBlocks(raw.blocks);
  if (blocks.length === 0 && Array.isArray(raw.blocks) && raw.blocks.length > 0) {
    return null;
  }
  const tables = parseLayoutIrTables(raw.tables);
  const parsed: LayoutIrPage = {
    page,
    widthPt,
    heightPt,
    blocks,
  };
  if (tables.length > 0) {
    parsed.tables = tables;
  }
  return parsed;
}

function parseLayoutIr(raw: Record<string, unknown>): LayoutIrDocument | null {
  if (raw.version !== 1 || !Array.isArray(raw.pages)) {
    return null;
  }
  const pages: LayoutIrPage[] = [];
  for (const pageRaw of raw.pages) {
    const page = parseLayoutIrPage(pageRaw);
    if (!page) {
      return null;
    }
    pages.push(page);
  }
  return { version: 1, pages };
}

@Injectable()
export class GetDocumentLayoutIrUseCase {
  constructor(
    @Inject(DOCUMENT_REPOSITORY) private readonly documents: DocumentRepository,
    private readonly documentAuthz: DocumentAuthorizationService
  ) {}

  async execute(
    id: string,
    userId: string,
    subject: AuthorizationSubject
  ): Promise<LayoutIrDocument> {
    const doc = await this.documents.findByIdForUser(id, userId);
    if (!doc) {
      throw new NotFoundError('Document');
    }
    await this.documentAuthz.assert(subject, 'document:read', doc);
    const raw = await this.documents.findLayoutIrForUser(id, userId);
    if (!raw) {
      throw new NotFoundError('LayoutIr');
    }
    const parsed = parseLayoutIr(raw);
    if (!parsed) {
      throw new NotFoundError('LayoutIr');
    }
    return parsed;
  }
}
