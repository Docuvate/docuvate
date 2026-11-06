// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Database, ListChecks, type LucideIcon, ScanText, Upload } from 'lucide-react';

import type { PipelineStage } from '../../lib/documentPipeline';

export const PIPELINE_STAGE_ICONS: Record<PipelineStage, LucideIcon> = {
  upload: Upload,
  structure: ScanText,
  review: ListChecks,
  record: Database,
};
