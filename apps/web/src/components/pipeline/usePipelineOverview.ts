// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { useCallback, useEffect, useState } from 'react';

import { getDashboardStatistics, getDocumentReviewQueueSummary } from '../../lib/api';
import { type PipelineOverview, pipelineOverview } from '../../lib/documentPipeline';

/**
 * Workspace stage counts from the existing statistics + review-queue endpoints.
 * Fails soft: on error the overview stays `null` and callers hide counts.
 */
export function usePipelineOverview(refreshKey: unknown = null): PipelineOverview | null {
  const [overview, setOverview] = useState<PipelineOverview | null>(null);

  const load = useCallback(async () => {
    try {
      const [statistics, summary] = await Promise.all([
        getDashboardStatistics(),
        getDocumentReviewQueueSummary().catch(() => ({ pendingCount: 0 })),
      ]);
      setOverview(pipelineOverview(statistics, summary.pendingCount));
    } catch {
      setOverview(null);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load, refreshKey]);

  return overview;
}
