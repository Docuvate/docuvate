// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { z } from 'zod';

export const trainingExampleRawRowSchema = z.object({
  embedding: z.unknown(),
  tagId: z.string().uuid(),
  documentId: z.string().uuid(),
});

export type TrainingExampleRawRow = z.infer<typeof trainingExampleRawRowSchema>;
