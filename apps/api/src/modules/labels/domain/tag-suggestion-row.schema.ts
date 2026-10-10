// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { z } from 'zod';

export const tagSuggestionJoinRowSchema = z
  .object({
    reason: z.unknown(),
    confidence: z.unknown(),
    source: z.unknown(),
    decision_tier: z.unknown(),
    id: z.string().uuid(),
    user_id: z.string(),
    name: z.string(),
    color: z.string().nullable(),
    is_inbox: z.boolean(),
    matching_algorithm: z.string(),
    match_text: z.string(),
    created_at: z.coerce.date(),
    updated_at: z.coerce.date(),
  })
  .passthrough();

export type TagSuggestionJoinRow = z.infer<typeof tagSuggestionJoinRowSchema>;
