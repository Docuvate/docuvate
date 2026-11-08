// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { DocumentRegionDto, LayoutIrDocument } from '@docuvate/contracts';

import { buildLayoutOverlays, type LayoutOverlayRegion } from './layoutOverlayModel';

interface WorkspacePdfOverlay {
  id: string;
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
  kind: 'heading' | 'field' | 'table' | 'text';
  label: string;
  value?: string;
}

const REGION_FIELD_OVERLAY_PREFIX = 'region-field-';
const REGION_TABLE_OVERLAY_PREFIX = 'region-table-';

export function regionFieldOverlayId(regionId: string): string {
  return `${REGION_FIELD_OVERLAY_PREFIX}${regionId}`;
}

export function regionIdFromFieldOverlay(overlayId: string): string | null {
  if (!overlayId.startsWith(REGION_FIELD_OVERLAY_PREFIX)) {
    return null;
  }
  return overlayId.slice(REGION_FIELD_OVERLAY_PREFIX.length);
}

export function regionTableOverlayId(regionId: string): string {
  return `${REGION_TABLE_OVERLAY_PREFIX}${regionId}`;
}

export function regionIdFromTableOverlay(overlayId: string): string | null {
  if (!overlayId.startsWith(REGION_TABLE_OVERLAY_PREFIX)) {
    return null;
  }
  return overlayId.slice(REGION_TABLE_OVERLAY_PREFIX.length);
}

/** Labels the workspace already translated. The builder does not call i18n. */
export interface WorkspaceOverlayLabels {
  correctedTable: (ordinal: string) => string;
  detectedTable: (oneBasedIndex: number) => string;
  field: (fieldKey: string) => string;
  unnamedField: string;
}

export function buildWorkspaceLayoutOverlays(
  layoutIr: LayoutIrDocument | null,
  tableRegions: readonly DocumentRegionDto[]
): LayoutOverlayRegion[] {
  const base = layoutIr ? buildLayoutOverlays(layoutIr) : [];
  const corrected: LayoutOverlayRegion[] = tableRegions.map((region, index) => ({
    id: regionTableOverlayId(region.id),
    page: region.page,
    x: region.x0,
    y: region.y0,
    width: Math.max(0, region.x1 - region.x0),
    height: Math.max(0, region.y1 - region.y0),
    kind: 'table',
    label: String(index + 1),
    tableIndex: 1000 + index,
  }));
  return [...base, ...corrected];
}

export function buildWorkspacePdfOverlays(
  overlays: readonly LayoutOverlayRegion[],
  fieldRegions: readonly DocumentRegionDto[],
  labels: WorkspaceOverlayLabels
): WorkspacePdfOverlay[] {
  const fromIr = overlays.map((overlay) => {
    let label = overlay.label;
    if (overlay.id.startsWith(REGION_TABLE_OVERLAY_PREFIX)) {
      label = labels.correctedTable(overlay.label);
    } else if (overlay.kind === 'table' && overlay.tableIndex != null) {
      label = labels.detectedTable(overlay.tableIndex + 1);
    } else if (overlay.kind === 'field' && overlay.label) {
      label = labels.field(overlay.label);
    }
    return {
      id: overlay.id,
      page: overlay.page,
      x: overlay.x,
      y: overlay.y,
      width: overlay.width,
      height: overlay.height,
      kind: overlay.kind,
      label,
      value: overlay.value,
    };
  });
  const fromRegions: WorkspacePdfOverlay[] = fieldRegions.map((region) => {
    const fieldKey = region.field?.fieldKey ?? '';
    return {
      id: regionFieldOverlayId(region.id),
      page: region.page,
      x: region.x0,
      y: region.y0,
      width: Math.max(0, region.x1 - region.x0),
      height: Math.max(0, region.y1 - region.y0),
      kind: 'field',
      label: fieldKey ? labels.field(fieldKey) : labels.unnamedField,
      value: region.field?.valueOverride ?? undefined,
    };
  });
  return [...fromIr, ...fromRegions];
}
