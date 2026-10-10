// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { LayoutIrBlock, LayoutIrDocument, LayoutIrPage } from '@docuvate/contracts';
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
    typeof value.type === 'string' &&
    typeof value.x === 'number' &&
    typeof value.y === 'number' &&
    typeof value.width === 'number' &&
    typeof value.height === 'number' &&
    typeof value.text === 'string'
  );
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
  return {
    page,
    widthPt,
    heightPt,
    blocks,
  };
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
