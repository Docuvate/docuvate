// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { MethodNotAllowedException } from '@nestjs/common';

export interface TagSuggestionsMethodReply {
  header(name: string, value: string): unknown;
}

export function throwTagSuggestionsGetNotAllowed(reply: TagSuggestionsMethodReply): never {
  reply.header('Allow', 'POST');
  throw new MethodNotAllowedException();
}
