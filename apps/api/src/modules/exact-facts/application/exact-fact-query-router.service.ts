// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Injectable } from '@nestjs/common';

import type { ParsedExactFactQuery } from '../domain/exact-fact-query.types.js';
import { parseExactFactQuery } from '../domain/parse-exact-fact-query.js';

@Injectable()
export class ExactFactQueryRouterService {
  /** CPU-only: returns a structured query when the user message targets the fact index. */
  parse(userMessage: string): ParsedExactFactQuery | null {
    return parseExactFactQuery(userMessage);
  }
}
