// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { DocumentRegionDto } from '@docuvate/contracts';
import { useEffect } from 'react';

import { findFieldRegion } from '../../lib/findFieldRegion';
import type { DocumentSelectionTool } from './DocumentSelectionTools';

export function useDocumentLayoutPositionEdit(
  positionEditFieldKey: string | null | undefined,
  fieldRegions: readonly DocumentRegionDto[],
  onViewerPageChange: (page: number) => void,
  onPositionEditHandled: (() => void) | undefined,
  setReanchorFieldKey: (key: string | null) => void,
  setSelectionTool: (tool: DocumentSelectionTool) => void,
  setSelectedFieldKey: (key: string | null) => void,
  setBboxEditRect: (
    rect: { page: number; x0: number; y0: number; x1: number; y1: number } | null
  ) => void
): void {
  useEffect(() => {
    if (!positionEditFieldKey) return;
    const region = findFieldRegion(positionEditFieldKey, fieldRegions);
    if (!region) {
      setReanchorFieldKey(positionEditFieldKey);
      setSelectionTool('rect');
      onPositionEditHandled?.();
      return;
    }
    setSelectedFieldKey(positionEditFieldKey);
    setBboxEditRect({
      page: region.page,
      x0: region.x0,
      y0: region.y0,
      x1: region.x1,
      y1: region.y1,
    });
    onViewerPageChange(region.page);
    onPositionEditHandled?.();
  }, [
    positionEditFieldKey,
    fieldRegions,
    onViewerPageChange,
    onPositionEditHandled,
    setReanchorFieldKey,
    setSelectionTool,
    setSelectedFieldKey,
    setBboxEditRect,
  ]);
}