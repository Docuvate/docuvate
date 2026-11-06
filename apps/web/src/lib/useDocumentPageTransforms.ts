// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { degreesToQuarterTurns, quarterTurnsToDegrees } from '@docuvate/contracts';
import { useCallback, useEffect, useState } from 'react';

import { applyDocumentPageTransform, listDocumentPageTransforms } from './api';

type PageRotationDeg = 0 | 90 | 180 | 270;

export function useDocumentPageTransforms(documentId: string | undefined) {
  const [byPage, setByPage] = useState<Record<number, PageRotationDeg>>({});

  useEffect(() => {
    if (!documentId) {
      setByPage({});
      return;
    }
    let cancelled = false;
    void listDocumentPageTransforms(documentId)
      .then((response) => {
        if (cancelled) return;
        const next: Record<number, PageRotationDeg> = {};
        for (const item of response.transforms) {
          next[item.page] = quarterTurnsToDegrees(item.rotationQuarterTurns);
        }
        setByPage(next);
      })
      .catch(() => {
        if (!cancelled) setByPage({});
      });
    return () => {
      cancelled = true;
    };
  }, [documentId]);

  const rotationForPage = useCallback(
    (page: number): PageRotationDeg => byPage[page] ?? 0,
    [byPage]
  );

  const rotatePageClockwise = useCallback(
    async (page: number) => {
      if (!documentId) return 0;
      const current = byPage[page] ?? 0;
      const nextDeg: PageRotationDeg =
        current === 0 ? 90 : current === 90 ? 180 : current === 180 ? 270 : 0;
      const turns = degreesToQuarterTurns(nextDeg);
      setByPage((prev) => ({ ...prev, [page]: nextDeg }));
      await applyDocumentPageTransform(documentId, page, {
        id: crypto.randomUUID(),
        rotationQuarterTurns: turns,
      });
      return nextDeg;
    },
    [byPage, documentId]
  );

  return { rotationForPage, rotatePageClockwise, byPage };
}
