// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Injectable } from '@nestjs/common';

import type { ParsedExactFactQuery } from '../domain/exact-fact-query.types.js';
import type { ExactFactRow } from '../domain/exact-fact-row.js';
import { formatExactFactAnswer } from '../domain/format-exact-fact-answer.js';
import { PgExactFactQueryRepository } from '../infrastructure/pg-exact-fact-query.repository.js';

export interface ExactFactChatCitation {
  ordinal: number;
  chunkId: string;
  quote: string;
  charStart: number;
  charEnd: number;
}

export interface ExactFactChatAnswer {
  content: string;
  citations: ExactFactChatCitation[];
}

function factDisplayQuote(row: ExactFactRow): string {
  if (row.kind === 'amount' && row.amountNumeric != null) {
    const currency = row.currencyCode ? ` ${row.currencyCode}` : '';
    return `${row.predicateKey}: ${String(row.amountNumeric)}${currency}`.trim();
  }
  if (row.kind === 'date' && row.valueDateIso) {
    return `${row.predicateKey}: ${row.valueDateIso}`;
  }
  if (row.valueText) {
    return `${row.predicateKey}: ${row.valueText}`;
  }
  return row.predicateKey;
}

@Injectable()
export class TryExactFactChatAnswerUseCase {
  constructor(private readonly facts: PgExactFactQueryRepository) {}

  async execute(input: {
    tenantId: string;
    query: ParsedExactFactQuery;
    locale: 'de' | 'en';
    scope: 'document' | 'library';
    documentIds: readonly string[];
  }): Promise<ExactFactChatAnswer | null> {
    const documentFilter =
      input.scope === 'document' && input.documentIds.length > 0
        ? input.documentIds
        : undefined;

    let lookupRows: ExactFactRow[] = [];
    let sumAmount: { total: number; currencyCode: string | null; factCount: number } | null = null;
    let factCount: number | null = null;

    switch (input.query.kind) {
      case 'lookup':
        lookupRows = await this.facts.lookupFacts(input.tenantId, input.query, documentFilter);
        break;
      case 'sum_amounts':
        sumAmount = await this.facts.sumMatchingAmounts(input.tenantId, input.query, documentFilter);
        if (sumAmount) {
          const candidates = await this.facts.lookupFacts(
            input.tenantId,
            { ...input.query, kind: 'lookup' },
            documentFilter
          );
          lookupRows = candidates.filter((row) => row.kind === 'amount');
        }
        break;
      case 'count_facts':
        factCount = await this.facts.countMatchingFacts(input.tenantId, input.query, documentFilter);
        break;
      default: {
        const exhaustive: never = input.query.kind;
        throw new Error(String(exhaustive));
      }
    }

    const content = formatExactFactAnswer({
      locale: input.locale,
      query: input.query,
      lookupRows,
      sumAmount,
      factCount,
    });
    if (!content) {
      return null;
    }

    const citationRows =
      input.query.kind === 'lookup' || input.query.kind === 'sum_amounts'
        ? lookupRows.slice(0, 8)
        : [];

    const citations: ExactFactChatCitation[] = [];
    for (let index = 0; index < citationRows.length; index += 1) {
      const row = citationRows[index];
      const chunk = await this.facts.resolveChunkForSpan(
        input.tenantId,
        row.documentId,
        row.charStart,
        row.charEnd,
        row.page
      );
      if (!chunk) {
        continue;
      }
      const slice = await this.facts.loadDocumentQuoteSlice(
        input.tenantId,
        row.documentId,
        row.charStart,
        row.charEnd
      );
      const quote = slice && slice.length > 0 ? slice : factDisplayQuote(row);
      citations.push({
        ordinal: index + 1,
        chunkId: chunk.chunkId,
        quote,
        charStart: chunk.charStart,
        charEnd: chunk.charEnd,
      });
    }

    return { content, citations };
  }
}
